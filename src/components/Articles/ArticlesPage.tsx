import React, { useState, useEffect } from 'react';
import {Plus, Search, Filter, Download, Edit, Trash2, AlertTriangle, Package} from 'lucide-react';
import { Article, Laboratory, Supplier } from '../../types';
import { articlesAPI, laboratoriesAPI, suppliersAPI } from '../../services/api';
import ArticleForm from './ArticleForm';

const ArticlesPage: React.FC = () => {
  const [articles, setArticles] = useState<Article[]>([]);
  const [laboratories, setLaboratories] = useState<Laboratory[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [filteredArticles, setFilteredArticles] = useState<Article[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedLaboratory, setSelectedLaboratory] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingArticle, setEditingArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [articlesData, laboratoriesData, suppliersData] = await Promise.all([
        articlesAPI.getAll(),
        laboratoriesAPI.getAll(),
        suppliersAPI.getAll()
      ]);
      
      setArticles(articlesData);
      setLaboratories(laboratoriesData);
      setSuppliers(suppliersData);
      setFilteredArticles(articlesData);
    } catch (err) {
      console.error('Erreur lors du chargement des données:', err);
      setError('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    let filtered = articles;

    if (searchTerm) {
      filtered = filtered.filter(article =>
        article.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        article.reference.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedCategory) {
      filtered = filtered.filter(article => article.category === selectedCategory);
    }

    if (selectedLaboratory) {
      filtered = filtered.filter(article => article.laboratoryId === selectedLaboratory);
    }

    setFilteredArticles(filtered);
  }, [articles, searchTerm, selectedCategory, selectedLaboratory]);

  const categories = [...new Set(articles.map(article => article.category))];

  const getLaboratoryName = (labId: string) => {
    const lab = laboratories.find(l => l.id === labId);
    return lab ? lab.name : 'Laboratoire inconnu';
  };

  const getSupplierName = (supplierId: string | undefined) => {
    if (!supplierId) return 'Aucun fournisseur';
    const supplier = suppliers.find(s => s.id === supplierId);
    return supplier ? supplier.name : 'Fournisseur inconnu';
  };

  const handleSubmit = (articleData: Partial<Article>) => {
    handleSubmitAsync(articleData);
  };

  const handleSubmitAsync = async (articleData: Partial<Article>) => {
    try {
      if (editingArticle) {
        const updatedArticle = await articlesAPI.update(editingArticle.id, articleData);
        setArticles(articles.map(a => a.id === editingArticle.id ? updatedArticle : a));
      } else {
        const newArticle = await articlesAPI.create(articleData);
        setArticles([...articles, newArticle]);
      }
      
      setShowForm(false);
      setEditingArticle(null);
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      alert('Erreur lors de la sauvegarde de l\'article');
    }
  };

  const handleDeleteArticle = (articleId: string) => {
    handleDeleteAsync(articleId);
  };

  const handleDeleteAsync = async (articleId: string) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cet article ?')) {
      try {
        await articlesAPI.delete(articleId);
        setArticles(articles.filter(a => a.id !== articleId));
      } catch (error) {
        console.error('Erreur lors de la suppression:', error);
        alert('Erreur lors de la suppression de l\'article');
      }
    }
  };

  const isLowStock = (article: Article) => article.currentStock <= article.minStock;

  const exportToCSV = () => {
    const csvContent = [
      ['Nom', 'Référence', 'Catégorie', 'Stock Actuel', 'Stock Min', 'Stock Max', 'Prix Unitaire', 'Laboratoire', 'Fournisseur'].join(','),
      ...filteredArticles.map(article => [
        article.name,
        article.reference,
        article.category,
        article.currentStock,
        article.minStock,
        article.maxStock,
        article.unitPrice,
        getLaboratoryName(article.laboratoryId),
        getSupplierName(article.supplierId)
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `articles-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement des articles...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <div className="bg-red-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="text-red-600" size={24} />
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
          <h1 className="text-2xl font-bold text-gray-800">Gestion des Articles</h1>
          <p className="text-gray-600">Gérez votre inventaire d'articles et matériels</p>
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
            <span>Nouvel Article</span>
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
              placeholder="Rechercher par nom ou référence..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Toutes les catégories</option>
            {categories.map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
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
              {filteredArticles.length} article{filteredArticles.length > 1 ? 's' : ''}
            </span>
          </div>
        </div>
      </div>

      {/* Liste des articles */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Article
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Catégorie
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Stock
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Prix
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Laboratoire
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fournisseur
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredArticles.map((article) => (
                <tr key={article.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {isLowStock(article) && (
                        <AlertTriangle className="text-red-500 mr-2" size={16} />
                      )}
                      <div>
                        <div className="text-sm font-medium text-gray-900">{article.name}</div>
                        <div className="text-sm text-gray-500">{article.reference}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {article.category}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {article.currentStock} {article.unit}
                    </div>
                    <div className="text-sm text-gray-500">
                      Min: {article.minStock} | Max: {article.maxStock}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {article.unitPrice.toFixed(2)} €
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {article.laboratoryName || 'Laboratoire inconnu'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {article.supplierName || 'Aucun fournisseur'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => {
                        setEditingArticle(article);
                        setShowForm(true);
                      }}
                      className="text-blue-600 hover:text-blue-900 mr-4"
                    >
                      <Edit size={16} />
                    </button>
                    <button 
                      onClick={() => handleDeleteArticle(article.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredArticles.length === 0 && !loading && (
          <div className="text-center py-12">
            <div className="bg-gray-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <Package className="text-gray-400" size={24} />
            </div>
            <p className="text-gray-500">Aucun article trouvé</p>
          </div>
        )}
      </div>

      {/* Formulaire d'ajout/modification */}
      {showForm && (
        <ArticleForm
          article={editingArticle}
          laboratories={laboratories}
          suppliers={suppliers}
          onSubmit={handleSubmit}
          onCancel={() => {
            setShowForm(false);
            setEditingArticle(null);
          }}
        />
      )}
    </div>
  );
};

export default ArticlesPage;