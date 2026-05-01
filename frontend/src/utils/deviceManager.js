/**
 * Device Manager - Handles device ID generation, persistence, and detection
 * Device ID is unique per browser and persisted in localStorage
 * Used for cross-device session tracking and logout orchestration
 */

const DEVICE_ID_KEY = 'codetoday_device_id';
const DEVICE_NAME_KEY = 'codetoday_device_name';

/**
 * Generate a simple UUID v4
 * @returns {string} UUID string
 */
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Detect browser and OS
 * @returns {string} Device name like "Chrome on Windows"
 */
function detectDeviceName() {
  let browserName = 'Unknown Browser';
  let osName = 'Unknown OS';

  // Detect OS
  const userAgent = navigator.userAgent.toLowerCase();
  if (userAgent.indexOf('windows') > -1) osName = 'Windows';
  else if (userAgent.indexOf('mac') > -1) osName = 'macOS';
  else if (userAgent.indexOf('linux') > -1) osName = 'Linux';
  else if (userAgent.indexOf('android') > -1) osName = 'Android';
  else if (userAgent.indexOf('iphone') > -1 || userAgent.indexOf('ipad') > -1) osName = 'iOS';

  // Detect Browser
  if (userAgent.indexOf('edg') > -1) browserName = 'Edge';
  else if (userAgent.indexOf('chrome') > -1) browserName = 'Chrome';
  else if (userAgent.indexOf('firefox') > -1) browserName = 'Firefox';
  else if (userAgent.indexOf('safari') > -1) browserName = 'Safari';
  else if (userAgent.indexOf('trident') > -1) browserName = 'Internet Explorer';

  return `${browserName} on ${osName}`;
}

/**
 * Get or create device ID
 * Device ID is unique per browser and stored in localStorage
 * @returns {string} Device ID (UUID)
 */
export function getDeviceId() {
  let deviceId = localStorage.getItem(DEVICE_ID_KEY);
  if (!deviceId) {
    deviceId = generateUUID();
    localStorage.setItem(DEVICE_ID_KEY, deviceId);
  }
  return deviceId;
}

/**
 * Get device name (browser + OS)
 * @returns {string} Device name
 */
export function getDeviceName() {
  let deviceName = localStorage.getItem(DEVICE_NAME_KEY);
  if (!deviceName) {
    deviceName = detectDeviceName();
    localStorage.setItem(DEVICE_NAME_KEY, deviceName);
  }
  return deviceName;
}

/**
 * Clear device ID (on logout or cache clear)
 */
export function clearDeviceId() {
  localStorage.removeItem(DEVICE_ID_KEY);
  localStorage.removeItem(DEVICE_NAME_KEY);
}

/**
 * Reset device ID (generates new one for this browser)
 * Used when user wants to "forget" this device
 */
export function resetDeviceId() {
  clearDeviceId();
  return getDeviceId();
}

/**
 * Get device info object
 * @returns {Object} { device_id, device_name }
 */
export function getDeviceInfo() {
  return {
    device_id: getDeviceId(),
    device_name: getDeviceName(),
  };
}
