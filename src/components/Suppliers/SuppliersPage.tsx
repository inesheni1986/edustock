import React, {useState, useEffect} from 'react';
import {Plus, Edit, Trash2, Phone, Mail, MapPin, Download, Search, Filter} from 'lucide-react';
import {Supplier, Article, Lycee} from '../../types';
import {getSuppliers, getArticles, createSupplier} from '../../services/mockData';
import SupplierForm from './SupplierForm';
import {articlesAPI, laboratoriesAPI, lyceesAPI, suppliersAPI} from "../../services/api.ts";

const SuppliersPage: React.FC = () => {
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [articles, setArticles] = useState<Article[]>([]);
    const [showForm, setShowForm] = useState(false);
    const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filteredSuppliers, setFilteredSuppliers] = useState<Supplier[]>([]);
    const [filteredArticles, setFilteredArticles] = useState<Article[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            setError(null);
            const [supplierData] = await Promise.all([
                suppliersAPI.getAll()
            ]);
            setSuppliers(supplierData);
            const [articleData] = await Promise.all([
                articlesAPI.getAll()
            ]);
            setArticles(articleData);

            /*if (searchTerm) {
                filtered = filtered.filter(supplier =>
                    (supplier.name && supplier.name.toLowerCase().includes(searchTerm.toLowerCase()))
                );
            }
            const filteredArticles = articleData.filter(article =>
                filtered.some(supplier => supplier.id === article.supplierId)
            );

            setFilteredSuppliers(filtered);
            setFilteredArticles(filteredArticles);*/
            //setFilteredArticles(articlesData);
        } catch (err) {
            console.error('Erreur lors du chargement des données:', err);
            //  setError('Erreur lors du chargement des données');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        debugger;
        let filtered = suppliers;
        setArticles(articles);

        if (searchTerm) {
            filtered = filtered.filter(supplier =>
                (supplier.name && supplier.name.toLowerCase().includes(searchTerm.toLowerCase()))
            );
        }
        const filteredArticles = articles.filter(article =>
            filtered.some(supplier => supplier.id === article.supplierId)
        );

        setFilteredSuppliers(filtered);
        setFilteredArticles(filteredArticles);
    }, [suppliers, articles, searchTerm]);

    const getSupplierStats = (supplierId: string) => {
        const supplierArticles = filteredArticles.filter(article => article.supplierId === supplierId);
        const totalValue = supplierArticles.reduce((sum, article) => sum + (article.currentStock * article.unitPrice), 0);
        return {
            articleCount: supplierArticles.length,
            totalValue
        };
    };

    const handleSubmit = async (supplierData: Partial<Supplier>) => {
        try {
            if (editingSupplier) {debugger;
                const updatedSupplier = await suppliersAPI.update(editingSupplier.id, supplierData);
                if (updatedSupplier) {
                    setSuppliers(suppliers.map(s => s.id === editingSupplier.id ? updatedSupplier : s));
                }
            } else {
                const newLycee = await suppliersAPI.create(supplierData as Omit<Lycee, 'id' | 'createdAt' | 'updatedAt'>);
                setSuppliers([...suppliers, newLycee]);
            }

            setShowForm(false);
            setEditingSupplier(null);


        } catch (error) {
            console.error('Erreur lors de la création du fournisseur:', error);
            alert('Erreur lors de la création du fournisseur');
        }
    };

    const handleDeleteSupplier = async (supplierId: string) => {
        if (window.confirm('Êtes-vous sûr de vouloir supprimer ce fournisseur')) {
            try {
                await suppliersAPI.delete(supplierId);
                setSuppliers(suppliers.filter(s => s.id !== supplierId));
            } catch (error) {
                console.error('Erreur lors de la suppression:', error);
                alert('Erreur lors de la suppression du fournisseur');
            }
        }
    };

    /*const handleDeleteSupplier = (supplierId: string) => {
      if (window.confirm('Êtes-vous sûr de vouloir supprimer ce fournisseur ?')) {
        const success = deleteSupplier(supplierId);
        if (success) {
          setSuppliers(suppliers.filter(s => s.id !== supplierId));
        }
      }
    };*/

    const exportToCSV = () => {
        const csvContent = [
            ['Nom', 'Contact', 'Email', 'Téléphone', 'Ville', 'SIRET', 'Articles', 'Valeur Stock'].join(','),
            ...suppliers.map(supplier => {
                const stats = getSupplierStats(supplier.id);
                return [
                    supplier.name,
                    supplier.contactName,
                    supplier.email,
                    supplier.phone,
                    supplier.city,
                    supplier.siret || '',
                    stats.articleCount,
                    stats.totalValue.toFixed(2)
                ].join(',');
            })
        ].join('\n');

        const blob = new Blob([csvContent], {type: 'text/csv;charset=utf-8;'});
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `fournisseurs-${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
    };

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Gestion des Fournisseurs</h1>
                    <p className="text-gray-600">Gérez vos fournisseurs et leurs informations</p>
                </div>
                <div className="flex space-x-3">
                    <button
                        onClick={exportToCSV}
                        className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                        <Download size={20}/>
                        <span>Exporter CSV</span>
                    </button>
                    <button
                        onClick={() => setShowForm(true)}
                        className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        <Plus size={20}/>
                        <span>Nouveau Fournisseur</span>
                    </button>
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
              {filteredSuppliers.length} fournisseurs {filteredSuppliers.length > 1 ? 's' : ''}
            </span>
                    </div>
                </div>
            </div>

            {/* Grille des fournisseurs */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredSuppliers.map((supplier) => {
                    const stats = getSupplierStats(supplier.id);
                    return (
                        <div key={supplier.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-800">{supplier.name}</h3>
                                    <p className="text-sm text-gray-600">{supplier.contactName}</p>
                                </div>
                                <div className="flex space-x-2">
                                    <button
                                        onClick={() => {
                                            setEditingSupplier(supplier);
                                            setShowForm(true);
                                        }}
                                        className="text-blue-600 hover:text-blue-800"
                                    >
                                        <Edit size={16}/>
                                    </button>
                                    <button
                                         onClick={() => handleDeleteSupplier(supplier.id)}
                                        className="text-red-600 hover:text-red-800"
                                    >
                                        <Trash2 size={16}/>
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-2 mb-4">
                                <div className="flex items-center space-x-2 text-sm text-gray-600">
                                    <Mail size={14}/>
                                    <span>{supplier.email}</span>
                                </div>
                                <div className="flex items-center space-x-2 text-sm text-gray-600">
                                    <Phone size={14}/>
                                    <span>{supplier.phone}</span>
                                </div>
                                <div className="flex items-center space-x-2 text-sm text-gray-600">
                                    <MapPin size={14}/>
                                    <span>{supplier.city}, {supplier.postalCode}</span>
                                </div>
                            </div>

                            <div className="border-t pt-4">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-sm text-gray-600">Articles fournis</span>
                                    <span className="font-medium text-gray-800">{stats.articleCount}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-gray-600">Valeur stock</span>
                                    <span className="font-medium text-gray-800">{stats.totalValue.toFixed(2)} €</span>
                                </div>
                            </div>

                            {supplier.website && (
                                <div className="mt-4 pt-4 border-t">
                                    <a
                                        href={supplier.website}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-blue-600 hover:text-blue-800 text-sm"
                                    >
                                        Visiter le site web →
                                    </a>
                                </div>
                            )}

                            {supplier.notes && (
                                <div className="mt-4 pt-4 border-t">
                                    <p className="text-sm text-gray-600">{supplier.notes}</p>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {filteredSuppliers.length === 0 && (
                <div className="text-center py-12">
                    <div className="bg-gray-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                        <Plus className="text-gray-400" size={24}/>
                    </div>
                    <p className="text-gray-500">Aucun fournisseur enregistré</p>
                    <button
                        onClick={() => setShowForm(true)}
                        className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        Ajouter le premier fournisseur
                    </button>
                </div>
            )}

            {/* Formulaire de fournisseur */}
            {showForm && (
                <SupplierForm
                    supplier={editingSupplier}
                    onSubmit={handleSubmit}
                    onCancel={() => {
                        setShowForm(false);
                        setEditingSupplier(null);
                    }}
                />
            )}
        </div>
    );
};

export default SuppliersPage;