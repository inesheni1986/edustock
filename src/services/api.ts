const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// Configuration des headers par défaut
const getHeaders = () => {
  const token = localStorage.getItem('authToken');
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` })
  };
};

// Fonction utilitaire pour les requêtes
const apiRequest = async (endpoint: string, options: RequestInit = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;debugger;
  const config = {
    headers: getHeaders(),
    ...options
  };

  const response = await fetch(url, config);
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Erreur réseau' }));
    throw new Error(error.error || `Erreur HTTP: ${response.status}`);
  }

  if (response.status === 204) {
    // Pas de contenu, retourner null ou autre valeur
    return null;
  }

  return response.json();
};

// API d'authentification
export const authAPI = {
  login: async (email: string, password: string) => {
    const response = await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    
    if (response.token) {
      localStorage.setItem('authToken', response.token);
    }
    
    return response;
  },

  verify: async () => {
    return apiRequest('/auth/verify');
  },

  logout: () => {
    localStorage.removeItem('authToken');
  }
};

// API des utilisateurs
export const usersAPI = {
  getAll: () => apiRequest('/users'),
  getById: (id: string) => apiRequest(`/users/${id}`),
  create: (userData: any) => apiRequest('/users', {
    method: 'POST',
    body: JSON.stringify(userData)
  }),
  update: (id: string, userData: any) => apiRequest(`/users/${id}`, {
    method: 'PUT',
    body: JSON.stringify(userData)
  }),
  delete: (id: string) => apiRequest(`/users/${id}`, { method: 'DELETE' }),
  toggleActive: (id: string) => apiRequest(`/users/${id}/toggle-active`, {
    method: 'PATCH'
  })
};

// API des lycées
export const lyceesAPI = {
  getAll: () => apiRequest('/lycees'),
  getById: (id: string) => apiRequest(`/lycees/${id}`),
  create: (lyceeData: any) => apiRequest('/lycees', {
    method: 'POST',
    body: JSON.stringify(lyceeData)
  }),
  update: (id: string, lyceeData: any) => apiRequest(`/lycees/${id}`, {
    method: 'PUT',
    body: JSON.stringify(lyceeData)
  }),
  delete: (id: string) => apiRequest(`/lycees/${id}`, { method: 'DELETE' }),
  getLaboratories: (id: string) => apiRequest(`/lycees/${id}/laboratories`)
};

// API des laboratoires
export const laboratoriesAPI = {
  getAll: () => apiRequest('/laboratories'),
  getById: (id: string) => apiRequest(`/laboratories/${id}`),
  create: (labData: any) => apiRequest('/laboratories', {
    method: 'POST',
    body: JSON.stringify(labData)
  }),
  update: (id: string, labData: any) => apiRequest(`/laboratories/${id}`, {
    method: 'PUT',
    body: JSON.stringify(labData)
  }),
  delete: (id: string) => apiRequest(`/laboratories/${id}`, { method: 'DELETE' }),
  getArticles: (id: string) => apiRequest(`/laboratories/${id}/articles`)
};

// API des fournisseurs
export const suppliersAPI = {
  getAll: () => apiRequest('/suppliers'),
  getById: (id: string) => apiRequest(`/suppliers/${id}`),
  create: (supplierData: any) => apiRequest('/suppliers', {
    method: 'POST',
    body: JSON.stringify(supplierData)
  }),
  update: (id: string, supplierData: any) => apiRequest(`/suppliers/${id}`, {
    method: 'PUT',
    body: JSON.stringify(supplierData)
  }),
  delete: (id: string) => apiRequest(`/suppliers/${id}`, { method: 'DELETE' }),
  getArticles: (id: string) => apiRequest(`/suppliers/${id}/articles`)
};

// API des articles
export const articlesAPI = {
  getAll: async (params?: any) => {
    try {
      const queryString = params ? '?' + new URLSearchParams(params).toString() : '';
      return await apiRequest(`/articles${queryString}`);
    } catch (error) {
      console.error('Erreur lors de la récupération des articles:', error);
      throw error;
    }
  },
  getById: async (id: string) => {
    try {
      return await apiRequest(`/articles/${id}`);
    } catch (error) {
      console.error('Erreur lors de la récupération de l\'article:', error);
      throw error;
    }
  },
  create: async (articleData: any) => {
    try {
      return await apiRequest('/articles', {
        method: 'POST',
        body: JSON.stringify(articleData)
      });
    } catch (error) {
      console.error('Erreur lors de la création de l\'article:', error);
      throw error;
    }
  },
  update: async (id: string, articleData: any) => {
    try {
      return await apiRequest(`/articles/${id}`, {
        method: 'PUT',
        body: JSON.stringify(articleData)
      });
    } catch (error) {
      console.error('Erreur lors de la mise à jour de l\'article:', error);
      throw error;
    }
  },
  delete: async (id: string) => {
    try {
      return await apiRequest(`/articles/${id}`, { method: 'DELETE' });
    } catch (error) {
      console.error('Erreur lors de la suppression de l\'article:', error);
      throw error;
    }
  },
  getLowStock: async () => {
    try {
      return await apiRequest('/articles/low-stock');
    } catch (error) {
      console.error('Erreur lors de la récupération des articles en stock faible:', error);
      throw error;
    }
  }
};

// API des mouvements de stock
export const movementsAPI = {
  getAll: (params?: any) => {
    const queryString = params ? '?' + new URLSearchParams(params).toString() : '';
    return apiRequest(`/movements${queryString}`);
  },
  getById: (id: string) => apiRequest(`/movements/${id}`),
  create: async (movementData: any) => {
    try {
      return await apiRequest('/movements', {
        method: 'POST',
        body: JSON.stringify(movementData)
      });
    } catch (error) {
      console.error('Erreur lors de la création du mouvement de stock', error);
      throw error;
    }
  },
  delete: (id: string) => apiRequest(`/movements/${id}`, { method: 'DELETE' })
};

// API des demandes de réapprovisionnement
export const supplyRequestsAPI = {
  getAll: (params?: any) => {
    const queryString = params ? '?' + new URLSearchParams(params).toString() : '';
    return apiRequest(`/supply-requests${queryString}`);
  },
  getById: (id: string) => apiRequest(`/supply-requests/${id}`),
  create: (requestData: any) => apiRequest('/supply-requests', {
    method: 'POST',
    body: JSON.stringify(requestData)
  }),
  update: (id: string, requestData: any) => apiRequest(`/supply-requests/${id}`, {
    method: 'PUT',
    body: JSON.stringify(requestData)
  }),
  updateStatus: (id: string, status: string, orderReference?: string) => 
    apiRequest(`/supply-requests/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, order_reference: orderReference })
    }),
  delete: (id: string) => apiRequest(`/supply-requests/${id}`, { method: 'DELETE' })
};

