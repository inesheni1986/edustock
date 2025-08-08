import React, { useState, useEffect } from 'react';
import { Plus, ArrowUpCircle, ArrowDownCircle, Download, Search } from 'lucide-react';
import { StockMovement, Article, Laboratory, User } from '../../types';
import { movementsAPI, articlesAPI, laboratoriesAPI, usersAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import MovementForm from './MovementForm';

const MovementsPage: React.FC = () => {
  const { user } = useAuth();
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [laboratories, setLaboratories] = useState<Laboratory[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [filteredMovements, setFilteredMovements] = useState<StockMovement[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<'all' | 'in' | 'out'>('all');
  const [selectedLaboratory, setSelectedLaboratory] = useState('');
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [movementsData, articlesData, laboratoriesData, usersData] = await Promise.all([
        movementsAPI.getAll(),
        articlesAPI.getAll(),
        laboratoriesAPI.getAll(),
        usersAPI.getAll()
      ]);

      setMovements(movementsData.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
      setArticles(articlesData);
      setLaboratories(laboratoriesData);
      setUsers(usersData);
      setFilteredMovements(movementsData);
    } catch (err) {
      console.error('Erreur lors du chargement des données:', err);
      setError('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let filtered = movements;

    if (searchTerm) {
      filtered = filtered.filter(movement => {
        const article = articles.find(a => a.id === movement.articleId);
        return article && (
          article.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          article.reference.toLowerCase().includes(searchTerm.toLowerCase()) ||
          movement.reason.toLowerCase().includes(searchTerm.toLowerCase())
        );
      });
    }

    if (selectedType !== 'all') {
      filtered = filtered.filter(movement => movement.type === selectedType);
    }

    if (selectedLaboratory) {
      filtered = filtered.filter(movement => movement.laboratoryId === Number(selectedLaboratory));
    }

    setFilteredMovements(filtered);
  }, [movements, articles, searchTerm, selectedType, selectedLaboratory]);

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

  const handleSubmit = (movementData: Partial<StockMovement>) => {
    handleSubmitAsync(movementData);
  };

  const handleSubmitAsync = async (movementData: Partial<StockMovement>) => {
    try {
      const newMovement = await movementsAPI.create(movementData);
      setMovements([newMovement, ...movements]);
      setShowForm(false);
      // Recharger les articles pour mettre à jour les stocks
      const updatedArticles = await articlesAPI.getAll();
      setArticles(updatedArticles);
    } catch (error) {
      console.error('Erreur lors de la création du mouvement:', error);
      alert('Erreur lors de la création du mouvement');
    }
  };

  const exportToCSV = () => {
    const csvContent = [
      ['Date', 'Type', 'Article', 'Référence', 'Quantité', 'Raison', 'Utilisateur', 'Laboratoire', 'Notes'].join(','),
      ...filteredMovements.map(movement => [
        new Date(movement.createdAt).toLocaleDateString('fr-FR'),
        movement.type === 'in' ? 'Entrée' : 'Sortie',
        getArticleName(movement.articleId),
        getArticleReference(movement.articleId),
        movement.quantity,
        movement.reason,
        getUserName(movement.userId),
        getLaboratoryName(movement.laboratoryId),
        movement.notes || ''
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `mouvements-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement des mouvements...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <div className="bg-red-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
            <ArrowUpCircle className="text-red-600" size={24} />
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
          <h1 className="text-2xl font-bold text-gray-800">Mouvements de Stock</h1>
          <p className="text-gray-600">Historique des entrées et sorties de stock</p>
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
            <span>Nouveau Mouvement</span>
          </button>
        </div>
      </div>

      {/* Filtres */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value as 'all' | 'in' | 'out')}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Tous les types</option>
            <option value="in">Entrées</option>
            <option value="out">Sorties</option>
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
            <span className="text-sm text-gray-600">
              {filteredMovements.length} mouvement{filteredMovements.length > 1 ? 's' : ''}
            </span>
          </div>
        </div>
      </div>

      {/* Liste des mouvements */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="space-y-0">
          {filteredMovements.map((movement) => (
            <div key={movement.id} className="p-6 border-b border-gray-200 last:border-b-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className={`p-3 rounded-full ${
                    movement.type === 'in' 
                      ? 'bg-green-100 text-green-600' 
                      : 'bg-red-100 text-red-600'
                  }`}>
                    {movement.type === 'in' ? (
                      <ArrowUpCircle size={24} />
                    ) : (
                      <ArrowDownCircle size={24} />
                    )}
                  </div>
                  
                  <div>
                    <div className="flex items-center space-x-2">
                      <h3 className="font-medium text-gray-800">
                        {movement.type === 'in' ? 'Entrée' : 'Sortie'} - {getArticleName(movement.articleId)}
                      </h3>
                      <span className="text-sm text-gray-500">
                        ({getArticleReference(movement.articleId)})
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      Quantité: {movement.quantity} | Raison: {movement.reason}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      {getLaboratoryName(movement.laboratoryId)} • {getUserName(movement.userId)}
                    </p>
                    {movement.notes && (
                      <p className="text-sm text-gray-500 mt-1">
                        Note: {movement.notes}
                      </p>
                    )}
                  </div>
                </div>
                
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-800">
                    {new Date(movement.createdAt).toLocaleDateString('fr-FR')}
                  </p>
                  <p className="text-xs text-gray-500">
                    {new Date(movement.createdAt).toLocaleTimeString('fr-FR', { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredMovements.length === 0 && (
          <div className="text-center py-12">
            <ArrowUpCircle className="mx-auto text-gray-400 mb-4" size={48} />
            <p className="text-gray-500">Aucun mouvement trouvé</p>
          </div>
        )}
      </div>

      {/* Formulaire de mouvement */}
      {showForm && (
        <MovementForm
          articles={articles}
          laboratories={laboratories}
          userId={user?.id || ''}
          onSubmit={handleSubmit}
          onCancel={() => setShowForm(false)}
        />
      )}
    </div>
  );
};

export default MovementsPage;