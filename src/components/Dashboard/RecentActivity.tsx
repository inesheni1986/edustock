import React, {useState, useEffect} from 'react';
import {Clock, ArrowUpCircle, ArrowDownCircle, ShoppingCart, ClipboardCheck} from 'lucide-react';
import {
    StockMovement,
    SupplyRequest,
    Article,
    Laboratory,
    Audit
} from '../../types';
import {
    movementsAPI,
    articlesAPI,
    laboratoriesAPI,
    suppliersAPI,
    supplyRequestsAPI,
    auditsAPI
} from '../../services/api';

const RecentActivity: React.FC = () => {
    const [recentMovements, setRecentMovements] = useState<StockMovement[]>([]);
    const [recentRequests, setRecentRequests] = useState<SupplyRequest[]>([]);
    const [recentAudits, setRecentAudits] = useState<Audit[]>([]);
    const [articles, setArticles] = useState<Article[]>([]);
    const [laboratories, setLaboratories] = useState<Laboratory[]>([]);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const loadData = async () => {
        try {
            setLoading(true);
            setError(null);

            const [articlesData, requestData, movementsData, laboratoriesData, auditsData, usersData] = await Promise.all([
                articlesAPI.getAll(),
                supplyRequestsAPI.getAll(),
                movementsAPI.getAll(),
                laboratoriesAPI.getAll(),
                auditsAPI.getAll()
            ]);

            const movements = movementsData
                .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                .slice(0, 5);
            const requests = requestData
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .slice(0, 3);

            const audits = auditsData
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .slice(0, 2);

            setRecentMovements(movements);
            setRecentRequests(requests);
            setRecentAudits(audits);
            setArticles(articlesData);
            setLaboratories(laboratoriesData);
            setUsers(usersData);
        } catch (err) {
            console.error('Erreur lors du chargement des activité récente :', err);
            setError('Erreur lors du chargement des données');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const getArticleName = (articleId: string) => {
        const article = articles.find(a => a.id === articleId);
        return article ? article.name : 'Article inconnu';
    };

    const getLaboratoryName = (labId: string) => {
        const lab = laboratories.find(l => l.id === labId);
        return lab ? lab.name : 'Laboratoire inconnu';
    };

    const formatTimeAgo = (date: Date) => {
        const now = new Date();
        const diffInHours = Math.floor((now.getTime() - new Date(date).getTime()) / (1000 * 60 * 60));

        if (diffInHours < 1) return 'Il y a moins d\'1h';
        if (diffInHours < 24) return `Il y a ${diffInHours}h`;
        const diffInDays = Math.floor(diffInHours / 24);
        return `Il y a ${diffInDays} jour${diffInDays > 1 ? 's' : ''}`;
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-6">Activité Récente</h3>

            <div className="space-y-4">
                {/* Mouvements récents */}
                {recentMovements.map((movement) => (
                    <div key={`movement-${movement.id}`}
                         className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                        <div className={`p-2 rounded-full ${
                            movement.type === 'in'
                                ? 'bg-green-100 text-green-600'
                                : 'bg-red-100 text-red-600'
                        }`}>
                            {movement.type === 'in' ? (
                                <ArrowUpCircle size={16}/>
                            ) : (
                                <ArrowDownCircle size={16}/>
                            )}
                        </div>
                        <div className="flex-1">
                            <p className="text-sm font-medium text-gray-800">
                                {movement.type === 'in' ? 'Entrée' : 'Sortie'} - {getArticleName(movement.articleId)}
                            </p>
                            <p className="text-xs text-gray-600">
                                {movement.quantity} unités • {getLaboratoryName(movement.laboratoryId)}
                            </p>
                        </div>
                        <div className="text-xs text-gray-500">
                            {formatTimeAgo(movement.createdAt)}
                        </div>
                    </div>
                ))}

                {/* Demandes récentes */}
                {recentRequests.map((request) => (
                    <div key={`request-${request.id}`}
                         className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
                        <div className="p-2 rounded-full bg-blue-100 text-blue-600">
                            <ShoppingCart size={16}/>
                        </div>
                        <div className="flex-1">
                            <p className="text-sm font-medium text-gray-800">
                                Demande de réapprovisionnement
                            </p>
                            <p className="text-xs text-gray-600">
                                {getArticleName(request.articleId)} • {request.requestedQuantity} unités
                            </p>
                        </div>
                        <div className="text-xs text-gray-500">
                            {formatTimeAgo(request.createdAt)}
                        </div>
                    </div>
                ))}

                {/* Audits récents */}
                {recentAudits.map((audit) => (
                    <div key={`audit-${audit.id}`} className="flex items-center space-x-3 p-3 bg-purple-50 rounded-lg">
                        <div className="p-2 rounded-full bg-purple-100 text-purple-600">
                            <ClipboardCheck size={16}/>
                        </div>
                        <div className="flex-1">
                            <p className="text-sm font-medium text-gray-800">
                                Audit {audit.auditType === 'inventory' ? 'inventaire' : audit.auditType}
                            </p>
                            <p className="text-xs text-gray-600">
                                {getLaboratoryName(audit.laboratoryId)} • {audit.findings.length} écart{audit.findings.length > 1 ? 's' : ''}
                            </p>
                        </div>
                        <div className="text-xs text-gray-500">
                            {formatTimeAgo(audit.createdAt)}
                        </div>
                    </div>
                ))}

                {recentMovements.length === 0 && recentRequests.length === 0 && recentAudits.length === 0 && (
                    <div className="text-center py-8">
                        <Clock className="mx-auto text-gray-400 mb-2" size={24}/>
                        <p className="text-gray-500 text-sm">Aucune activité récente</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default RecentActivity;