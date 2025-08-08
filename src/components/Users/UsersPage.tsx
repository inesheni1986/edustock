import React, {useState, useEffect} from 'react';
import {Plus, Edit, Trash2, Shield, User, UserCheck, Search, Filter} from 'lucide-react';
import {User as UserType, Laboratory, Lycee, SupplyRequest} from '../../types';
import {usersAPI, laboratoriesAPI, lyceesAPI} from '../../services/api';
import {useAuth} from '../../contexts/AuthContext';
import UserForm from './UserForm';

const UsersPage: React.FC = () => {
    const {user} = useAuth();
    const [users, setUsers] = useState<UserType[]>([]);
    const [laboratories, setLaboratories] = useState<Laboratory[]>([]);
    const [lycees, setLycees] = useState<Lycee[]>([]);
    const [showForm, setShowForm] = useState(false);
    const [editingUser, setEditingUser] = useState<UserType | null>(null);
    const [selectedRole, setSelectedRole] = useState<string>('all');
    const [filteredUsers, setFilteredUsers] = useState<UserType[]>([]);
    const [selectedLycee, setSelectedLycee] = useState<string>('');
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

            const [usersData, laboratoriesData, lyceesData] = await Promise.all([
                usersAPI.getAll(),
                laboratoriesAPI.getAll(),
                lyceesAPI.getAll()
                //suppliersAPI.getAll()
            ]);

            setUsers(usersData);
            setLaboratories(laboratoriesData);
            setLycees(lyceesData);
            //setFilteredArticles(articlesData);
        } catch (err) {
            console.error('Erreur lors du chargement des données:', err);
            setError('Erreur lors du chargement des données');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        debugger;
        let filtered = users;

        if (searchTerm) {
            filtered = filtered.filter(u =>
                (u.firstName && u.firstName.toLowerCase().includes(searchTerm.toLowerCase())) ||
                (u.lastName && u.lastName.toLowerCase().includes(searchTerm.toLowerCase()))
            );
        }

        if (selectedRole !== 'all') {
            filtered = filtered.filter(user => user.role === selectedRole);
        }

        if (selectedLycee) {
            filtered = filtered.filter(u => u.lyceeId === Number(selectedLycee));
        }

        if (selectedLaboratory) {
            filtered = filtered.filter(u => u.laboratoryIds.includes(Number(selectedLaboratory)) );
        }

        setFilteredUsers(filtered);
    }, [users, searchTerm, selectedRole, selectedLycee, selectedLaboratory]);

    const getLyceeName = (lyceeId: string | undefined) => {
        if (!lyceeId) return 'Aucun lycée';
        const lycee = lycees.find(l => l.id === lyceeId);
        return lycee ? lycee.name : 'Lycée inconnu';
    };

    const getLaboratoryNames = (laboratoryIds: string[]) => {
        return laboratoryIds.map(id => {
            const lab = laboratories.find(l => l.id === id);
            return lab ? lab.name : 'Laboratoire inconnu';
        }).join(', ');
    };

    const getRoleIcon = (role: string) => {
        switch (role) {
            case 'admin':
                return <Shield className="text-red-600" size={16}/>;
            case 'professor':
                return <User className="text-blue-600" size={16}/>;
            case 'auditor':
                return <UserCheck className="text-green-600" size={16}/>;
            default:
                return <User className="text-gray-600" size={16}/>;
        }
    };

    const getRoleLabel = (role: string) => {
        switch (role) {
            case 'admin':
                return 'Administrateur';
            case 'professor':
                return 'Professeur';
            case 'auditor':
                return 'Auditeur';
            default:
                return role;
        }
    };

    const getRoleColor = (role: string) => {
        switch (role) {
            case 'admin':
                return 'bg-red-100 text-red-800';
            case 'professor':
                return 'bg-blue-100 text-blue-800';
            case 'auditor':
                return 'bg-green-100 text-green-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const handleDeleteUser = async (userId: string) => {
        debugger;
        if (window.confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ?')) {
            try {
                await usersAPI.delete(userId);
                setUsers(users.filter(a => a.id !== userId));
            } catch (error) {
                console.error('Erreur lors de la suppression:', error);
                alert('Erreur lors de la suppression de l\'utilisateur');
            }
        }
    };

    const handleSubmit = async (userData: Partial<UserType>) => {
        try {
            if (editingUser) {
                const updatedUser = await usersAPI.update(editingUser.id, userData);
                setUsers(users.map(a => a.id === editingUser.id ? updatedUser : a));
            } else {
                const newUser = await usersAPI.create(userData);
                setUsers([...users, newUser]);
            }

            setShowForm(false);
        } catch (error) {
            console.error('Erreur lors de la création de l\'utilisateur:', error);
            alert('Erreur lors de la création de l\'utilisateur');
        }
    };

    const userCounts = {
        all: users.length,
        admin: users.filter(u => u.role === 'admin').length,
        professor: users.filter(u => u.role === 'professor').length,
        auditor: users.filter(u => u.role === 'auditor').length,
    };

    if (user?.role !== 'admin') {
        return (
            <div className="p-6">
                <div className="text-center py-12">
                    <Shield className="mx-auto text-gray-400 mb-4" size={48}/>
                    <p className="text-gray-500">Accès réservé aux administrateurs</p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Gestion des Utilisateurs</h1>
                    <p className="text-gray-600">Gérez les utilisateurs et leurs permissions</p>
                </div>
                <button
                    onClick={() => setShowForm(true)}
                    className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                    <Plus size={20}/>
                    <span>Nouvel Utilisateur</span>
                </button>
            </div>

            {/* Statistiques */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {[
                    {key: 'all', label: 'Total Utilisateurs', color: 'bg-gray-50'},
                    {key: 'admin', label: 'Administrateurs', color: 'bg-yellow-50'},
                    {key: 'professor', label: 'Professeurs', color: 'bg-blue-50'},
                    {key: 'auditor', label: 'Auditeurs', color: 'bg-purple-50'}
                ].map(role => (
                    <button
                        key={role.key}
                        onClick={() => setSelectedRole(role.key)}
                        className={`p-4 rounded-lg border-2 transition-all ${
                            selectedRole === role.key
                                ? 'border-blue-500 bg-blue-50'
                                : 'border-gray-200 hover:border-gray-300'
                        } ${role.color}`}
                    >
                        <div className="flex items-center justify-between">

                            <div>
                                <p className="text-sm text-gray-600">{role.label}</p>
                                <p className="text-2xl font-bold text-gray-800">
                                    {role.key === 'all' ? users.length : users.filter(u => u.role === role.key).length}
                                </p>
                            </div>
                            {(role.key === 'all' || role.key === 'professor') && (
                                <User className="text-blue-600" size={24}/>
                            )}
                            {role.key === 'admin' && (
                                <Shield className="text-red-600" size={24}/>
                            )}
                            {role.key === 'auditor' && (
                                <UserCheck className="text-green-600" size={24}/>
                            )}
                        </div>
                    </button>
                ))}
            </div>

            {/* Filtres */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
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
                    {/*<select
                        value={selectedRole}
                        onChange={(e) => setSelectedRole(e.target.value)}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="all">Toutes les utilisateurs</option>
                        <option value="admin">Administrateurs</option>
                        <option value="professor">Professeurs</option>
                        <option value="auditor">Auditors</option>
                    </select>*/}

                    {/*  */}

                    <div className="flex items-center space-x-2">
                        <Filter className="text-gray-400" size={20}/>
                        <span className="text-sm text-gray-600">
              {filteredUsers.length} demande{filteredUsers.length > 1 ? 's' : ''}
            </span>
                    </div>
                </div>
            </div>
            {/* Liste des utilisateurs */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Utilisateur
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Rôle
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Établissement
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Laboratoires
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Créé le
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Actions
                            </th>
                        </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                        {filteredUsers.map((user) => (
                            <tr key={user.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center">
                                        <div
                                            className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-blue-600 font-medium text-sm">
                          {user.firstName[0]}{user.lastName[0]}
                        </span>
                                        </div>
                                        <div className="ml-4">
                                            <div className="text-sm font-medium text-gray-900">
                                                {user.firstName} {user.lastName}
                                            </div>
                                            <div className="text-sm text-gray-500">{user.email}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                    <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleColor(user.role)}`}>
                      {getRoleIcon(user.role)}
                        <span className="ml-1">{getRoleLabel(user.role)}</span>
                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                    {getLyceeName(user.lyceeId)}
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-900">
                                    {user.laboratoryIds && user.laboratoryIds.length > 0 ? (
                                        <div className="max-w-xs truncate"
                                             title={getLaboratoryNames(user.laboratoryIds)}>
                                            {getLaboratoryNames(user.laboratoryIds)}
                                        </div>
                                    ) : (
                                        <span className="text-gray-500">Aucun laboratoire</span>
                                    )}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {new Date(user.createdAt).toLocaleDateString('fr-FR')}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <button
                                        onClick={() => {
                                            setEditingUser(user);
                                            setShowForm(true);
                                        }}
                                        className="text-blue-600 hover:text-blue-900 mr-4"
                                    >
                                        <Edit size={16}/>
                                    </button>
                                    <button
                                        onClick={() => handleDeleteUser(user.id)}
                                        className="text-red-600 hover:text-red-900"
                                    >
                                        <Trash2 size={16}/>
                                    </button>
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Formulaire d'utilisateur */}
            {showForm && (
                <UserForm
                    user={editingUser}
                    laboratories={laboratories}
                    lycees={lycees}
                    onSubmit={handleSubmit}
                    onCancel={() => {
                        setShowForm(false);
                        setEditingUser(null);
                    }}
                />
            )}
        </div>
    );
};

export default UsersPage;