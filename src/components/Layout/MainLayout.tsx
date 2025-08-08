import React, { useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import Header from './Header';
import Sidebar from './Sidebar';
import Dashboard from '../Dashboard/Dashboard';
import ArticlesPage from '../Articles/ArticlesPage';
import MovementsPage from '../Movements/MovementsPage';
import SuppliersPage from '../Suppliers/SuppliersPage';
import SupplyRequestsPage from '../SupplyRequests/SupplyRequestsPage';
import AuditsPage from '../Audits/AuditsPage';
import ReportsPage from '../Reports/ReportsPage';
import UsersPage from '../Users/UsersPage';
import LyceesPage from '../Lycees/LyceesPage';
import LaboratoriesPage from '../Laboratories/LaboratoriesPage';

const MainLayout: React.FC = () => {

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-x-hidden overflow-y-auto">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/articles" element={<ArticlesPage />} />
            <Route path="/movements" element={<MovementsPage />} />
            <Route path="/suppliers" element={<SuppliersPage />} />
            <Route path="/supply-requests" element={<SupplyRequestsPage />} />
            <Route path="/audits" element={<AuditsPage />} />
            <Route path="/reports" element={<ReportsPage />} />
            <Route path="/users" element={<UsersPage />} />
            <Route path="/lycees" element={<LyceesPage />} />
            <Route path="/laboratories" element={<LaboratoriesPage />} />
          </Routes>
        </main>
      </div>
    </div>
  );
};

export default MainLayout;