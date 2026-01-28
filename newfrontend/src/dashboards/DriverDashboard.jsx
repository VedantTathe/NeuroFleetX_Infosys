import React, { useState, useEffect, useRef } from 'react';
import { dashboardService } from '../services/services';
import { 
  FaRoute, FaDollarSign, FaMapMarkerAlt, FaStar, FaCheckCircle,
  FaClock, FaCar, FaGasPump, FaCalendarCheck, FaTrophy, FaChartLine,
  FaPlay, FaPause, FaStop, FaPhone, FaEnvelope
} from 'react-icons/fa';

const DriverDashboard = () => {
  const [metrics, setMetrics] = useState(null);
  const [currentTrip, setCurrentTrip] = useState(null);
  const [tripHistory, setTripHistory] = useState([]);
  const [isOnline, setIsOnline] = useState(true);
  const [recentlyCompleted, setRecentlyCompleted] = useState(false);
  const recentlyCompletedRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchMetrics();
    fetchCurrentTrip();
    fetchTripHistory();
  }, []);

  const fetchMetrics = async () => {
    try {
      const data = await dashboardService.getDriverMetrics();
      // Map backend keys to frontend keys (backend uses `todaysTrips` / `todaysEarnings`)
      if (data) {
        const mapped = {
          todayTrips: data.todayTrips ?? data.todaysTrips,
          todayEarnings: data.todayEarnings ?? data.todaysEarnings,
          distanceCovered: data.distanceCovered ?? data.distanceCovered,
          driverRating: data.driverRating ?? data.driverRating,
          completedTrips: data.completedTrips ?? data.completedTrips,
          acceptanceRate: data.acceptanceRate ?? data.acceptanceRate,
          onlineHours: data.onlineHours,
          fuelConsumed: data.fuelConsumed
        };
        setMetrics(mapped);
      } else {
        setMetrics(null);
      }
    } catch (err) {
      console.error('Failed to fetch metrics:', err);
    }
  };

  const toggleOnline = () => {
    setIsOnline((prev) => !prev);
  };

  const completeTrip = (trip) => {
    if (!trip) return;
    // Mark trip as completed and clear current trip
    const completed = {
      ...trip,
      status: 'completed',
      date: new Date().toISOString().split('T')[0],
      // ensure `rating` field exists for TripHistoryItem
      rating: trip.rating ?? trip.customerRating ?? 0
    };
    setTripHistory((prev) => [completed, ...prev]);
    setCurrentTrip(null);
    // Update metrics counters if using real metrics
    setMetrics((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        completedTrips: (prev.completedTrips ?? 0) + 1,
        todayTrips: (prev.todayTrips ?? 0) + 1
      };
    });
    // briefly suppress the placeholder 'Go Online' button after completing a trip
    setRecentlyCompleted(true);
    if (recentlyCompletedRef.current) clearTimeout(recentlyCompletedRef.current);
    recentlyCompletedRef.current = setTimeout(() => {
      setRecentlyCompleted(false);
      recentlyCompletedRef.current = null;
    }, 5000);
  };

  const fetchCurrentTrip = async () => {
    try {
      // Mock current trip data
      const mockTrip = {
        id: 'TRIP-2024-001',
        customer: 'John Doe',
        pickup: '123 Main St, Downtown',
        dropoff: '456 Oak Ave, Suburbs',
        status: 'active', // active, waiting, completed
        startTime: '2024-01-06T09:30:00Z',
        estimatedDuration: '25 mins',
        distance: 12.5,
        fare: 24.50,
        customerPhone: '+1 234-567-8900',
        customerRating: 4.8,
        notes: 'Customer is in a hurry, please take the fastest route'
      };
      setCurrentTrip(mockTrip);
    } catch (err) {
      console.error('Failed to fetch current trip:', err);
    }
  };

  const fetchTripHistory = async () => {
    try {
      // Mock trip history
      const mockHistory = [
        {
          id: 'TRIP-2024-002',
          date: '2024-01-05',
          customer: 'Jane Smith',
          pickup: 'Airport Terminal 1',
          dropoff: 'Central Station',
          distance: 18.2,
          fare: 35.50,
          rating: 5,
          duration: '32 mins',
          status: 'completed'
        },
        {
          id: 'TRIP-2024-003',
          date: '2024-01-05',
          customer: 'Bob Johnson',
          pickup: 'Shopping Mall',
          dropoff: 'Restaurant District',
          distance: 8.7,
          fare: 16.80,
          rating: 4,
          duration: '18 mins',
          status: 'completed'
        },
        {
          id: 'TRIP-2024-004',
          date: '2024-01-04',
          customer: 'Alice Brown',
          pickup: 'University Campus',
          dropoff: 'City Hospital',
          distance: 6.3,
          fare: 12.90,
          rating: 5,
          duration: '15 mins',
          status: 'completed'
        }
      ];
      setTripHistory(mockHistory);
    } catch (err) {
      console.error('Failed to fetch trip history:', err);
    } finally {
      setLoading(false);
    }
  };

  // Mock metrics data
  const mockMetrics = {
    todayTrips: 4,
    todayEarnings: 89.70,
    distanceCovered: 45.8,
    driverRating: 4.7,
    completedTrips: 142,
    acceptanceRate: 92,
    onlineHours: 6.5,
    fuelConsumed: 12.3
  };

  const displayMetrics = metrics || mockMetrics;

  const MetricCard = ({ icon, title, value, subtitle, color = 'blue', trend }) => {
    const colorClasses = {
      blue: 'bg-blue-500',
      green: 'bg-green-500',
      purple: 'bg-purple-500',
      orange: 'bg-orange-500',
      red: 'bg-red-500',
      yellow: 'bg-yellow-500'
    };

    return (
      <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className={`p-3 rounded-full ${colorClasses[color]} bg-opacity-10`}>
              <div className={`${colorClasses[color]} text-white text-xl`}>
                {icon}
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">{title}</p>
              <p className="text-2xl font-bold text-gray-900">{value}</p>
              <p className="text-sm text-gray-500">{subtitle}</p>
            </div>
          </div>
          {trend && (
            <div className={`text-sm font-medium ${
              trend > 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {trend > 0 ? '+' : ''}{trend}%
            </div>
          )}
        </div>
      </div>
    );
  };

  const StarRating = ({ rating = 0, size = 'sm' }) => {
    const sizeClasses = {
      sm: 'w-4 h-4',
      md: 'w-5 h-5',
      lg: 'w-6 h-6'
    };

    const safeRating = Number.isFinite(Number(rating)) ? Number(rating) : 0;

    return (
      <div className="flex items-center space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <FaStar
            key={star}
            className={`${sizeClasses[size]} ${
              star <= safeRating ? 'text-yellow-400' : 'text-gray-300'
            }`}
          />
        ))}
        <span className="ml-2 text-sm text-gray-600">{safeRating.toFixed(1)}</span>
      </div>
    );
  };

  const CurrentTripCard = ({ trip, onComplete }) => {
    const getStatusColor = (status) => {
      switch (status) {
        case 'active': return 'bg-green-100 text-green-800';
        case 'waiting': return 'bg-yellow-100 text-yellow-800';
        case 'completed': return 'bg-blue-100 text-blue-800';
        default: return 'bg-gray-100 text-gray-800';
      }
    };

    const getStatusIcon = (status) => {
      switch (status) {
        case 'active': return <FaPlay className="text-green-600" />;
        case 'waiting': return <FaClock className="text-yellow-600" />;
        case 'completed': return <FaCheckCircle className="text-blue-600" />;
        default: return <FaPause className="text-gray-600" />;
      }
    };

    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Current Trip</h3>
          <div className="flex items-center space-x-2">
            <span className={`px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(trip.status)}`}>
              {getStatusIcon(trip.status)}
              <span className="ml-1 capitalize">{trip.status}</span>
            </span>
          </div>
        </div>

        <div className="space-y-4">
          {/* Customer Info */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium text-gray-900">{trip.customer}</h4>
              <StarRating rating={trip.customerRating} />
            </div>
            <div className="flex items-center space-x-4 text-sm text-gray-600">
              <span className="flex items-center">
                <FaPhone className="mr-1" />
                {trip.customerPhone}
              </span>
            </div>
          </div>

          {/* Route Info */}
          <div className="space-y-3">
            <div className="flex items-start space-x-3">
              <div className="w-3 h-3 bg-green-500 rounded-full mt-1"></div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">Pickup</p>
                <p className="text-sm text-gray-600">{trip.pickup}</p>
              </div>
            </div>
            <div className="border-l-2 border-dashed border-gray-300 ml-1.5 h-4"></div>
            <div className="flex items-start space-x-3">
              <div className="w-3 h-3 bg-red-500 rounded-full mt-1"></div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">Dropoff</p>
                <p className="text-sm text-gray-600">{trip.dropoff}</p>
              </div>
            </div>
          </div>

          {/* Trip Details */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-blue-50 rounded-lg p-3">
              <p className="text-sm text-blue-600 font-medium">Distance</p>
              <p className="text-lg font-bold text-blue-900">{trip.distance} km</p>
            </div>
            <div className="bg-green-50 rounded-lg p-3">
              <p className="text-sm text-green-600 font-medium">Fare</p>
              <p className="text-lg font-bold text-green-900">${trip.fare}</p>
            </div>
          </div>

          {/* Notes */}
          {trip.notes && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <p className="text-sm text-yellow-800">
                <strong>Note:</strong> {trip.notes}
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex space-x-3">
            <button
              onClick={() => onComplete && onComplete(trip)}
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
            >
              <FaCheckCircle className="inline mr-2" />
              Complete Trip
            </button>
            <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
              <FaEnvelope className="inline mr-2" />
              Message
            </button>
            <button className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors">
              <FaPhone className="inline mr-2" />
              Call
            </button>
          </div>
        </div>
      </div>
    );
  };

  const TripHistoryItem = ({ trip }) => {
    return (
      <div className="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h4 className="font-medium text-gray-900">{trip.customer}</h4>
            <p className="text-sm text-gray-600">{trip.date}</p>
          </div>
          <div className="text-right">
            <p className="text-lg font-bold text-green-600">${trip.fare}</p>
            <StarRating rating={trip.rating} />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 text-sm">
          <div>
            <p className="text-gray-600">Distance</p>
            <p className="font-medium">{trip.distance} km</p>
          </div>
          <div>
            <p className="text-gray-600">Duration</p>
            <p className="font-medium">{trip.duration}</p>
          </div>
          <div>
            <p className="text-gray-600">Status</p>
            <p className="font-medium text-green-600">{trip.status}</p>
          </div>
        </div>

        <div className="mt-3 pt-3 border-t border-gray-200">
          <p className="text-xs text-gray-500">
            <FaMapMarkerAlt className="inline mr-1" />
            {trip.pickup} → {trip.dropoff}
          </p>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Driver Dashboard</h1>
              <p className="text-gray-600">Manage your trips and earnings</p>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={toggleOnline}
                className={`px-4 py-2 rounded-md transition-colors ${isOnline ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-green-600 hover:bg-green-700 text-white'}`}
              >
                {isOnline ? <FaStop className="inline mr-2" /> : <FaPlay className="inline mr-2" />}
                {isOnline ? 'Go Offline' : 'Go Online'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Live banner when online */}
      {isOnline && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
          <div className="rounded-md bg-green-50 p-4 border-l-4 border-green-400">
            <div className="flex items-start">
              <span className="animate-pulse inline-block w-2 h-2 bg-green-600 rounded-full mr-3 mt-1" />
              <p className="text-sm text-green-700">You are now live for search trips — searching for requests...</p>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <MetricCard
            icon={<FaRoute />}
            title="Today's Trips"
            value={displayMetrics.todayTrips}
            subtitle="Completed today"
            color="blue"
          />
          <MetricCard
            icon={<FaDollarSign />}
            title="Today's Earnings"
            value={`$${displayMetrics.todayEarnings}`}
            subtitle="So far today"
            color="green"
            trend={15.3}
          />
          <MetricCard
            icon={<FaMapMarkerAlt />}
            title="Distance Covered"
            value={`${displayMetrics.distanceCovered} km`}
            subtitle="Today's total"
            color="purple"
          />
          <MetricCard
            icon={<FaStar />}
            title="Driver Rating"
            value={displayMetrics.driverRating.toFixed(1)}
            subtitle="Average rating"
            color="yellow"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Current Trip */}
          <div className="lg:col-span-2">
            {isOnline && currentTrip ? (
              <CurrentTripCard trip={currentTrip} onComplete={completeTrip} />
            ) : (
              <div className="bg-white rounded-lg shadow-md p-8 text-center">
                <FaCar className="mx-auto h-16 w-16 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Active Trip</h3>
                <p className="text-gray-600 mb-4">
                  {isOnline ? "You're currently waiting for the next trip" : "You're currently offline. Go online to receive trips."}
                </p>
                {!recentlyCompleted && (
                  <button
                    onClick={() => setIsOnline(true)}
                    className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                  >
                    Go Online
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Stats Sidebar */}
          <div className="space-y-6">
            {/* Additional Stats */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Stats</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Completed Trips</span>
                  <span className="font-medium">{displayMetrics.completedTrips}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Acceptance Rate</span>
                  <span className="font-medium">{displayMetrics.acceptanceRate}%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Online Hours</span>
                  <span className="font-medium">{displayMetrics.onlineHours} hrs</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Fuel Consumed</span>
                  <span className="font-medium">{displayMetrics.fuelConsumed} L</span>
                </div>
              </div>
            </div>

            {/* Achievement Badge */}
            <div className="bg-gradient-to-r from-yellow-400 to-orange-500 rounded-lg shadow-md p-6 text-white">
              <div className="flex items-center space-x-3">
                <FaTrophy className="text-3xl" />
                <div>
                  <h3 className="font-semibold">Top Performer</h3>
                  <p className="text-sm opacity-90">You're in the top 10% this week!</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Trip History */}
        <div className="mt-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Trips</h2>
            <div className="space-y-4">
              {(tripHistory || []).map((trip) => (
                <TripHistoryItem key={trip.id} trip={trip} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DriverDashboard;
