/**
 * Session Service - Frontend API calls for session management
 * Handles fetching active sessions, logging out from devices, remembering devices
 */

import api from './api';

/**
 * Get list of active sessions for current user
 * @returns {Promise<Array>} Array of session objects
 */
export async function getActiveSessions() {
  try {
    const response = await api.get('/api/sessions/active');
    return response.data;
  } catch (error) {
    console.error('Error fetching active sessions:', error);
    throw error;
  }
}

/**
 * Logout from a specific device or all devices
 * @param {Object} options
 * @param {string} options.device_id - If provided, logout only this device
 * @param {boolean} options.logout_all - If true, logout from all devices including current
 * @returns {Promise<Object>} Response with success message
 */
export async function logoutSession(options = {}) {
  try {
    const { device_id, logout_all } = options;
    
    let url = '/api/sessions/logout';
    if (device_id) {
      url += `?device_id=${device_id}`;
    }
    
    const response = await api.post(url, {
      logout_all: logout_all || false,
    });
    
    return response.data;
  } catch (error) {
    console.error('Error logging out session:', error);
    throw error;
  }
}

/**
 * Logout from all devices EXCEPT current
 * @returns {Promise<Object>} Response with success message
 */
export async function logoutAllOtherDevices() {
  return logoutSession({ logout_all: false });
}

/**
 * Logout from ALL devices including current
 * @returns {Promise<Object>} Response with success message
 */
export async function logoutAllDevices() {
  return logoutSession({ logout_all: true });
}

/**
 * Logout from a specific device by device_id
 * @param {string} device_id - Device ID to logout
 * @returns {Promise<Object>} Response with success message
 */
export async function logoutDevice(device_id) {
  return logoutSession({ device_id });
}

/**
 * Remember current device for future logins
 * @param {string} device_id - Device ID
 * @param {string} device_name - Human-readable device name
 * @returns {Promise<Object>} Response with success message
 */
export async function rememberDevice(device_id, device_name) {
  try {
    const response = await api.post('/api/sessions/remember', {
      device_id,
      device_name,
    });
    return response.data;
  } catch (error) {
    console.error('Error remembering device:', error);
    throw error;
  }
}

/**
 * Remove device from "remember me" list
 * @param {string} device_id - Device ID to forget
 * @returns {Promise<Object>} Response with success message
 */
export async function forgetDevice(device_id) {
  try {
    const response = await api.post('/api/sessions/forget', {
      device_id,
    });
    return response.data;
  } catch (error) {
    console.error('Error forgetting device:', error);
    throw error;
  }
}
