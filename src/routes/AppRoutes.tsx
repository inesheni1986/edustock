import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import LoginForm from '../components/Login/LoginForm';
import MainLayout from '../components/Layout/MainLayout';

const AppRoutes: React.FC = () => {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <LoginForm />;
  }

  return (
    <Routes>
      <Route path="/*" element={<MainLayout />} />
    </Routes>
  );
};

export default AppRoutes;