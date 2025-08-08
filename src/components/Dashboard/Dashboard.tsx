import React, {useState, useEffect} from 'react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, LineChart, Line, Legend
} from 'recharts';
import DashboardStats from './DashboardStats';
import RecentActivity from './RecentActivity';
import {
    DashboardStats as Stats
} from '../../types';
import {
    movementsAPI,
    articlesAPI,
    laboratoriesAPI,
    suppliersAPI,
    supplyRequestsAPI
} from '../../services/api';

import {AlertTriangle, Package, ShoppingCart} from 'lucide-react';

const Dashboard: React.FC = () => {
    const [stats, setStats] = useState<Stats>({
        totalArticles: 0,
        lowStockItems: 0,
        pendingRequests: 0,
        recentMovements: 0,
        totalLaboratories: 0,
        activeSuppliers: 0
    });

    const [chartData, setChartData] = useState({
        stockByCategory: [],
        movementsByMonth: [],
        supplierDistribution: [],
        stockTrends: []
    });

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            setError(null);

            const [articlesData, requestData, movementsData, laboratoriesData, suppliersData] = await Promise.all([
                articlesAPI.getAll(),
                supplyRequestsAPI.getAll(),
                movementsAPI.getAll(),
                laboratoriesAPI.getAll(),
                suppliersAPI.getAll(),
                //auditsAPI.getAll()
            ]);

            // Calculate stats
            const lowStockItems = articlesData.filter(article => article.currentStock <= article.minStock).length;
            const pendingRequests = requestData.filter(req => req.status === 'pending').length;
            const recentMovements = movementsData.filter(mov =>
                new Date(mov.createdAt).getTime() > Date.now() - 7 * 24 * 60 * 60 * 1000
            ).length;

            setStats({
                totalArticles: articlesData.length,
                lowStockItems,
                pendingRequests,
                recentMovements,
                totalLaboratories: laboratoriesData.length,
                activeSuppliers: suppliersData.length
            });

            // Prepare chart data
            const categoryData = articlesData.reduce((acc, article) => {
                const category = article.category;
                if (!acc[category]) {
                    acc[category] = {name: category, count: 0, value: 0};
                }
                acc[category].count++;
                acc[category].value += article.currentStock;
                return acc;
            }, {} as any);

            const supplierData = suppliersData.map(supplier => ({
                name: supplier.name,
                value: articlesData.filter(article => article.supplierId === supplier.id).length
            }));

            const movementData = movementsData.reduce((acc, movement) => {
                const month = new Date(movement.createdAt).toLocaleDateString('fr-FR', {
                    month: 'short',
                    year: 'numeric'
                });
                if (!acc[month]) {
                    acc[month] = {name: month, entrées: 0, sorties: 0};
                }
                if (movement.type === 'in') {
                    acc[month].entrées += movement.quantity;
                } else {
                    acc[month].sorties += movement.quantity;
                }
                return acc;
            }, {} as any);

            setChartData({
                stockByCategory: Object.values(categoryData),
                movementsByMonth: Object.values(movementData),
                supplierDistribution: supplierData,
                stockTrends: Object.values(categoryData)
            });

            //setFilteredMovements(movementsData);
        } catch (err) {
            console.error('Erreur lors du chargement des données:', err);
            setError('Erreur lors du chargement des données');
        } finally {
            setLoading(false);
        }
    };

    /*useEffect(() => {
      const articles = getArticles();
      const supplyRequests = getSupplyRequests();
      const stockMovements = getStockMovements();
      const laboratories = getLaboratories();
      const suppliers = getSuppliers();
      const audits = getAudits();
    }, []);*/

    const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Tableau de Bord</h1>
                    <p className="text-gray-600">Vue d'ensemble de la gestion des stocks</p>
                </div>
                <div className="text-sm text-gray-500">
                    Dernière mise à jour: {new Date().toLocaleDateString('fr-FR', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                })}
                </div>
            </div>

            <DashboardStats stats={stats}/>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Stock par Catégorie</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={chartData.stockByCategory}>
                            <CartesianGrid strokeDasharray="3 3"/>
                            <XAxis dataKey="name"/>
                            <YAxis/>
                            <Tooltip/>
                            <Bar dataKey="value" fill="#3B82F6"/>
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Répartition par Fournisseur</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie
                                data={chartData.supplierDistribution}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={({name, percent}) => `${name} ${(percent * 100).toFixed(0)}%`}
                                outerRadius={80}
                                fill="#8884d8"
                                dataKey="value"
                            >
                                {chartData.supplierDistribution.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]}/>
                                ))}
                            </Pie>
                            <Tooltip/>
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Évolution des Mouvements</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={chartData.movementsByMonth}>
                            <CartesianGrid strokeDasharray="3 3"/>
                            <XAxis dataKey="name"/>
                            <YAxis/>
                            <Tooltip/>
                            <Legend/>
                            <Line type="monotone" dataKey="entrées" stroke="#10B981" strokeWidth={2}/>
                            <Line type="monotone" dataKey="sorties" stroke="#EF4444" strokeWidth={2}/>
                        </LineChart>
                    </ResponsiveContainer>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Alertes Actives</h3>
                    <div className="space-y-3">
                        <div className="flex items-center space-x-3 p-3 bg-red-50 rounded-lg">
                            <AlertTriangle className="text-red-600" size={20}/>
                            <div>
                                <p className="font-medium text-red-800">Stocks Faibles</p>
                                <p className="text-sm text-red-600">{stats.lowStockItems} articles</p>
                            </div>
                        </div>
                        <div className="flex items-center space-x-3 p-3 bg-orange-50 rounded-lg">
                            <ShoppingCart className="text-orange-600" size={20}/>
                            <div>
                                <p className="font-medium text-orange-800">Demandes Pendantes</p>
                                <p className="text-sm text-orange-600">{stats.pendingRequests} demandes</p>
                            </div>
                        </div>
                        <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
                            <Package className="text-blue-600" size={20}/>
                            <div>
                                <p className="font-medium text-blue-800">Mouvements Récents</p>
                                <p className="text-sm text-blue-600">{stats.recentMovements} cette semaine</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <RecentActivity/>
        </div>
    );
};

export default Dashboard;