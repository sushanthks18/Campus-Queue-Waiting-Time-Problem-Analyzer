import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { LogOut } from 'lucide-react';
import axios from 'axios';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line
} from 'recharts';

const AdminDashboard = ({ user, onLogout }) => {
  const [analytics, setAnalytics] = useState({ locations: [], hourly_data: {} });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const API_BASE_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/api/analytics`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      setAnalytics(response.data);
    } catch (err) {
      // Handle error properly
      let errorMessage = 'Failed to fetch analytics data';
      if (err.response && err.response.data) {
        if (typeof err.response.data.detail === 'string') {
          errorMessage = err.response.data.detail;
        } else {
          errorMessage = JSON.stringify(err.response.data);
        }
      } else if (err.request) {
        errorMessage = 'Network error - unable to reach server';
      } else {
        errorMessage = err.message || 'An unexpected error occurred';
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (waitTime) => {
    if (waitTime < 10) return 'bg-green-500';
    if (waitTime < 20) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const formatHourlyData = () => {
    const hours = [];
    for (let i = 0; i < 24; i++) {
      const hourKey = `${i.toString().padStart(2, '0')}:00`;
      hours.push({
        hour: hourKey,
        waitTime: analytics.hourly_data[hourKey] || 0
      });
    }
    return hours;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Campus Queue Analyzer</h1>
            <p className="text-sm text-gray-500">Welcome back, {user.name}! (Admin)</p>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-600">Admin</span>
            <Button variant="outline" size="sm" onClick={onLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error ? (
          <div className="text-center py-8 text-red-600">
            <p>Error: {error}</p>
            <Button onClick={fetchAnalytics} className="mt-4">Retry</Button>
          </div>
        ) : (
          <>
            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {analytics.locations.map((location, index) => (
                <Card key={index}>
                  <CardHeader>
                    <CardTitle className="text-lg">{location.location}</CardTitle>
                    <CardDescription>Average wait time</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-baseline">
                      <span className="text-3xl font-bold text-gray-900">
                        {location.average_waiting_time} min
                      </span>
                      <Badge className={`${getStatusColor(location.average_waiting_time)} ml-2`}>
                        {location.average_waiting_time < 10 ? 'Low' : 
                         location.average_waiting_time < 20 ? 'Medium' : 'High'}
                      </Badge>
                    </div>
                    <div className="mt-2 text-sm text-gray-600">
                      <p>Peak: {location.peak_hour}</p>
                      <p>Best: {location.best_time}</p>
                      <p>Entries: {location.total_entries}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              {/* Location Comparison Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>Location Comparison</CardTitle>
                  <CardDescription>Average wait times by location</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={analytics.locations}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="location" />
                      <YAxis label={{ value: 'Minutes', angle: -90, position: 'insideLeft' }} />
                      <Tooltip formatter={(value) => [`${value} min`, 'Avg Wait']} />
                      <Legend />
                      <Bar dataKey="average_waiting_time" name="Average Wait Time (min)" fill="#4F46E5" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Hourly Trend Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>Hourly Trends</CardTitle>
                  <CardDescription>Average wait times throughout the day</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={formatHourlyData()}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="hour" />
                      <YAxis label={{ value: 'Minutes', angle: -90, position: 'insideLeft' }} />
                      <Tooltip formatter={(value) => [`${value} min`, 'Wait Time']} />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="waitTime" 
                        name="Wait Time (min)" 
                        stroke="#4F46E5" 
                        strokeWidth={2}
                        dot={{ r: 4 }}
                        activeDot={{ r: 6 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Detailed Analytics Table */}
            <Card>
              <CardHeader>
                <CardTitle>Detailed Analytics</CardTitle>
                <CardDescription>Comprehensive breakdown by location</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Location
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Avg Wait Time
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Peak Hour
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Best Time
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Total Entries
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {analytics.locations.map((location, index) => (
                        <tr key={index}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {location.location}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {location.average_waiting_time} min
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {location.peak_hour}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {location.best_time}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {location.total_entries}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Badge className={`${getStatusColor(location.average_waiting_time)}`}>
                              {location.average_waiting_time < 10 ? 'Low Wait' : 
                               location.average_waiting_time < 20 ? 'Medium Wait' : 'High Wait'}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </main>
    </div>
  );
};

export default AdminDashboard;
