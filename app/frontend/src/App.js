import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import Login from './pages/Login';
import StudentDashboard from './pages/StudentDashboard';
import AdminDashboard from './pages/AdminDashboard';

const AppContent = () => {
  const [currentUser, setCurrentUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is logged in on app start
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');

    if (token && user) {
      try {
        const parsedUser = JSON.parse(user);
        setCurrentUser(parsedUser);
      } catch (error) {
        console.error('Error parsing user data:', error);
        logout();
      }
    }
  }, []);

  const login = (userData, token) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setCurrentUser(userData);
    navigate(userData.role === 'admin' ? '/admin' : '/dashboard');
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setCurrentUser(null);
    navigate('/login');
  };

  const ProtectedRoute = ({ children, allowedRoles }) => {
    if (!currentUser) {
      return <Navigate to="/login" />;
    }

    if (allowedRoles && !allowedRoles.includes(currentUser.role)) {
      return <Navigate to={currentUser.role === 'admin' ? '/admin' : '/dashboard'} />;
    }

    return children;
  };

  return (
    <div className="App">
      <Routes>
        <Route
          path="/login"
          element={!currentUser ? <Login onLogin={login} /> :
            currentUser.role === 'admin' ? <Navigate to="/admin" /> : <Navigate to="/dashboard" />}
        />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute allowedRoles={['student']}>
              <StudentDashboard user={currentUser} onLogout={logout} />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminDashboard user={currentUser} onLogout={logout} />
            </ProtectedRoute>
          }
        />
        <Route path="/" element={<Navigate to={currentUser ? (currentUser.role === 'admin' ? '/admin' : '/dashboard') : '/login'} />} />
      </Routes>
    </div>
  );
};

function App() {
  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AppContent />
    </Router>
  );
}

export default App;
