import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { dashboardService, vehicleService, bookingService } from '../services/services';
import Heatmap from '../components/Heatmap';
import { 
  FaUsers, FaCar, FaRoute, FaTools, FaChartLine, FaExclamationTriangle,
  FaCheckCircle, FaClock, FaDollarSign, FaCog
} from 'react-icons/fa';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMetrics();
  }, []);

  const fetchMetrics = async () => {
    try {
      const data = await dashboardService.getAdminMetrics();
      setMetrics(data);
    } catch (error) {
      console.error('Failed to fetch admin metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickAction = (action) => {
    switch (action) {
      case 'users':
        navigate('/admin/users');
        break;
      case 'vehicles':
        navigate('/admin/vehicles');
        break;
      case 'bookings':
        navigate('/admin/booking');
        break;
      case 'maintenance':
        navigate('/admin/maintenance');
        break;
      case 'reports':
        navigate('/admin/reports');
        break;
      default:
        break;
    }
  };

  // CSV helper
  function generateCSV(items, headers) {
    const escape = (v) => {
      if (v === null || v === undefined) return '';
      const s = String(v).replace(/"/g, '""');
      return `"${s}"`;
    };

    const rows = [headers.join(',')];
    items.forEach(it => {
      const row = headers.map(h => escape(it[h] ?? ''));
      rows.push(row.join(','));
    });
    return rows.join('\n');
  }

  async function exportVehiclesCSV() {
    try {
      const data = await vehicleService.getAllVehicles();
      const vehicles = Array.isArray(data) ? data : (data.vehicles || []);
      if (!vehicles.length) return alert('No vehicles available to export');

      const headers = ['id','licensePlate','make','model','type','passengerCapacity','currentLatitude','currentLongitude','isAvailable','createdAt'];
      const csv = generateCSV(vehicles, headers);
      const blob = new Blob([csv], { type: 'text/csv' });
      const ts = new Date().toISOString().replace(/[:.]/g, '-');
      const fileName = `vehicles_${ts}.csv`;
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error(err);
      alert('Failed to export vehicles');
    }
  }

  async function exportBookingsCSV() {
    try {
      const data = await bookingService.getAllBookings();
      // booking endpoint returns { message, bookings, count }
      const bookings = Array.isArray(data) ? data : (data.bookings || []);
      if (!bookings.length) return alert('No bookings available to export');

      const headers = ['id','customerId','vehicleId','pickupAddress','dropoffAddress','estimatedCost','status','paymentStatus','actualPickupTime','actualDropoffTime'];
      // Normalize booking objects to flat shape
      const flat = bookings.map(b => ({
        id: b.id,
        customerId: b.getCustomerId ? b.getCustomerId() : (b.customer?.id || ''),
        vehicleId: b.getVehicleId ? b.getVehicleId() : (b.vehicle?.id || ''),
        pickupAddress: b.pickupAddress || b.pickup_address || '',
        dropoffAddress: b.dropoffAddress || b.dropoff_address || '',
        estimatedCost: b.estimatedCost || b.estimated_cost || '',
        status: b.status || '',
        paymentStatus: b.paymentStatus || b.payment_status || '',
        actualPickupTime: b.actualPickupTime || b.actual_pickup_time || '',
        actualDropoffTime: b.actualDropoffTime || b.actual_dropoff_time || ''
      }));

      const csv = generateCSV(flat, headers);
      const blob = new Blob([csv], { type: 'text/csv' });
      const ts = new Date().toISOString().replace(/[:.]/g, '-');
      const fileName = `bookings_${ts}.csv`;
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error(err);
      alert('Failed to export bookings');
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const bookingData = [
    { name: 'Mon', bookings: 45 },
    { name: 'Tue', bookings: 52 },
    { name: 'Wed', bookings: 38 },
    { name: 'Thu', bookings: 65 },
    { name: 'Fri', bookings: 48 },
    { name: 'Sat', bookings: 72 },
    { name: 'Sun', bookings: 58 }
  ];

  const revenueData = [
    { name: 'Jan', revenue: 45000 },
    { name: 'Feb', revenue: 52000 },
    { name: 'Mar', revenue: 48000 },
    { name: 'Apr', revenue: 61000 },
    { name: 'May', revenue: 58000 },
    { name: 'Jun', revenue: 67000 }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
            <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <button onClick={exportVehiclesCSV} className="px-3 py-1 bg-blue-600 text-white rounded text-sm">Export Vehicles CSV</button>
                  <button onClick={exportBookingsCSV} className="px-3 py-1 bg-green-600 text-white rounded text-sm">Export Bookings CSV</button>
                  <button className="text-gray-500 hover:text-gray-700">
                    <FaCog className="h-5 w-5" />
                  </button>
                </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-blue-500 rounded-md p-3">
                <FaUsers className="h-6 w-6 text-white" />
              </div>
              <div className="ml-5">
                <p className="text-sm font-medium text-gray-500">Total Users</p>
                <p className="text-2xl font-semibold text-gray-900">{metrics?.totalUsers || 1234}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-green-500 rounded-md p-3">
                <FaCar className="h-6 w-6 text-white" />
              </div>
              <div className="ml-5">
                <p className="text-sm font-medium text-gray-500">Total Vehicles</p>
                <p className="text-2xl font-semibold text-gray-900">{metrics?.totalVehicles || 56}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-yellow-500 rounded-md p-3">
                <FaRoute className="h-6 w-6 text-white" />
              </div>
              <div className="ml-5">
                <p className="text-sm font-medium text-gray-500">Total Bookings</p>
                <p className="text-2xl font-semibold text-gray-900">{metrics?.totalBookings || 378}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-purple-500 rounded-md p-3">
                <FaDollarSign className="h-6 w-6 text-white" />
              </div>
              <div className="ml-5">
                <p className="text-sm font-medium text-gray-500">Total Revenue</p>
                <p className="text-2xl font-semibold text-gray-900">${metrics?.totalRevenue || 336000}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Weekly Bookings</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={bookingData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="bookings" stroke="#3B82F6" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Monthly Revenue</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="revenue" fill="#10B981" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Heatmap */}
        <div className="mb-8">
          <Heatmap />
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <button
              onClick={() => handleQuickAction('users')}
              className="flex items-center justify-center px-4 py-3 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <FaUsers className="mr-2 h-4 w-4" />
              Manage Users
            </button>

            <button
              onClick={() => handleQuickAction('vehicles')}
              className="flex items-center justify-center px-4 py-3 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <FaCar className="mr-2 h-4 w-4" />
              Manage Vehicles
            </button>

            <button
              onClick={() => handleQuickAction('bookings')}
              className="flex items-center justify-center px-4 py-3 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <FaRoute className="mr-2 h-4 w-4" />
              View Bookings
            </button>

            <button
              onClick={() => handleQuickAction('maintenance')}
              className="flex items-center justify-center px-4 py-3 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <FaTools className="mr-2 h-4 w-4" />
              Maintenance
            </button>

            <button
              onClick={() => handleQuickAction('reports')}
              className="flex items-center justify-center px-4 py-3 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <FaChartLine className="mr-2 h-4 w-4" />
              Reports
            </button>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Activity</h3>
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <FaCheckCircle className="h-5 w-5 text-green-500" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">New user registration</p>
                <p className="text-sm text-gray-500">John Doe registered as Customer</p>
              </div>
              <div className="flex-shrink-0 text-sm text-gray-500">
                <FaClock className="h-4 w-4" />
                2 mins ago
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <FaExclamationTriangle className="h-5 w-5 text-yellow-500" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">Maintenance alert</p>
                <p className="text-sm text-gray-500">Vehicle NY-123 requires oil change</p>
              </div>
              <div className="flex-shrink-0 text-sm text-gray-500">
                <FaClock className="h-4 w-4" />
                15 mins ago
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <FaChartLine className="h-5 w-5 text-green-500" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">Revenue milestone</p>
                <p className="text-sm text-gray-500">Monthly revenue target achieved</p>
              </div>
              <div className="flex-shrink-0 text-sm text-gray-500">
                <FaClock className="h-4 w-4" />
                1 hour ago
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
