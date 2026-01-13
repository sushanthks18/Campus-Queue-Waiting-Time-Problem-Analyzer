import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Label } from '../components/ui/label';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { CalendarIcon, ClockIcon, LogOut } from 'lucide-react';
import axios from 'axios';

const StudentDashboard = ({ user, onLogout }) => {
  const [formData, setFormData] = useState({
    location: 'Canteen',
    entry_time: '',
    completion_time: '',
    date: ''
  });
  const [recentEntries, setRecentEntries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const API_BASE_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

  useEffect(() => {
    fetchRecentEntries();
  }, []);

  const fetchRecentEntries = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/api/queue-entries`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      setRecentEntries(response.data);
    } catch (err) {
      setError('Failed to fetch recent entries');
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
    setSuccess('');
  };

  const handleSelectChange = (name, value) => {
    setFormData({
      ...formData,
      [name]: value
    });
    setError('');
    setSuccess('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`${API_BASE_URL}/api/queue-entry`, formData, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      setSuccess('Queue entry submitted successfully!');
      setFormData({
        location: 'Canteen',
        entry_time: '',
        completion_time: '',
        date: ''
      });
      
      // Refresh recent entries
      fetchRecentEntries();
    } catch (err) {
      // Handle error properly
      let errorMessage = 'Failed to submit queue entry';
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Campus Queue Analyzer</h1>
            <p className="text-sm text-gray-500">Welcome back, {user.name}!</p>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-600">Student</span>
            <Button variant="outline" size="sm" onClick={onLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Queue Entry Form */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <ClockIcon className="h-5 w-5 mr-2 text-indigo-600" />
                  Submit Queue Data
                </CardTitle>
                <CardDescription>Record your queue experience to help others</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit}>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="location">Service Location</Label>
                      <Select value={formData.location} onValueChange={(value) => handleSelectChange('location', value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select location" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Canteen">Canteen</SelectItem>
                          <SelectItem value="Admin Office">Admin Office</SelectItem>
                          <SelectItem value="Library">Library</SelectItem>
                          <SelectItem value="Hostel Office">Hostel Office</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="date">Date</Label>
                        <Input
                          id="date"
                          name="date"
                          type="date"
                          value={formData.date}
                          onChange={handleChange}
                          required
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="entry_time">Entry Time</Label>
                        <Input
                          id="entry_time"
                          name="entry_time"
                          type="time"
                          value={formData.entry_time}
                          onChange={handleChange}
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="completion_time">Completion Time</Label>
                      <Input
                        id="completion_time"
                        name="completion_time"
                        type="time"
                        value={formData.completion_time}
                        onChange={handleChange}
                        required
                      />
                    </div>

                    {error && (
                      <div className="text-red-600 text-sm">{error}</div>
                    )}

                    {success && (
                      <div className="text-green-600 text-sm">{success}</div>
                    )}

                    <Button 
                      type="submit" 
                      className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
                      disabled={loading}
                    >
                      {loading ? 'Submitting...' : 'Submit Queue Entry'}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Recent Submissions */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Your Recent Submissions</CardTitle>
                <CardDescription>Last 10 queue entries you've submitted</CardDescription>
              </CardHeader>
              <CardContent>
                {recentEntries.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Location</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Wait Time</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {recentEntries.slice(0, 10).map((entry) => (
                        <TableRow key={entry.id}>
                          <TableCell className="font-medium">{entry.location}</TableCell>
                          <TableCell>{entry.date}</TableCell>
                          <TableCell>
                            {entry.waiting_time_minutes !== null 
                              ? `${entry.waiting_time_minutes} min` 
                              : 'Invalid'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <ClockIcon className="h-12 w-12 mx-auto text-gray-300 mb-2" />
                    <p>No queue entries submitted yet</p>
                    <p className="text-sm">Submit your first entry to see it here</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default StudentDashboard;