// API des audits
export const auditsAPI = {
  getAll: (params?: any) => {
    const queryString = params ? '?' + new URLSearchParams(params).toString() : '';
    return apiRequest(`/audits${queryString}`);
  },
  getById: (id: string) => apiRequest(`/audits/${id}`),
  create: (auditData: any) => apiRequest('/audits', {
    method: 'POST',
    body: JSON.stringify(auditData)
  }),
  update: (id: string, auditData: any) => apiRequest(`/audits/${id}`, {
    method: 'PUT',
    body: JSON.stringify(auditData)
  }),
  updateStatus: (id: string, status: string) => apiRequest(`/audits/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status })
  }),
  addFindings: (id: string, findings: any[]) => apiRequest(`/audits/${id}/findings`, {
    method: 'POST',
    body: JSON.stringify({ findings })
  }),
  delete: (id: string) => apiRequest(`/audits/${id}`, { method: 'DELETE' })
};

// API du dashboard
export const dashboardAPI = {
  getStats: () => apiRequest('/dashboard/stats'),
  getCharts: () => apiRequest('/dashboard/charts'),
  getRecentActivity: () => apiRequest('/dashboard/recent-activity'),
  getAlerts: () => apiRequest('/dashboard/alerts')
};

// API des rapports
export const reportsAPI = {
  getInventory: (params?: any) => {
    const queryString = params ? '?' + new URLSearchParams(params).toString() : '';
    return apiRequest(`/reports/inventory${queryString}`);
  },
  getMovements: (params?: any) => {
    const queryString = params ? '?' + new URLSearchParams(params).toString() : '';
    return apiRequest(`/reports/movements${queryString}`);
  },
  getSupplyRequests: (params?: any) => {
    const queryString = params ? '?' + new URLSearchParams(params).toString() : '';
    return apiRequest(`/reports/supply-requests${queryString}`);
  },
  getAudits: (params?: any) => {
    const queryString = params ? '?' + new URLSearchParams(params).toString() : '';
    return apiRequest(`/reports/audits${queryString}`);
  }
};