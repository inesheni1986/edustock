import React, { useState, useEffect } from 'react';
import { Plus, Calendar, CheckCircle, Clock, XCircle } from 'lucide-react';
import { Audit, Laboratory, User } from '../../types';
import { auditsAPI, laboratoriesAPI, usersAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import AuditForm from './AuditForm';

const AuditsPage: React.FC = () => {
  const { user } = useAuth();
  const [audits, setAudits] = useState<Audit[]>([]);
  const [laboratories, setLaboratories] = useState<Laboratory[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [auditsData, laboratoriesData, usersData] = await Promise.all([
        auditsAPI.getAll(),
        laboratoriesAPI.getAll(),
        usersAPI.getAll()
      ]);

      setAudits(auditsData.sort((a, b) => new Date(b.scheduledDate).getTime() - new Date(a.scheduledDate).getTime()));
      setLaboratories(laboratoriesData);
      setUsers(usersData);
    } catch (err) {
      console.error('Erreur lors du chargement des données:', err);
      setError('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };
  const getLaboratoryName = (labId: string) => {
    const lab = laboratories.find(l => l.id === labId);
    return lab ? lab.name : 'Laboratoire inconnu';
  };

  const getUserName = (userId: string) => {debugger;
    const foundUser = users.find(u => u.id === userId);
    return foundUser ? `${foundUser.firstName} ${foundUser.lastName}` : 'Utilisateur inconnu';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'planned': return 'bg-blue-100 text-blue-800';
      case 'in_progress': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'planned': return <Calendar size={16} />;
      case 'in_progress': return <Clock size={16} />;
      case 'completed': return <CheckCircle size={16} />;
      case 'cancelled': return <XCircle size={16} />;
      default: return <Calendar size={16} />;
    }
  };

  const getAuditTypeLabel = (type: string) => {
    switch (type) {
      case 'inventory': return 'Inventaire';
      case 'quality': return 'Qualité';
      case 'compliance': return 'Conformité';
      default: return type;
    }
  };

  const handleSubmit = async (auditData: Partial<Audit>) => {
    try {
      const newAudit = await auditsAPI.create(auditData);
      setAudits([newAudit, ...audits]);
      setShowForm(false);
    } catch (error) {
      console.error('Erreur lors de la création de l\'audit:', error);
      alert('Erreur lors de la création de l\'audit');
    }
  };

  const handleStatusChange = async (auditId: string, newStatus: string) => {
    try {
      await auditsAPI.updateStatus(auditId, newStatus);
      setAudits(audits.map(audit =>
        audit.id === auditId
          ? { ...audit, status: newStatus as any, completedDate: newStatus === 'completed' ? new Date() : audit.completedDate }
          : audit
      ));
    } catch (error) {
      console.error('Erreur lors du changement de statut:', error);
      alert('Erreur lors du changement de statut');
    }
  };

  const handleDeleteAudit = async (auditId: string) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cet audit ?')) {
      try {
        await auditsAPI.delete(auditId);
        setAudits(audits.filter(audit => audit.id !== auditId));
      } catch (error) {
        console.error('Erreur lors de la suppression:', error);
        alert('Erreur lors de la suppression de l\'audit');
      }
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement des audits...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <div className="bg-red-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
            <XCircle className="text-red-600" size={24} />
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
          <h1 className="text-2xl font-bold text-gray-800">Audits et Inventaires</h1>
          <p className="text-gray-600">Planifiez et suivez vos audits de stock</p>
        </div>
        {user?.role === 'admin' && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus size={20} />
            <span>Nouvel Audit</span>
          </button>
        )}
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: 'Planifiés', count: audits.filter(a => a.status === 'planned').length, color: 'bg-blue-50 text-blue-600' },
          { label: 'En cours', count: audits.filter(a => a.status === 'in_progress').length, color: 'bg-yellow-50 text-yellow-600' },
          { label: 'Terminés', count: audits.filter(a => a.status === 'completed').length, color: 'bg-green-50 text-green-600' },
          { label: 'Annulés', count: audits.filter(a => a.status === 'cancelled').length, color: 'bg-red-50 text-red-600' }
        ].map((stat, index) => (
          <div key={index} className={`p-6 rounded-xl border ${stat.color}`}>
            <div className="text-2xl font-bold">{stat.count}</div>
            <div className="text-sm">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Liste des audits */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="space-y-0">
          {audits.map((audit) => (
            <div key={audit.id} className="p-6 border-b border-gray-200 last:border-b-0">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="font-medium text-gray-800">
                      {getAuditTypeLabel(audit.auditType)} - {getLaboratoryName(audit.laboratoryId)}
                    </h3>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(audit.status)}`}>
                      {getStatusIcon(audit.status)}
                      <span className="ml-1">
                        {audit.status === 'planned' ? 'Planifié' :
                         audit.status === 'in_progress' ? 'En cours' :
                         audit.status === 'completed' ? 'Terminé' :
                         audit.status === 'cancelled' ? 'Annulé' : audit.status}
                      </span>
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-gray-600">
                    <div>
                      <span className="font-medium">Date prévue:</span> {new Date(audit.scheduledDate).toLocaleDateString('fr-FR')}
                    </div>
                    <div>
                      <span className="font-medium">Auditeur:</span> {getUserName(audit.auditedBy)}
                    </div>
                    {audit.completedDate && (
                      <div>
                        <span className="font-medium">Terminé le:</span> {new Date(audit.completedDate).toLocaleDateString('fr-FR')}
                      </div>
                    )}
                    <div>
                      <span className="font-medium">Écarts:</span> {audit.findings.length}
                    </div>
                  </div>

                  {audit.notes && (
                    <div className="mt-2 text-sm text-gray-600">
                      <span className="font-medium">Notes:</span> {audit.notes}
                    </div>
                  )}

                  {audit.findings.length > 0 && (
                    <div className="mt-3">
                      <details className="cursor-pointer">
                        <summary className="text-sm font-medium text-gray-700 hover:text-gray-900">
                          Voir les écarts ({audit.findings.length})
                        </summary>
                        <div className="mt-2 space-y-2">
                          {audit.findings.map((finding, index) => (
                            <div key={finding.id} className="p-3 bg-gray-50 rounded-lg text-sm">
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                                <div>
                                  <span className="font-medium">Attendu:</span> {finding.expectedQuantity}
                                </div>
                                <div>
                                  <span className="font-medium">Réel:</span> {finding.actualQuantity}
                                </div>
                                <div>
                                  <span className="font-medium">Écart:</span>
                                  <span className={finding.discrepancy > 0 ? 'text-green-600' : 'text-red-600'}>
                                    {finding.discrepancy > 0 ? '+' : ''}{finding.discrepancy}
                                  </span>
                                </div>
                              </div>
                              {finding.reason && (
                                <div className="mt-1">
                                  <span className="font-medium">Raison:</span> {finding.reason}
                                </div>
                              )}
                              {finding.action && (
                                <div className="mt-1">
                                  <span className="font-medium">Action:</span> {finding.action}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </details>
                    </div>
                  )}
                </div>

                <div className="flex space-x-2">

                  {audit.status === 'planned' && (user?.role === 'auditor' || user?.role === 'admin') && (
                    <button onClick={() => handleStatusChange(audit.id, 'in_progress')}
                            className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700">
                      Commencer
                    </button>
                  )}

                  {audit.status === 'in_progress' && (user?.role === 'auditor' || user?.role === 'admin') && (
                    <button onClick={() => handleStatusChange(audit.id, 'completed')}
                            className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700">
                      Terminer
                    </button>
                  )}

                  {audit.status === 'planned' && (user?.role === 'auditor' || user?.role === 'admin') && (
                    <button onClick={() => handleDeleteAudit(audit.id)} className="px-3 py-1 bg-gray-600 text-white rounded text-sm hover:bg-gray-700">
                      Supprimer
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {audits.length === 0 && (
          <div className="text-center py-12">
            <div className="bg-gray-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <Calendar className="text-gray-400" size={24} />
            </div>
            <p className="text-gray-500">Aucun audit planifié</p>
          </div>
        )}
      </div>

      {/* Formulaire d'audit */}
      {showForm && (
        <AuditForm
          laboratories={laboratories}
          users={users}
          onSubmit={handleSubmit}
          onCancel={() => setShowForm(false)}
        />
      )}
    </div>
  );
};

export default AuditsPage;