"""
In-memory cache layer for token blacklist, CSRF tokens, rate limiting, and sessions.
Replaces Redis for single-instance deployments. Includes TTL expiry management.
Thread-safe for Gunicorn multi-worker use with locks.
"""

import time
import threading
from typing import Any, Optional, Dict
from datetime import datetime, timedelta


class InMemoryCache:
    """
    Simple thread-safe in-memory cache with TTL support.
    
    Key features:
    - Automatic expiration of keys based on TTL
    - Thread-safe operations (for Gunicorn multi-worker)
    - Background cleanup of expired keys every 5 minutes
    - Atomic increment operations for rate limiting
    """
    
    def __init__(self):
        self._store: Dict[str, dict] = {}  # { key: { value, expiry_timestamp } }
        self._lock = threading.RLock()
        self._cleanup_interval = 300  # 5 minutes
        self._last_cleanup = time.time()
    
    def _cleanup_expired(self):
        """Remove expired keys. Called periodically or before operations."""
        current_time = time.time()
        if current_time - self._last_cleanup > self._cleanup_interval:
            with self._lock:
                expired_keys = [
                    k for k, v in self._store.items()
                    if v['expiry'] is not None and v['expiry'] < current_time
                ]
                for k in expired_keys:
                    del self._store[k]
                self._last_cleanup = current_time
    
    def set(self, key: str, value: Any, ttl: Optional[int] = None) -> None:
        """
        Store a key-value pair with optional TTL in seconds.
        
        Args:
            key: Cache key
            value: Value to store
            ttl: Time-to-live in seconds. None = no expiration
        """
        self._cleanup_expired()
        expiry = None if ttl is None else time.time() + ttl
        with self._lock:
            self._store[key] = {'value': value, 'expiry': expiry}
    
    def get(self, key: str) -> Optional[Any]:
        """
        Retrieve a value from cache. Returns None if expired or not found.
        
        Args:
            key: Cache key
            
        Returns:
            Stored value or None
        """
        self._cleanup_expired()
        with self._lock:
            if key not in self._store:
                return None
            
            entry = self._store[key]
            if entry['expiry'] is not None and entry['expiry'] < time.time():
                del self._store[key]
                return None
            
            return entry['value']
    
    def delete(self, key: str) -> None:
        """Remove a key from cache."""
        with self._lock:
            self._store.pop(key, None)
    
    def exists(self, key: str) -> bool:
        """Check if a key exists and is not expired."""
        return self.get(key) is not None
    
    def incr(self, key: str, amount: int = 1, ttl: Optional[int] = None) -> int:
        """
        Increment a counter. Creates key with value=0 if not exists.
        Used for rate limiting.
        
        Args:
            key: Cache key
            amount: Amount to increment by (default 1)
            ttl: Time-to-live for this key (only on first creation)
            
        Returns:
            New counter value
        """
        with self._lock:
            self._cleanup_expired()
            
            if key not in self._store:
                expiry = None if ttl is None else time.time() + ttl
                self._store[key] = {'value': 0, 'expiry': expiry}
            
            entry = self._store[key]
            if entry['expiry'] is not None and entry['expiry'] < time.time():
                # Key expired, reset to 0 and increment
                expiry = None if ttl is None else time.time() + ttl
                self._store[key] = {'value': amount, 'expiry': expiry}
                return amount
            
            entry['value'] += amount
            return entry['value']
    
    def ttl(self, key: str) -> Optional[int]:
        """
        Get remaining TTL in seconds for a key.
        
        Returns:
            TTL in seconds, or -1 if no expiry, or -2 if key not found
        """
        with self._lock:
            if key not in self._store:
                return -2
            
            entry = self._store[key]
            if entry['expiry'] is None:
                return -1
            
            remaining = entry['expiry'] - time.time()
            return max(0, int(remaining))
    
    def clear(self) -> None:
        """Clear all entries from cache."""
        with self._lock:
            self._store.clear()
    
    def keys(self, pattern: Optional[str] = None) -> list:
        """
        Get all keys matching optional pattern (simple prefix matching).
        
        Args:
            pattern: Optional prefix pattern (e.g., 'bl:*' for blacklist tokens)
            
        Returns:
            List of matching keys
        """
        with self._lock:
            if pattern is None:
                return list(self._store.keys())
            
            prefix = pattern.replace('*', '')
            return [k for k in self._store.keys() if k.startswith(prefix)]
    
    def get_stats(self) -> Dict[str, Any]:
        """Get cache statistics for monitoring."""
        with self._lock:
            current_time = time.time()
            expired_count = sum(
                1 for v in self._store.values()
                if v['expiry'] is not None and v['expiry'] < current_time
            )
            return {
                'total_keys': len(self._store),
                'expired_keys': expired_count,
                'active_keys': len(self._store) - expired_count,
                'last_cleanup': self._last_cleanup
            }


# Global cache instance
_cache_instance: Optional[InMemoryCache] = None


def get_cache() -> InMemoryCache:
    """Get or create the global cache instance."""
    global _cache_instance
    if _cache_instance is None:
        _cache_instance = InMemoryCache()
    return _cache_instance
