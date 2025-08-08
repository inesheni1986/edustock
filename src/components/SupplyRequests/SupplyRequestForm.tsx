import React, { useState } from 'react';
import { X } from 'lucide-react';
import { Article, Laboratory, Supplier, SupplyRequest } from '../../types';

interface SupplyRequestFormProps {
  articles: Article[];
  laboratories: Laboratory[];
  suppliers: Supplier[];
  userId: string;
  onSubmit: (request: Partial<SupplyRequest>) => void;
  onCancel: () => void;
}

const SupplyRequestForm: React.FC<SupplyRequestFormProps> = ({
  articles,
  laboratories,
  suppliers,
  userId,
  onSubmit,
  onCancel
}) => {
  const [formData, setFormData] = useState({
    articleId: '',
    laboratoryId: '',
    requestedQuantity: 0,
    urgency: 'medium' as 'low' | 'medium' | 'high',
    reason: '',
    supplierId: '',
    notes: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      requestedBy: userId,
      status: 'pending'
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {debugger;
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'requestedQuantity' ? Number(value) : value
    }));
  };

  const filteredArticles = articles.filter(article => 
    !formData.laboratoryId || article.laboratoryId === Number(formData.laboratoryId)
  );

  const selectedArticle = articles.find(a => a.id === formData.articleId);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-bold text-gray-800">Nouvelle Demande de Réapprovisionnement</h2>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Laboratoire *
              </label>
              <select
                name="laboratoryId"
                value={formData.laboratoryId}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Sélectionner un laboratoire</option>
                {laboratories.map(lab => (
                  <option key={lab.id} value={lab.id}>{lab.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Article *
              </label>
              <select
                name="articleId"
                value={formData.articleId}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Sélectionner un article</option>
                {filteredArticles.map(article => (
                  <option key={article.id} value={article.id}>
                    {article.name} ({article.reference}) - Stock: {article.currentStock}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Quantité demandée *
              </label>
              <input
                type="number"
                name="requestedQuantity"
                value={formData.requestedQuantity}
                onChange={handleChange}
                min="1"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Urgence *
              </label>
              <select
                name="urgency"
                value={formData.urgency}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="low">Faible</option>
                <option value="medium">Moyenne</option>
                <option value="high">Élevée</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fournisseur préféré
              </label>
              <select
                name="supplierId"
                value={formData.supplierId}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Aucune préférence</option>
                {suppliers.map(supplier => (
                  <option key={supplier.id} value={supplier.id}>{supplier.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Raison de la demande *
              </label>
              <select
                name="reason"
                value={formData.reason}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Sélectionner une raison</option>
                <option value="Stock épuisé">Stock épuisé</option>
                <option value="Stock faible">Stock faible</option>
                <option value="Préparation TP">Préparation TP</option>
                <option value="Nouvel équipement">Nouvel équipement</option>
                <option value="Remplacement matériel défaillant">Remplacement matériel défaillant</option>
                <option value="Autre">Autre</option>
              </select>
            </div>
          </div>

          {selectedArticle && (
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h4 className="font-medium text-blue-800 mb-2">Informations sur l'article</h4>
              <div className="text-sm text-blue-700 space-y-1">
                <p><strong>Stock actuel:</strong> {selectedArticle.currentStock} {selectedArticle.unit}</p>
                <p><strong>Stock minimum:</strong> {selectedArticle.minStock} {selectedArticle.unit}</p>
                <p><strong>Prix unitaire:</strong> {selectedArticle.unitPrice.toFixed(2)} €</p>
                <p><strong>Coût estimé:</strong> {(selectedArticle.unitPrice * formData.requestedQuantity).toFixed(2)} €</p>
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notes complémentaires
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Informations supplémentaires..."
            />
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Créer la demande
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SupplyRequestForm;