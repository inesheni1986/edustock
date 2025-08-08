import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Building, Users, Package, AlertTriangle, Search, Filter } from 'lucide-react';
import { Laboratory, Lycee, User } from '../../types';
import { laboratoriesAPI, lyceesAPI, usersAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import LaboratoryForm from './LaboratoriesForm';

const LaboratoriesPage: React.FC = () => {
  const { user } = useAuth();
  const [laboratories, setLaboratories] = useState<Laboratory[]>([]);
  const [lycees, setLycees] = useState<Lycee[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [filteredLaboratories, setFilteredLaboratories] = useState<Laboratory[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLycee, setSelectedLycee] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingLaboratory, setEditingLaboratory] = useState<Laboratory | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [laboratoriesData, lyceesData, usersData] = await Promise.all([
        laboratoriesAPI.getAll(),
        lyceesAPI.getAll(),
        usersAPI.getAll()
      ]);
debugger;
      setLaboratories(laboratoriesData);
      setLycees(lyceesData);
      setUsers(usersData);
      setFilteredLaboratories(laboratoriesData);
    } catch (err) {
      console.error('Erreur lors du chargement des données:', err);
      setError('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {debugger;
    let filtered = laboratories;

    if (searchTerm) {
      filtered = filtered.filter(lab =>
        lab.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (lab.description && lab.description.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    if (selectedLycee) {
      filtered = filtered.filter(lab => lab.lyceeId === parseInt(selectedLycee));
    }
    setFilteredLaboratories(filtered);
  }, [laboratories, searchTerm, selectedLycee]);

  const getLyceeName = (lyceeId: string) => {
    const lycee = lycees.find(l => l.id === lyceeId);
    return lycee ? lycee.name : 'Lycée inconnu';
  };

  const getResponsibleName = (userId: string | undefined) => {
    if (!userId) return 'Aucun responsable';
    const responsible = users.find(u => u.id === userId);
    return responsible ? `${responsible.firstName} ${responsible.lastName}` : 'Utilisateur inconnu';
  };

  const handleSubmit = async (laboratoryData: Partial<Laboratory>) => {
    try {
      if (editingLaboratory) {
        const updatedLaboratory = await laboratoriesAPI.update(editingLaboratory.id, laboratoryData);
        setLaboratories(laboratories.map(l => l.id === editingLaboratory.id ? updatedLaboratory : l));
      } else {
        const newLaboratory = await laboratoriesAPI.create(laboratoryData);
        setLaboratories([...laboratories, newLaboratory]);
      }

      setShowForm(false);
      setEditingLaboratory(null);
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      alert('Erreur lors de la sauvegarde du laboratoire');
    }
  };

  const handleDeleteLaboratory = async (laboratoryId: string) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce laboratoire ? Tous les articles associés seront également supprimés.')) {
      try {
        await laboratoriesAPI.delete(laboratoryId);
        setLaboratories(filteredLaboratories.filter(l => l.id !== laboratoryId));
      } catch (error: any) {
        console.error('Erreur lors de la suppression:', error);
        if (error.message.includes('article')) {
          alert('Impossible de supprimer ce laboratoire car il contient des articles');
        } else {
          alert('Erreur lors de la suppression du laboratoire');
        }
      }
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement des laboratoires...</p>
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
          <h1 className="text-2xl font-bold text-gray-800">Gestion des Laboratoires</h1>
          <p className="text-gray-600">Gérez les laboratoires et leurs équipements</p>
        </div>
        {user?.role === 'admin' && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus size={20} />
            <span>Nouveau Laboratoire</span>
          </button>
        )}
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Laboratoires</p>
              <p className="text-2xl font-bold text-gray-800">{filteredLaboratories.length}</p>
            </div>
            <Building className="text-blue-600" size={24} />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Articles</p>
              <p className="text-2xl font-bold text-gray-800">
                {filteredLaboratories.reduce((sum, lab) => sum + (lab.articleCount || 0), 0)}
              </p>
            </div>
            <Package className="text-green-600" size={24} />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Utilisateurs Assignés</p>
              <p className="text-2xl font-bold text-gray-800">
                {filteredLaboratories.reduce((sum, lab) => sum + (lab.userCount || 0), 0)}
              </p>
            </div>
            <Users className="text-purple-600" size={24} />
          </div>
        </div>

        {/*<div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Valeur Stock Totale</p>
              <p className="text-2xl font-bold text-gray-800">
                {filteredLaboratories.reduce((sum, lab) => sum + (lab.totalStockValue || 0), 0).toFixed(0)} €
              </p>
            </div>
            <Building className="text-orange-600" size={24} />
          </div>
        </div>*/}
      </div>

      {/* Filtres */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Rechercher par nom ou description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <select
            value={selectedLycee}
            onChange={(e) => setSelectedLycee(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Tous les lycées</option>
            {lycees.map(lycee => (
              <option key={lycee.id} value={lycee.id}>{lycee.name}</option>
            ))}
          </select>

          <div className="flex items-center space-x-2">
            <Filter className="text-gray-400" size={20} />
            <span className="text-sm text-gray-600">
              {filteredLaboratories.length} laboratoire{filteredLaboratories.length > 1 ? 's' : ''}
            </span>
          </div>
        </div>
      </div>

      {/* Grille des laboratoires */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredLaboratories.map((laboratory) => (
          <div key={laboratory.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-800">{laboratory.name}</h3>
                <p className="text-sm text-gray-600">{getLyceeName(laboratory.lyceeId)}</p>
              </div>
              {user?.role === 'admin' && (
                <div className="flex space-x-2">
                  <button
                    onClick={() => {
                      setEditingLaboratory(laboratory);
                      setShowForm(true);
                    }}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    <Edit size={16} />
                  </button>
                  <button
                    onClick={() => handleDeleteLaboratory(laboratory.id)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              )}
            </div>

            {laboratory.description && (
              <p className="text-sm text-gray-600 mb-4">{laboratory.description}</p>
            )}

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Responsable</span>
                <span className="text-sm font-medium text-gray-800">
                  {getResponsibleName(laboratory.responsibleUserId)}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Articles</span>
                <span className="text-sm font-medium text-gray-800">
                  {laboratory.articleCount || 0}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Utilisateurs</span>
                <span className="text-sm font-medium text-gray-800">
                  {laboratory.userCount || 0}
                </span>
              </div>

              {/*{laboratory.totalStockValue !== undefined && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Valeur stock</span>
                  <span className="text-sm font-medium text-gray-800">
                    {laboratory.totalStockValue.toFixed(2)} €
                  </span>
                </div>
              )}*/}
            </div>

            <div className="mt-4 pt-4 border-t border-gray-200">
              <p className="text-xs text-gray-500">
                Créé le {new Date(laboratory.createdAt).toLocaleDateString('fr-FR')}
              </p>
            </div>
          </div>
        ))}
      </div>

      {filteredLaboratories.length === 0 && !loading && (
        <div className="text-center py-12">
          <div className="bg-gray-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
            <Building className="text-gray-400" size={24} />
          </div>
          <p className="text-gray-500">Aucun laboratoire trouvé</p>
          {user?.role === 'admin' && (
            <button
              onClick={() => setShowForm(true)}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Créer le premier laboratoire
            </button>
          )}
        </div>
      )}

      {/* Formulaire de laboratoire */}
      {showForm && (
        <LaboratoryForm
          laboratory={editingLaboratory}
          lycees={lycees}
          users={users}
          onSubmit={handleSubmit}
          onCancel={() => {
            setShowForm(false);
            setEditingLaboratory(null);
          }}
        />
      )}
    </div>
  );
};

export default LaboratoriesPage;