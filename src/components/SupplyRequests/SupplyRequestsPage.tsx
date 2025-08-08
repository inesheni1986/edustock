import React, { useState, useEffect } from 'react';
import { Plus, Clock, CheckCircle, XCircle, AlertCircle, Search, Filter, Download } from 'lucide-react';
import { SupplyRequest, Article, Laboratory, User, Supplier } from '../../types';
import {
  supplyRequestsAPI,
  articlesAPI,
  laboratoriesAPI,
  usersAPI,
  suppliersAPI
} from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import SupplyRequestForm from './SupplyRequestForm';

const SupplyRequestsPage: React.FC = () => {
  const { user } = useAuth();
  const [requests, setRequests] = useState<SupplyRequest[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [laboratories, setLaboratories] = useState<Laboratory[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<SupplyRequest[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedUrgency, setSelectedUrgency] = useState<string>('all');
  const [selectedLaboratory, setSelectedLaboratory] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [requestsData, articlesData, laboratoriesData, usersData, suppliersData] = await Promise.all([
        supplyRequestsAPI.getAll(),
        articlesAPI.getAll(),
        laboratoriesAPI.getAll(),
        usersAPI.getAll(),
        suppliersAPI.getAll()
      ]);

      setRequests(requestsData.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
      setArticles(articlesData);
      setLaboratories(laboratoriesData);
      setUsers(usersData);
      setSuppliers(suppliersData);
    } catch (err) {
      console.error('Erreur lors du chargement des données:', err);
      setError('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let filtered = requests;

    if (searchTerm) {
      filtered = filtered.filter(request =>
        (request.articleName && request.articleName.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (request.articleReference && request.articleReference.toLowerCase().includes(searchTerm.toLowerCase())) ||
        request.reason.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedStatus !== 'all') {
      filtered = filtered.filter(request => request.status === selectedStatus);
    }

    if (selectedUrgency !== 'all') {
      filtered = filtered.filter(request => request.urgency === selectedUrgency);
    }

    if (selectedLaboratory) {
      filtered = filtered.filter(request => request.laboratoryId === Number(selectedLaboratory));
    }

    setFilteredRequests(filtered);
  }, [requests, searchTerm, selectedStatus, selectedUrgency, selectedLaboratory]);

  const getArticleName = (articleId: string) => {
    const article = articles.find(a => a.id === articleId);
    return article ? article.name : 'Article inconnu';
  };

  const getArticleReference = (articleId: string) => {
    const article = articles.find(a => a.id === articleId);
    return article ? article.reference : '';
  };

  const getLaboratoryName = (labId: string) => {
    const lab = laboratories.find(l => l.id === labId);
    return lab ? lab.name : 'Laboratoire inconnu';
  };

  const getUserName = (userId: string) => {
    const user = users.find(u => u.id === userId);
    return user ? `${user.firstName} ${user.lastName}` : 'Utilisateur inconnu';
  };

  const getSupplierName = (supplierId: string | undefined) => {
    if (!supplierId) return 'Aucun fournisseur';
    const supplier = suppliers.find(s => s.id === supplierId);
    return supplier ? supplier.name : 'Fournisseur inconnu';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'approved': return 'bg-blue-100 text-blue-800';
      case 'ordered': return 'bg-purple-100 text-purple-800';
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock size={16} />;
      case 'approved': return <CheckCircle size={16} />;
      case 'ordered': return <AlertCircle size={16} />;
      case 'delivered': return <CheckCircle size={16} />;
      case 'cancelled': return <XCircle size={16} />;
      default: return <Clock size={16} />;
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-orange-100 text-orange-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleSubmit = async (requestData: Partial<SupplyRequest>) => {
    try {
      const newRequest = await supplyRequestsAPI.create(requestData);
      setRequests([newRequest, ...requests]);
      setShowForm(false);
    } catch (error) {
      console.error('Erreur lors de la création de la demande:', error);
      alert('Erreur lors de la création de la demande');
    }
  };

  const handleStatusChange = async (requestId: string, newStatus: string, orderReference?: string) => {
    try {
      await supplyRequestsAPI.updateStatus(requestId, newStatus, orderReference);
      // Recharger les données pour avoir les informations à jour
      await loadData();
    } catch (error) {
      console.error('Erreur lors du changement de statut:', error);
      alert('Erreur lors du changement de statut');
    }
  };

  const handleDeleteRequest = async (requestId: string) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette demande ?')) {
      try {
        await supplyRequestsAPI.delete(requestId);
        setRequests(requests.filter(r => r.id !== requestId));
      } catch (error) {
        console.error('Erreur lors de la suppression:', error);
        alert('Erreur lors de la suppression de la demande');
      }
    }
  };

  const exportToCSV = () => {
    const csvContent = [
      ['Date', 'Article', 'Référence', 'Quantité', 'Urgence', 'Statut', 'Raison', 'Laboratoire', 'Demandeur', 'Fournisseur'].join(','),
      ...filteredRequests.map(request => [
        new Date(request.createdAt).toLocaleDateString('fr-FR'),
        request.articleName || getArticleName(request.articleId),
        request.articleReference || getArticleReference(request.articleId),
        request.requestedQuantity,
        request.urgency === 'high' ? 'Élevée' : request.urgency === 'medium' ? 'Moyenne' : 'Faible',
        request.status === 'pending' ? 'En attente' :
        request.status === 'approved' ? 'Approuvée' :
        request.status === 'ordered' ? 'Commandée' :
        request.status === 'delivered' ? 'Livrée' :
        request.status === 'cancelled' ? 'Annulée' : request.status,
        request.reason,
        request.laboratoryName || getLaboratoryName(request.laboratoryId),
        request.requestedByName || getUserName(request.requestedBy),
        request.supplierName || getSupplierName(request.supplierId)
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `demandes-reapprovisionnement-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const statusCounts = {
    all: requests.length,
    pending: requests.filter(r => r.status === 'pending').length,
    approved: requests.filter(r => r.status === 'approved').length,
    ordered: requests.filter(r => r.status === 'ordered').length,
    delivered: requests.filter(r => r.status === 'delivered').length,
    cancelled: requests.filter(r => r.status === 'cancelled').length,
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement des demandes...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <div className="bg-red-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="text-red-600" size={24} />
          </div>
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={loadData}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Demandes de Réapprovisionnement</h1>
          <p className="text-gray-600">Gérez les demandes d'achat et de réapprovisionnement</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={exportToCSV}
            className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Download size={20} />
            <span>Exporter CSV</span>
          </button>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus size={20} />
            <span>Nouvelle Demande</span>
          </button>
        </div>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        {[
          { key: 'all', label: 'Toutes', color: 'bg-gray-50' },
          { key: 'pending', label: 'En attente', color: 'bg-yellow-50' },
          { key: 'approved', label: 'Approuvées', color: 'bg-blue-50' },
          { key: 'ordered', label: 'Commandées', color: 'bg-purple-50' },
          { key: 'delivered', label: 'Livrées', color: 'bg-green-50' },
          { key: 'cancelled', label: 'Annulées', color: 'bg-red-50' }
        ].map(status => (
          <button
            key={status.key}
            onClick={() => setSelectedStatus(status.key)}
            className={`p-4 rounded-lg border-2 transition-all ${
              selectedStatus === status.key 
                ? 'border-blue-500 bg-blue-50' 
                : 'border-gray-200 hover:border-gray-300'
            } ${status.color}`}
          >
            <div className="text-2xl font-bold text-gray-800">
              {statusCounts[status.key as keyof typeof statusCounts]}
            </div>
            <div className="text-sm text-gray-600">{status.label}</div>
          </button>
        ))}
      </div>

      {/* Filtres */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Rechercher..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <select
            value={selectedUrgency}
            onChange={(e) => setSelectedUrgency(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Toutes les urgences</option>
            <option value="high">Élevée</option>
            <option value="medium">Moyenne</option>
            <option value="low">Faible</option>
          </select>

          <select
            value={selectedLaboratory}
            onChange={(e) => setSelectedLaboratory(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Tous les laboratoires</option>
            {laboratories.map(lab => (
              <option key={lab.id} value={lab.id}>{lab.name}</option>
            ))}
          </select>

          <div className="flex items-center space-x-2">
            <Filter className="text-gray-400" size={20} />
            <span className="text-sm text-gray-600">
              {filteredRequests.length} demande{filteredRequests.length > 1 ? 's' : ''}
            </span>
          </div>
        </div>
      </div>

      {/* Liste des demandes */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="space-y-0">
          {filteredRequests.map((request) => (
            <div key={request.id} className="p-6 border-b border-gray-200 last:border-b-0">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="font-medium text-gray-800">
                      {request.articleName || getArticleName(request.articleId)}
                    </h3>
                    <span className="text-sm text-gray-500">
                      ({request.articleReference || getArticleReference(request.articleId)})
                    </span>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getUrgencyColor(request.urgency)}`}>
                      {request.urgency === 'high' ? 'Urgent' :
                       request.urgency === 'medium' ? 'Moyen' : 'Faible'}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-gray-600">
                    <div>
                      <span className="font-medium">Quantité:</span> {request.requestedQuantity}
                    </div>
                    <div>
                      <span className="font-medium">Laboratoire:</span> {request.laboratoryName || getLaboratoryName(request.laboratoryId)}
                    </div>
                    <div>
                      <span className="font-medium">Demandeur:</span> {request.requestedByName || getUserName(request.requestedBy)}
                    </div>
                    <div>
                      <span className="font-medium">Date:</span> {new Date(request.createdAt).toLocaleDateString('fr-FR')}
                    </div>
                  </div>

                  <div className="mt-2 text-sm text-gray-600">
                    <span className="font-medium">Raison:</span> {request.reason}
                  </div>

                  {request.notes && (
                    <div className="mt-2 text-sm text-gray-600">
                      <span className="font-medium">Notes:</span> {request.notes}
                    </div>
                  )}

                  {request.orderReference && (
                    <div className="mt-2 text-sm text-gray-600">
                      <span className="font-medium">Référence commande:</span> {request.orderReference}
                    </div>
                  )}

                  {request.unitPrice && (
                    <div className="mt-2 text-sm text-gray-600">
                      <span className="font-medium">Coût estimé:</span> {(request.unitPrice * request.requestedQuantity).toFixed(2)} €
                    </div>
                  )}
                </div>

                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(request.status)}`}>
                      {getStatusIcon(request.status)}
                      <span className="ml-1">
                        {request.status === 'pending' ? 'En attente' :
                         request.status === 'approved' ? 'Approuvée' :
                         request.status === 'ordered' ? 'Commandée' :
                         request.status === 'delivered' ? 'Livrée' :
                         request.status === 'cancelled' ? 'Annulée' : request.status}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col space-y-2">
                    {user?.role === 'admin' && request.status === 'pending' && (
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleStatusChange(request.id, 'approved')}
                          className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                        >
                          Approuver
                        </button>
                        <button
                          onClick={() => handleStatusChange(request.id, 'cancelled')}
                          className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
                        >
                          Rejeter
                        </button>
                      </div>
                    )}

                    {user?.role === 'admin' && request.status === 'approved' && (
                      <button
                        onClick={() => {
                          const orderRef = prompt('Référence de commande (optionnel):');
                          handleStatusChange(request.id, 'ordered', orderRef || undefined);
                        }}
                        className="px-3 py-1 bg-purple-600 text-white rounded text-sm hover:bg-purple-700"
                      >
                        Marquer commandée
                      </button>
                    )}

                    {user?.role === 'admin' && request.status === 'ordered' && (
                      <button
                        onClick={() => handleStatusChange(request.id, 'delivered')}
                        className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                      >
                        Marquer livrée
                      </button>
                    )}

                    {(request.requestedBy === user?.id || user?.role === 'admin') && request.status === 'pending' && (
                      <button
                        onClick={() => handleDeleteRequest(request.id)}
                        className="px-3 py-1 bg-gray-600 text-white rounded text-sm hover:bg-gray-700"
                      >
                        Supprimer
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredRequests.length === 0 && !loading && (
          <div className="text-center py-12">
            <div className="bg-gray-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="text-gray-400" size={24} />
            </div>
            <p className="text-gray-500">Aucune demande trouvée</p>
          </div>
        )}
      </div>

      {/* Formulaire de demande */}
      {showForm && (
        <SupplyRequestForm
          articles={articles}
          laboratories={laboratories}
          suppliers={suppliers}
          userId={user?.id || ''}
          onSubmit={handleSubmit}
          onCancel={() => setShowForm(false)}
        />
      )}
    </div>
  );
};

export default SupplyRequestsPage;