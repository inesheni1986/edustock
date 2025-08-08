import React, { useState, useEffect } from 'react';
import { Download, FileText, Calendar, Filter } from 'lucide-react';
import { 
  Article, 
  StockMovement, 
  SupplyRequest, 
  Laboratory,
  Supplier 
} from '../../types';
import { 
  getArticles, 
  getStockMovements, 
  getSupplyRequests, 
  getLaboratories,
  getSuppliers 
} from '../../services/mockData';
import jsPDF from 'jspdf';

const ReportsPage: React.FC = () => {
  const [articles, setArticles] = useState<Article[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [requests, setRequests] = useState<SupplyRequest[]>([]);
  const [laboratories, setLaboratories] = useState<Laboratory[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [selectedLaboratory, setSelectedLaboratory] = useState('');
  const [selectedSupplier, setSelectedSupplier] = useState('');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });

  useEffect(() => {
    setArticles(getArticles());
    setMovements(getStockMovements());
    setRequests(getSupplyRequests());
    setLaboratories(getLaboratories());
    setSuppliers(getSuppliers());
  }, []);

  const getLaboratoryName = (labId: string) => {
    const lab = laboratories.find(l => l.id === labId);
    return lab ? lab.name : 'Laboratoire inconnu';
  };

  const getSupplierName = (supplierId: string | undefined) => {
    if (!supplierId) return 'Aucun fournisseur';
    const supplier = suppliers.find(s => s.id === supplierId);
    return supplier ? supplier.name : 'Fournisseur inconnu';
  };

  const getArticleName = (articleId: string) => {
    const article = articles.find(a => a.id === articleId);
    return article ? article.name : 'Article inconnu';
  };

  const filterData = () => {
    let filteredArticles = articles;
    let filteredMovements = movements;
    let filteredRequests = requests;

    if (selectedLaboratory) {
      filteredArticles = filteredArticles.filter(a => a.laboratoryId === selectedLaboratory);
      filteredMovements = filteredMovements.filter(m => m.laboratoryId === selectedLaboratory);
      filteredRequests = filteredRequests.filter(r => r.laboratoryId === selectedLaboratory);
    }

    if (selectedSupplier) {
      filteredArticles = filteredArticles.filter(a => a.supplierId === selectedSupplier);
    }

    if (dateRange.start && dateRange.end) {
      const start = new Date(dateRange.start);
      const end = new Date(dateRange.end);
      filteredMovements = filteredMovements.filter(m => {
        const date = new Date(m.createdAt);
        return date >= start && date <= end;
      });
      filteredRequests = filteredRequests.filter(r => {
        const date = new Date(r.createdAt);
        return date >= start && date <= end;
      });
    }

    return { filteredArticles, filteredMovements, filteredRequests };
  };

  const exportInventoryReport = () => {
    const { filteredArticles } = filterData();
    
    const csvContent = [
      ['Nom', 'Référence', 'Catégorie', 'Stock Actuel', 'Stock Min', 'Stock Max', 'Valeur Stock', 'Laboratoire', 'Fournisseur', 'Statut'].join(','),
      ...filteredArticles.map(article => [
        article.name,
        article.reference,
        article.category,
        article.currentStock,
        article.minStock,
        article.maxStock,
        (article.currentStock * article.unitPrice).toFixed(2),
        getLaboratoryName(article.laboratoryId),
        getSupplierName(article.supplierId),
        article.currentStock <= article.minStock ? 'Stock faible' : 'OK'
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `inventaire-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const exportMovementsReport = () => {
    const { filteredMovements } = filterData();
    
    const csvContent = [
      ['Date', 'Type', 'Article', 'Quantité', 'Raison', 'Laboratoire', 'Utilisateur', 'Notes'].join(','),
      ...filteredMovements.map(movement => [
        new Date(movement.createdAt).toLocaleDateString('fr-FR'),
        movement.type === 'in' ? 'Entrée' : 'Sortie',
        getArticleName(movement.articleId),
        movement.quantity,
        movement.reason,
        getLaboratoryName(movement.laboratoryId),
        'Utilisateur', // getUserName would be needed here
        movement.notes || ''
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `mouvements-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const exportSupplyRequestsReport = () => {
    const { filteredRequests } = filterData();
    
    const csvContent = [
      ['Date', 'Article', 'Quantité', 'Urgence', 'Statut', 'Raison', 'Laboratoire', 'Fournisseur'].join(','),
      ...filteredRequests.map(request => [
        new Date(request.createdAt).toLocaleDateString('fr-FR'),
        getArticleName(request.articleId),
        request.requestedQuantity,
        request.urgency,
        request.status,
        request.reason,
        getLaboratoryName(request.laboratoryId),
        getSupplierName(request.supplierId)
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `demandes-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const generatePDFReport = () => {
    const { filteredArticles, filteredMovements, filteredRequests } = filterData();
    
    const doc = new jsPDF();
    
    // En-tête
    doc.setFontSize(20);
    doc.text('Rapport de Stock GestiLab', 20, 20);
    doc.setFontSize(12);
    doc.text(`Généré le ${new Date().toLocaleDateString('fr-FR')}`, 20, 30);
    
    let yPosition = 50;
    
    // Statistiques générales
    doc.setFontSize(16);
    doc.text('Statistiques Générales', 20, yPosition);
    yPosition += 10;
    
    doc.setFontSize(12);
    doc.text(`Total articles: ${filteredArticles.length}`, 20, yPosition);
    yPosition += 8;
    doc.text(`Articles en stock faible: ${filteredArticles.filter(a => a.currentStock <= a.minStock).length}`, 20, yPosition);
    yPosition += 8;
    doc.text(`Mouvements récents: ${filteredMovements.length}`, 20, yPosition);
    yPosition += 8;
    doc.text(`Demandes en attente: ${filteredRequests.filter(r => r.status === 'pending').length}`, 20, yPosition);
    yPosition += 20;
    
    // Valeur totale du stock
    const totalValue = filteredArticles.reduce((sum, article) => sum + (article.currentStock * article.unitPrice), 0);
    doc.text(`Valeur totale du stock: ${totalValue.toFixed(2)} €`, 20, yPosition);
    yPosition += 20;
    
    // Articles en stock faible
    const lowStockArticles = filteredArticles.filter(a => a.currentStock <= a.minStock);
    if (lowStockArticles.length > 0) {
      doc.setFontSize(16);
      doc.text('Articles en Stock Faible', 20, yPosition);
      yPosition += 10;
      
      doc.setFontSize(10);
      lowStockArticles.forEach(article => {
        if (yPosition > 270) {
          doc.addPage();
          yPosition = 20;
        }
        doc.text(`${article.name} (${article.reference}): ${article.currentStock}/${article.minStock}`, 20, yPosition);
        yPosition += 6;
      });
    }
    
    doc.save(`rapport-stock-${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const { filteredArticles, filteredMovements, filteredRequests } = filterData();

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Rapports et Exports</h1>
          <p className="text-gray-600">Générez des rapports détaillés sur votre stock</p>
        </div>
      </div>

      {/* Filtres */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center space-x-2 mb-4">
          <Filter className="text-gray-400" size={20} />
          <h3 className="text-lg font-semibold text-gray-800">Filtres</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Laboratoire
            </label>
            <select
              value={selectedLaboratory}
              onChange={(e) => setSelectedLaboratory(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Tous les laboratoires</option>
              {laboratories.map(lab => (
                <option key={lab.id} value={lab.id}>{lab.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Fournisseur
            </label>
            <select
              value={selectedSupplier}
              onChange={(e) => setSelectedSupplier(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Tous les fournisseurs</option>
              {suppliers.map(supplier => (
                <option key={supplier.id} value={supplier.id}>{supplier.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Date début
            </label>
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Date fin
            </label>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Aperçu des données */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Articles</p>
              <p className="text-2xl font-bold text-gray-800">{filteredArticles.length}</p>
            </div>
            <FileText className="text-blue-600" size={24} />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Mouvements</p>
              <p className="text-2xl font-bold text-gray-800">{filteredMovements.length}</p>
            </div>
            <Calendar className="text-green-600" size={24} />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Demandes</p>
              <p className="text-2xl font-bold text-gray-800">{filteredRequests.length}</p>
            </div>
            <Download className="text-purple-600" size={24} />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Valeur Stock</p>
              <p className="text-2xl font-bold text-gray-800">
                {filteredArticles.reduce((sum, article) => sum + (article.currentStock * article.unitPrice), 0).toFixed(0)} €
              </p>
            </div>
            <FileText className="text-orange-600" size={24} />
          </div>
        </div>
      </div>

      {/* Options d'export */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Options d'Export</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <button
            onClick={exportInventoryReport}
            className="flex items-center space-x-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Download size={20} />
            <span>Rapport Inventaire CSV</span>
          </button>

          <button
            onClick={exportMovementsReport}
            className="flex items-center space-x-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Download size={20} />
            <span>Rapport Mouvements CSV</span>
          </button>

          <button
            onClick={exportSupplyRequestsReport}
            className="flex items-center space-x-2 px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            <Download size={20} />
            <span>Rapport Demandes CSV</span>
          </button>

          <button
            onClick={generatePDFReport}
            className="flex items-center space-x-2 px-4 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
          >
            <FileText size={20} />
            <span>Rapport Complet PDF</span>
          </button>
        </div>
      </div>

      {/* Résumé des stocks faibles */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Articles en Stock Faible</h3>
        
        <div className="space-y-3">
          {filteredArticles
            .filter(article => article.currentStock <= article.minStock)
            .map(article => (
              <div key={article.id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                <div>
                  <p className="font-medium text-red-800">{article.name}</p>
                  <p className="text-sm text-red-600">
                    {article.reference} • {getLaboratoryName(article.laboratoryId)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-red-800">
                    Stock: {article.currentStock} / {article.minStock}
                  </p>
                  <p className="text-xs text-red-600">
                    Manque: {article.minStock - article.currentStock}
                  </p>
                </div>
              </div>
            ))}
        </div>

        {filteredArticles.filter(article => article.currentStock <= article.minStock).length === 0 && (
          <p className="text-gray-500 text-center py-8">Aucun article en stock faible</p>
        )}
      </div>
    </div>
  );
};

export default ReportsPage;