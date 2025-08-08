import React from 'react';
import { 
  Home, 
  Package, 
  Users, 
  Building, 
  Building2,
  Truck,
  ArrowUpDown, 
  ShoppingCart, 
  ClipboardCheck, 
  FileText,
  LogOut
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';


const Sidebar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const getActiveSection = () => {
    const path = location.pathname.slice(1);
    return path || 'dashboard';
  };

  const activeSection = getActiveSection();

  const menuItems = [
    { id: 'dashboard', label: 'Tableau de bord', icon: Home },
    { id: 'articles', label: 'Articles', icon: Package },
    { id: 'movements', label: 'Mouvements', icon: ArrowUpDown },
    { id: 'supply-requests', label: 'Réapprovisionnements', icon: ShoppingCart },
    { id: 'suppliers', label: 'Fournisseurs', icon: Truck },
    { id: 'audits', label: 'Audits', icon: ClipboardCheck },
    { id: 'reports', label: 'Rapports', icon: FileText },
  ];

  const adminMenuItems = [
    { id: 'users', label: 'Utilisateurs', icon: Users },
    { id: 'lycees', label: 'Établissements', icon: Building },
    { id: 'laboratories', label: 'Laboratoires', icon: Building2 }
  ];

  const handleNavigation = (sectionId: string) => {
    navigate(`/${sectionId}`);
  };
  return (
    <div className="w-64 bg-white shadow-lg border-r border-gray-200 flex flex-col">
      <div className="p-6 border-b border-gray-200">
        <h1 className="text-xl font-bold text-emerald-900">EduStock</h1>
        <p className="text-sm text-gray-600 mt-1">Gestion des stocks</p>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => handleNavigation(item.id)}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors ${
                activeSection === item.id
                  ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-500'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Icon size={18} />
              <span className="text-sm font-medium">{item.label}</span>
            </button>
          );
        })}
        
        {user?.role === 'admin' && (
          <>
            <div className="border-t border-gray-200 pt-4 mt-4">
              <p className="text-xs text-gray-500 uppercase tracking-wider font-medium px-4 mb-2">
                Administration
              </p>
              {adminMenuItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleNavigation(item.id)}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors ${
                      activeSection === item.id
                        ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-500'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <Icon size={18} />
                    <span className="text-sm font-medium">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </>
        )}
      </nav>

      <div className="p-4 border-t border-gray-200">
        <button
          onClick={logout}
          className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left text-red-600 hover:bg-red-50 transition-colors"
        >
          <LogOut size={18} />
          <span className="text-sm font-medium">Déconnexion</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;