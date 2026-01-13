import React, { useState } from 'react';
import axios from 'axios';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import { Label } from '../components/ui/label';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';

const Login = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    role: 'student'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const API_BASE_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
      
      let requestData;
      if (isLogin) {
        requestData = {
          email: formData.email,
          password: formData.password
        };
      } else {
        requestData = {
          email: formData.email,
          password: formData.password,
          name: formData.name,
          role: formData.role
        };
      }

      const response = await axios.post(`${API_BASE_URL}${endpoint}`, requestData);
      
      if (response.data.access_token) {
        // For login, we need to make another call to get user details
        if (isLogin) {
          const userResponse = await axios.get(`${API_BASE_URL}/api/auth/me`, {
            headers: {
              'Authorization': `Bearer ${response.data.access_token}`
            }
          });
          
          onLogin(userResponse.data, response.data.access_token);
        } else {
          // For registration, we need to get user details separately
          const loginResponse = await axios.post(`${API_BASE_URL}/api/auth/login`, {
            email: formData.email,
            password: formData.password
          });
          
          const userResponse = await axios.get(`${API_BASE_URL}/api/auth/me`, {
            headers: {
              'Authorization': `Bearer ${loginResponse.data.access_token}`
            }
          });
          
          onLogin(userResponse.data, loginResponse.data.access_token);
        }
      }
    } catch (err) {
      // Handle error properly - extract error message from response
      let errorMessage = 'An error occurred';
      if (err.response && err.response.data) {
        if (typeof err.response.data.detail === 'string') {
          errorMessage = err.response.data.detail;
        } else if (err.response.data.detail && typeof err.response.data.detail === 'object') {
          // Handle validation errors
          if (err.response.data.detail && Array.isArray(err.response.data.detail)) {
            errorMessage = err.response.data.detail.map(error => error.msg).join(', ');
          } else {
            errorMessage = JSON.stringify(err.response.data.detail);
          }
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-blue-100 p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-indigo-700">
            Campus Queue Analyzer
          </CardTitle>
          <CardDescription>
            {isLogin ? 'Sign in to your account' : 'Create a new account'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            {!isLogin && (
              <div className="mb-4">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  name="name"
                  type="text"
                  value={formData.name}
                  onChange={handleChange}
                  required={!isLogin}
                  placeholder="John Doe"
                />
              </div>
            )}
            
            <div className="mb-4">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                required
                placeholder="email@example.com"
              />
            </div>
            
            <div className="mb-4">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                required
                placeholder="••••••••"
              />
            </div>
            
            {!isLogin && (
              <div className="mb-4">
                <Label htmlFor="role">Role</Label>
                <Select value={formData.role} onValueChange={(value) => setFormData({...formData, role: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="student">Student</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            
            {error && (
              <div className="mb-4 text-red-600 text-sm">{error}</div>
            )}
            
            <Button 
              type="submit" 
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
              disabled={loading}
            >
              {loading ? 'Processing...' : (isLogin ? 'Sign In' : 'Sign Up')}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center">
          <button
            onClick={() => {
              setIsLogin(!isLogin);
              setError('');
              setFormData({
                email: '',
                password: '',
                name: '',
                role: 'student'
              });
            }}
            className="text-indigo-600 hover:text-indigo-800 text-sm"
          >
            {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
          </button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default Login;
