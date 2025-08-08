import React, {useState, useEffect} from 'react';
import {Plus, Edit, Trash2, Building, MapPin, Phone, Mail, Search, Filter} from 'lucide-react';
import {Lycee, Laboratory} from '../../types';
import {laboratoriesAPI, lyceesAPI} from '../../services/api';
import {useAuth} from '../../contexts/AuthContext';
import LyceeForm from './LyceeForm';

const LyceesPage: React.FC = () => {
    const {user} = useAuth();
    const [lycees, setLycees] = useState<Lycee[]>([]);
    const [laboratories, setLaboratories] = useState<Laboratory[]>([]);
    const [showForm, setShowForm] = useState(false);
    const [editingLycee, setEditingLycee] = useState<Lycee | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filteredLycees, setFilteredLycees] = useState<Lycee[]>([]);
    const [filteredLabs, setFilteredLaboratories] = useState<Laboratory[]>([]);


    /*useEffect(() => {
      if (user?.role === 'admin') {
        setLycees(getLycees());
        setLaboratories(getLaboratories());
      }
    }, [user]);*/

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            setError(null);

            const [lyceeData] = await Promise.all([
                lyceesAPI.getAll()
            ]);
            const [laboratoriesData] = await Promise.all([
                laboratoriesAPI.getAll()
            ]);

            setLycees(lyceeData);
            setLaboratories(laboratoriesData);
            //setFilteredArticles(articlesData);
        } catch (err) {
            console.error('Erreur lors du chargement des données:', err);
            setError('Erreur lors du chargement des données');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        let filtered = lycees;

        if (searchTerm) {
            filtered = filtered.filter(lycee =>
                (lycee.name && lycee.name.toLowerCase().includes(searchTerm.toLowerCase()))
            );
        }
        const filteredLabs = laboratories.filter(lab =>
            filtered.some(lycee => lycee.id === lab.lyceeId)
        );
        setFilteredLaboratories(filteredLabs);
        setFilteredLycees(filtered);
    }, [lycees, laboratories, searchTerm]);

    const getLycee = (lyceeId: string) => {
        return lycees.find(l => l.id === lyceeId);
    };

    const getLaboratoryCount = (lyceeId: string) => {
        return laboratories.filter(lab => lab.lyceeId === lyceeId).length;
    };

    const getLaboratoryNames = (lyceeId: string) => {
        return laboratories
            .filter(lab => lab.lyceeId === lyceeId)
            .map(lab => lab.name)
            .join(', ');
    };

    const handleDeleteLycee = async (lyceeId: string) => {
        if (window.confirm('Êtes-vous sûr de vouloir supprimer cet établissement ? Tous les laboratoires associés seront également supprimés.')) {
            try {
                await lyceesAPI.delete(lyceeId);
                setLycees(lycees.filter(a => a.id !== lyceeId));
            } catch (error) {
                console.error('Erreur lors de la suppression:', error);
                alert('Erreur lors de la suppression de lycée');
            }
        }
    };

    const handleSubmit = async (lyceeData: Partial<Lycee>) => {
        try {
            if (editingLycee) {
                const updatedLycee = await lyceesAPI.update(editingLycee.id, lyceeData);
                if (updatedLycee) {
                    setLycees(lycees.map(l => l.id === editingLycee.id ? updatedLycee : l));
                }
            } else {
                const newLycee = await lyceesAPI.create(lyceeData as Omit<Lycee, 'id' | 'createdAt' | 'updatedAt'>);
                setLycees([...lycees, newLycee]);
            }

            setShowForm(false);
            setEditingLycee(null);


        } catch (error) {
            console.error('Erreur lors de la création de l\'utilisateur:', error);
            alert('Erreur lors de la création de l\'utilisateur');
        }
    };

    if (user?.role !== 'admin') {
        return (
            <div className="p-6">
                <div className="text-center py-12">
                    <Building className="mx-auto text-gray-400 mb-4" size={48}/>
                    <p className="text-gray-500">Accès réservé aux administrateurs</p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Gestion des Établissements</h1>
                    <p className="text-gray-600">Gérez les lycées et leurs laboratoires</p>
                </div>
                <button
                    onClick={() => setShowForm(true)}
                    className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                    <Plus size={20}/>
                    <span>Nouvel Établissement</span>
                </button>
            </div>

            {/* Statistiques */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">Total Établissements</p>
                            <p className="text-2xl font-bold text-gray-800">{filteredLycees.length}</p>
                        </div>
                        <Building className="text-blue-600" size={24}/>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">Total Laboratoires</p>
                            <p className="text-2xl font-bold text-gray-800">{filteredLabs.length}</p>
                        </div>
                        <Building className="text-green-600" size={24}/>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">Moyenne Lab/Lycée</p>
                            <p className="text-2xl font-bold text-gray-800">
                                {filteredLycees.length > 0 ? (filteredLabs.length / filteredLycees.length).toFixed(1) : 0}
                            </p>
                        </div>
                        <Building className="text-purple-600" size={24}/>
                    </div>
                </div>
            </div>

            {/* Filtres */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20}/>
                        <input
                            type="text"
                            placeholder="Rechercher..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    <div className="flex items-center space-x-2">
                        <Filter className="text-gray-400" size={20}/>
                        <span className="text-sm text-gray-600">
              {filteredLycees.length} demande{filteredLycees.length > 1 ? 's' : ''}
            </span>
                    </div>
                </div>
            </div>

            {/* Grille des lycées */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredLycees.map((lycee) => (
                    <div key={lycee.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h3 className="text-lg font-semibold text-gray-800">{lycee.name}</h3>
                                <p className="text-sm text-gray-600">{getLaboratoryCount(lycee.id)} laboratoire(s)</p>
                            </div>
                            <div className="flex space-x-2">
                                <button
                                    onClick={() => {
                                        setEditingLycee(lycee);
                                        setShowForm(true);
                                    }}
                                    className="text-blue-600 hover:text-blue-800"
                                >
                                    <Edit size={16}/>
                                </button>
                                <button
                                    onClick={() => handleDeleteLycee(lycee.id)}
                                    className="text-red-600 hover:text-red-800"
                                >
                                    <Trash2 size={16}/>
                                </button>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <div className="flex items-center space-x-2 text-sm text-gray-600">
                                <MapPin size={14}/>
                                <span>{lycee.address}, {lycee.city} {lycee.postalCode}</span>
                            </div>
                            <div className="flex items-center space-x-2 text-sm text-gray-600">
                                <Phone size={14}/>
                                <span>{lycee.phone}</span>
                            </div>
                            <div className="flex items-center space-x-2 text-sm text-gray-600">
                                <Mail size={14}/>
                                <span>{lycee.email}</span>
                            </div>
                        </div>

                        {getLaboratoryCount(lycee.id) > 0 && (
                            <div className="mt-4 pt-4 border-t border-gray-200">
                                <h4 className="text-sm font-medium text-gray-700 mb-2">Laboratoires</h4>
                                <div className="flex flex-wrap gap-2">
                                    {filteredLabs
                                        .filter(lab => lab.lyceeId === lycee.id)
                                        .map(lab => (
                                            <span
                                                key={lab.id}
                                                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                                            >
                        {lab.name}
                      </span>
                                        ))}
                                </div>
                            </div>
                        )}

                        <div className="mt-4 pt-4 border-t border-gray-200">
                            <p className="text-xs text-gray-500">
                                Créé le {new Date(lycee.createdAt).toLocaleDateString('fr-FR')}
                            </p>
                        </div>
                    </div>
                ))}
            </div>

            {lycees.length === 0 && (
                <div className="text-center py-12">
                    <div className="bg-gray-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                        <Building className="text-gray-400" size={24}/>
                    </div>
                    <p className="text-gray-500">Aucun établissement enregistré</p>
                    <button
                        onClick={() => setShowForm(true)}
                        className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        Ajouter le premier établissement
                    </button>
                </div>
            )}

            {/* Formulaire d'établissement */}
            {showForm && (
                <LyceeForm
                    lycee={editingLycee}
                    onSubmit={handleSubmit}
                    onCancel={() => {
                        setShowForm(false);
                        setEditingLycee(null);
                    }}
                />
            )}
        </div>
    );
};

export default LyceesPage;