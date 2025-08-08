import React from 'react';
import { Package, AlertTriangle, ShoppingCart, TrendingUp, Building, Truck } from 'lucide-react';
import { DashboardStats as Stats } from '../../types';

interface DashboardStatsProps {
  stats: Stats;
}

const DashboardStats: React.FC<DashboardStatsProps> = ({ stats }) => {
  const statCards = [
    {
      title: 'Total Articles',
      value: stats.totalArticles,
      icon: Package,
      color: 'bg-blue-100 text-blue-600',
      bgColor: 'bg-blue-50',
      changeType: 'positive'
    },
    {
      title: 'Stocks Faibles',
      value: stats.lowStockItems,
      icon: AlertTriangle,
      color: 'bg-orange-100 text-orange-600',
      bgColor: 'bg-orange-50',
      changeType: 'negative'
    },
    {
      title: 'Demandes en Attente',
      value: stats.pendingRequests,
      icon: ShoppingCart,
      color: 'bg-red-100 text-red-600',
      bgColor: 'bg-red-50',
      changeType: 'positive'
    },
    {
      title: 'Mouvements Récents',
      value: stats.recentMovements,
      icon: TrendingUp,
      color: 'bg-green-100 text-green-600',
      bgColor: 'bg-green-50',
      changeType: 'positive'
    },
    {
      title: 'Laboratoires',
      value: stats.totalLaboratories,
      icon: Building,
      color: 'bg-purple-100 text-purple-600',
      bgColor: 'bg-purple-50',
      changeType: 'neutral'
    },
    {
      title: 'Fournisseurs Actifs',
      value: stats.activeSuppliers,
      icon: Truck,
      color: 'bg-indigo-100 text-indigo-600',
      bgColor: 'bg-indigo-50',
      changeType: 'positive'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {statCards.map((card, index) => {
        const Icon = card.icon;
        return (
          <div key={index} className={`${card.bgColor} rounded-xl p-6 border border-gray-200`}>
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-lg ${card.color}`}>
                <Icon size={24} />
              </div>
              <div className={`text-sm font-medium ${
                card.changeType === 'positive' ? 'text-green-600' : 
                card.changeType === 'negative' ? 'text-red-600' : 'text-gray-600'
              }`}>
                {card.change}
              </div>
            </div>
            <h3 className="text-2xl font-bold text-gray-800 mb-1">{card.value}</h3>
            <p className="text-gray-600 text-sm">{card.title}</p>
          </div>
        );
      })}
    </div>
  );
};

export default DashboardStats;