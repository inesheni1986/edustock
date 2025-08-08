import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Article, Laboratory, Supplier } from '../../types';

interface ArticleFormProps {
  article?: Article | null;
  laboratories: Laboratory[];
  suppliers: Supplier[];
  onSubmit: (article: Partial<Article>) => void;
  onCancel: () => void;
}

const ArticleForm: React.FC<ArticleFormProps> = ({
  article,
  laboratories,
  suppliers,
  onSubmit,
  onCancel
}) => {
  const [formData, setFormData] = useState({
    name: '',
    reference: '',
    description: '',
    category: '',
    unit: '',
    minStock: 0,
    maxStock: 0,
    currentStock: 0,
    unitPrice: 0,
    supplierId: '',
    laboratoryId: ''
  });

  useEffect(() => {
    if (article) {
      setFormData({
        name: article.name,
        reference: article.reference,
        description: article.description || '',
        category: article.category,
        unit: article.unit,
        minStock: article.minStock,
        maxStock: article.maxStock,
        currentStock: article.currentStock,
        unitPrice: article.unitPrice,
        supplierId: article.supplierId || '',
        laboratoryId: article.laboratoryId
      });
    }
  }, [article]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation côté client
    if (formData.minStock > formData.maxStock) {
      alert('Le stock minimum ne peut pas être supérieur au stock maximum');
      return;
    }
    
    // Conversion des données pour l'API
    const apiData = {
      name: formData.name,
      reference: formData.reference,
      description: formData.description,
      category: formData.category,
      unit: formData.unit,
      min_stock: formData.minStock,
      max_stock: formData.maxStock,
      current_stock: formData.currentStock,
      unit_price: formData.unitPrice,
      supplier_id: formData.supplierId || null,
      laboratory_id: formData.laboratoryId
    };
    
    onSubmit(apiData);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name.includes('Stock') || name === 'unitPrice' ? Number(value) : value
    }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-bold text-gray-800">
            {article ? 'Modifier l\'article' : 'Nouvel Article'}
          </h2>
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
                Nom de l'article *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Référence *
              </label>
              <input
                type="text"
                name="reference"
                value={formData.reference}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Catégorie *
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Sélectionner une catégorie</option>
                <option value="Composants passifs">Composants passifs</option>
                <option value="Composants actifs">Composants actifs</option>
                <option value="Instruments de mesure">Instruments de mesure</option>
                <option value="Outillage">Outillage</option>
                <option value="Câbles et connecteurs">Câbles et connecteurs</option>
                <option value="Alimentation">Alimentation</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Unité *
              </label>
              <select
                name="unit"
                value={formData.unit}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Sélectionner une unité</option>
                <option value="pièce">pièce</option>
                <option value="mètre">mètre</option>
                <option value="kilogramme">kilogramme</option>
                <option value="litre">litre</option>
                <option value="boîte">boîte</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Stock minimum *
              </label>
              <input
                type="number"
                name="minStock"
                value={formData.minStock}
                onChange={handleChange}
                min="0"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Stock maximum *
              </label>
              <input
                type="number"
                name="maxStock"
                value={formData.maxStock}
                onChange={handleChange}
                min="0"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Stock actuel *
              </label>
              <input
                type="number"
                name="currentStock"
                value={formData.currentStock}
                onChange={handleChange}
                min="0"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Prix unitaire (€) *
              </label>
              <input
                type="number"
                name="unitPrice"
                value={formData.unitPrice}
                onChange={handleChange}
                min="0"
                step="0.01"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
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
                Fournisseur
              </label>
              <select
                name="supplierId"
                value={formData.supplierId}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Aucun fournisseur</option>
                {suppliers.map(supplier => (
                  <option key={supplier.id} value={supplier.id}>{supplier.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
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
              {article ? 'Modifier' : 'Créer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ArticleForm;