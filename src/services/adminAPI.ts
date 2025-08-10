import api from './api';

// Admin Profile API
export const adminProfileAPI = {
  // Get admin profile
  getProfile: () => {
    console.log('[ADMIN_PROFILE_API] Get profile request initiated');
    return api.get('/admin/profile');
  },
  
  // Update admin profile
  updateProfile: (data: {
    name: string;
    email: string;
  }) => {
    console.log('[ADMIN_PROFILE_API] Update profile request initiated');
    return api.put('/admin/profile', data);
  },
  
  // Update admin avatar
  updateAvatar: (formData: FormData) => {
    console.log('[ADMIN_PROFILE_API] Update avatar request initiated');
    return api.post('/admin/profile/avatar', formData);
  },
  
  // Update admin password
  updatePassword: (data: {
    current_password: string;
    new_password: string;
    new_password_confirmation: string;
  }) => {
    console.log('[ADMIN_PROFILE_API] Update password request initiated');
    return api.post('/admin/profile/password', data);
  },
  
  // Get admin permissions
  getPermissions: () => {
    console.log('[ADMIN_PROFILE_API] Get permissions request initiated');
    return api.get('/admin/profile/permissions');
  },
  
  // Get admin recent activity
  getRecentActivity: () => {
    console.log('[ADMIN_PROFILE_API] Get recent activity request initiated');
    return api.get('/admin/profile/activity');
  },

  // Update security settings
  updateSecuritySettings: (data: {
    setting: 'ip_restriction' | 'two_factor' | 'login_notifications';
    enabled: boolean;
    allowed_ips?: string[];
  }) => {
    console.log('[ADMIN_PROFILE_API] Update security settings request initiated');
    return api.post('/admin/profile/security-settings', data);
  },

  // Get current IP address
  getCurrentIp: () => {
    console.log('[ADMIN_PROFILE_API] Get current IP request initiated');
    return api.get('/admin/profile/current-ip');
  }
};

export default adminProfileAPI;