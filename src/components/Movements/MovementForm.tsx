import React, { useState } from 'react';
import { X } from 'lucide-react';
import { Article, Laboratory, StockMovement } from '../../types';

interface MovementFormProps {
  articles: Article[];
  laboratories: Laboratory[];
  userId: string;
  onSubmit: (movement: Partial<StockMovement>) => void;
  onCancel: () => void;
}

const MovementForm: React.FC<MovementFormProps> = ({
  articles,
  laboratories,
  userId,
  onSubmit,
  onCancel
}) => {
  const [formData, setFormData] = useState({
    articleId: '',
    laboratoryId: '',
    type: 'in' as 'in' | 'out',
    quantity: 0,
    reason: '',
    reference: '',
    notes: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      userId
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {debugger;
    const { name, value } = e.target;debugger;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'quantity' ? Number(value) : value
    }));
  };

  const filteredArticles = articles.filter(article =>
    !formData.laboratoryId || article.laboratoryId === Number(formData.laboratoryId)
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-bold text-gray-800">Nouveau Mouvement de Stock</h2>
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
                Type de mouvement *
              </label>
              <select
                name="type"
                value={formData.type}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="in">Entrée en stock</option>
                <option value="out">Sortie de stock</option>
              </select>
            </div>

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
                Quantité *
              </label>
              <input
                type="number"
                name="quantity"
                value={formData.quantity}
                onChange={handleChange}
                min="1"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Raison *
              </label>
              <select
                name="reason"
                value={formData.reason}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Sélectionner une raison</option>
                {formData.type === 'in' ? (
                  <>
                    <option value="Réapprovisionnement">Réapprovisionnement</option>
                    <option value="Achat">Achat</option>
                    <option value="Retour">Retour</option>
                    <option value="Don">Don</option>
                    <option value="Correction inventaire">Correction inventaire</option>
                  </>
                ) : (
                  <>
                    <option value="Utilisation TP">Utilisation TP</option>
                    <option value="Prêt">Prêt</option>
                    <option value="Casse">Casse</option>
                    <option value="Perte">Perte</option>
                    <option value="Transfert">Transfert</option>
                  </>
                )}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Référence (bon de commande, etc.)
              </label>
              <input
                type="text"
                name="reference"
                value={formData.reference}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notes
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
              Créer le mouvement
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MovementForm;