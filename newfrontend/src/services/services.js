import apiClient from './apiClient';

// Authentication Services
export const authService = {
  // User login
  login: async (credentials) => {
    try {
      const response = await apiClient.post('/auth/login', credentials);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Login failed' };
    }
  },

  // User registration
  register: async (userData) => {
    try {
      const response = await apiClient.post('/auth/register', userData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Registration failed' };
    }
  },

  // User logout
  logout: async () => {
    try {
      await apiClient.post('/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    }
  },

  // Refresh token
  refreshToken: async () => {
    try {
      const response = await apiClient.post('/auth/refresh-token');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Token refresh failed' };
    }
  },

  // Verify token
  verifyToken: async () => {
    try {
      const response = await apiClient.post('/auth/verify-token');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Token verification failed' };
    }
  },
};

// Dashboard Services
export const dashboardService = {
  // Admin dashboard metrics
  getAdminMetrics: async () => {
    try {
      const response = await apiClient.get('/dashboard/admin/metrics');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch admin metrics' };
    }
  },

  // Fleet manager dashboard metrics
  getFleetManagerMetrics: async () => {
    try {
      const response = await apiClient.get('/dashboard/fleet-manager/metrics');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch fleet manager metrics' };
    }
  },

  // Driver dashboard metrics
  getDriverMetrics: async () => {
    try {
      const response = await apiClient.get('/dashboard/driver/metrics');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch driver metrics' };
    }
  },

  // Customer dashboard metrics
  getCustomerMetrics: async () => {
    try {
      const response = await apiClient.get('/dashboard/customer/metrics');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch customer metrics' };
    }
  },
};

// User Services
export const userService = {
  // Get all users (admin only)
  getAllUsers: async () => {
    try {
      const response = await apiClient.get('/users');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch users' };
    }
  },

  // Get user profile
  getProfile: async () => {
    try {
      const response = await apiClient.get('/users/profile');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch profile' };
    }
  },

  // Update user profile
  updateProfile: async (profileData) => {
    try {
      const response = await apiClient.put('/users/profile', profileData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to update profile' };
    }
  },

  // Get user by ID (admin only)
  getUserById: async (userId) => {
    try {
      const response = await apiClient.get(`/users/${userId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch user' };
    }
  },
};

// Vehicle Services
export const vehicleService = {
  // Get all vehicles
  getAllVehicles: async () => {
    try {
      const response = await apiClient.get('/vehicles');
      // prefer response.data when using axios-like client
      const data = response.data ?? response;
      try { localStorage.setItem('neurofleetx_vehicles', JSON.stringify(data)); } catch (e) { /* ignore */ }
      return data;
    } catch (error) {
      // Fallback to localStorage cached vehicles when backend unavailable
      try {
        const raw = localStorage.getItem('neurofleetx_vehicles');
        if (raw) return JSON.parse(raw);
      } catch (e) {
        /* ignore parse errors */
      }
      throw error.response?.data || { message: 'Failed to fetch vehicles' };
    }
  },

  // Get vehicle by ID
  getVehicleById: async (id) => {
    try {
      const response = await apiClient.get(`/vehicles/${id}`);
      return response;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch vehicle' };
    }
  },

  // Create new vehicle
  createVehicle: async (vehicleData) => {
    try {
      const response = await apiClient.post('/vehicles', vehicleData);
      return response;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to create vehicle' };
    }
  },

  // Update vehicle
  updateVehicle: async (id, vehicleData) => {
    try {
      const response = await apiClient.put(`/vehicles/${id}`, vehicleData);
      return response;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to update vehicle' };
    }
  },

  // Delete vehicle
  deleteVehicle: async (id) => {
    try {
      const response = await apiClient.delete(`/vehicles/${id}`);
      return response;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to delete vehicle' };
    }
  },

  // Get vehicles by type
  getVehiclesByType: async (type) => {
    try {
      const response = await apiClient.get(`/vehicles/type/${type}`);
      return response;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch vehicles by type' };
    }
  },

  // Get available vehicles
  getAvailableVehicles: async () => {
    try {
      const response = await apiClient.get('/vehicles/available');
      return response;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch available vehicles' };
    }
  }
};

// Booking Services
export const bookingService = {
  // Get vehicle recommendations
  getRecommendations: async (criteria) => {
    try {
      const response = await apiClient.post('/bookings/recommendations', criteria);
      return response;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to get recommendations' };
    }
  },

  // Create a new booking
  createBooking: async (bookingData) => {
    try {
      const response = await apiClient.post('/bookings', bookingData);
      return response;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to create booking' };
    }
  },

  // Get bookings by customer
  getCustomerBookings: async (customerId) => {
    try {
      const response = await apiClient.get(`/bookings/customer/${customerId}`);
      return response;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch bookings' };
    }
  },

  // Get booking by ID
  getBookingById: async (bookingId) => {
    try {
      const response = await apiClient.get(`/bookings/${bookingId}`);
      return response;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch booking' };
    }
  },

  // Cancel booking
  cancelBooking: async (bookingId) => {
    try {
      const response = await apiClient.put(`/bookings/${bookingId}/cancel`);
      return response;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to cancel booking' };
    }
  },

  // Get all bookings (admin)
  getAllBookings: async () => {
    try {
      const response = await apiClient.get('/bookings');
      const data = response.data ?? response;
      try { localStorage.setItem('neurofleetx_bookings', JSON.stringify(data)); } catch (e) { /* ignore */ }
      return data;
    } catch (error) {
      // Fallback to cached bookings in localStorage
      try {
        const raw = localStorage.getItem('neurofleetx_bookings');
        if (raw) return JSON.parse(raw);
      } catch (e) {
        /* ignore */
      }
      throw error.response?.data || { message: 'Failed to fetch bookings' };
    }
  },
};
