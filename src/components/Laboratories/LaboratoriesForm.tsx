import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Laboratory, Lycee, User } from '../../types';

interface LaboratoryFormProps {
  laboratory?: Laboratory | null;
  lycees: Lycee[];
  users: User[];
  onSubmit: (laboratory: Partial<Laboratory>) => void;
  onCancel: () => void;
}

const LaboratoryForm: React.FC<LaboratoryFormProps> = ({
  laboratory,
  lycees,
  users,
  onSubmit,
  onCancel
}) => {
  const [formData, setFormData] = useState({
    name: '',
    lyceeId: '',
    description: '',
    responsibleUserId: ''
  });

  useEffect(() => {
    if (laboratory) {
      setFormData({
        name: laboratory.name,
        lyceeId: laboratory.lyceeId,
        description: laboratory.description || '',
        responsibleUserId: laboratory.responsibleUserId || ''
      });
    }
  }, [laboratory]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Conversion des données pour l'API
    const apiData = {
      name: formData.name,
      lycee_id: formData.lyceeId,
      description: formData.description || null,
      responsible_user_id: formData.responsibleUserId || null
    };

    onSubmit(apiData);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Filtrer les utilisateurs selon le lycée sélectionné
  const filteredUsers = users.filter(user =>
    !formData.lyceeId || user.lyceeId === Number(formData.lyceeId)
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-bold text-gray-800">
            {laboratory ? 'Modifier le laboratoire' : 'Nouveau Laboratoire'}
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
                Nom du laboratoire *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Ex: Laboratoire Électrotechnique"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Établissement *
              </label>
              <select
                name="lyceeId"
                value={formData.lyceeId}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Sélectionner un établissement</option>
                {lycees.map(lycee => (
                  <option key={lycee.id} value={lycee.id}>{lycee.name}</option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Utilisateur responsable
              </label>
              <select
                name="responsibleUserId"
                value={formData.responsibleUserId}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Aucun responsable</option>
                {filteredUsers.map(user => (
                  <option key={user.id} value={user.id}>
                    {user.firstName} {user.lastName} ({user.role})
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">
                Seuls les utilisateurs de l'établissement sélectionné sont affichés
              </p>
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
              placeholder="Description du laboratoire, équipements disponibles..."
            />
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-800 mb-2">Information</h4>
            <p className="text-sm text-blue-700">
              Après création, vous pourrez assigner des utilisateurs spécifiques à ce laboratoire
              pour leur donner accès aux articles et fonctionnalités associées.
            </p>
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
              {laboratory ? 'Modifier' : 'Créer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LaboratoryForm;