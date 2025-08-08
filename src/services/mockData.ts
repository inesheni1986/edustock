import { User, Lycee, Laboratory, Supplier, Article, StockMovement, SupplyRequest, Audit } from '../types';

// Mock data initialization
const initializeData = () => {
  if (!localStorage.getItem('users')) {
    const initialUsers: User[] = [
      {
        id: '1',
        email: 'admin@lycee.fr',
        password: 'admin123',
        firstName: 'Admin',
        lastName: 'System',
        role: 'admin',
        laboratoryIds: [],
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: '2',
        email: 'prof@lycee.fr',
        password: 'prof123',
        firstName: 'Jean',
        lastName: 'Dupont',
        role: 'professor',
        lyceeId: '1',
        laboratoryIds: ['1'],
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: '3',
        email: 'auditeur@lycee.fr',
        password: 'audit123',
        firstName: 'Marie',
        lastName: 'Martin',
        role: 'auditor',
        lyceeId: '1',
        laboratoryIds: ['1', '2'],
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];
    localStorage.setItem('users', JSON.stringify(initialUsers));
  }

  if (!localStorage.getItem('lycees')) {
    const initialLycees: Lycee[] = [
      {
        id: '1',
        name: 'Lycée Technique Voltaire',
        address: '123 Rue de la Science',
        city: 'Paris',
        postalCode: '75001',
        phone: '01 23 45 67 89',
        email: 'contact@voltaire.edu',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: '2',
        name: 'Lycée Professionnel Edison',
        address: '456 Avenue de l\'Électricité',
        city: 'Lyon',
        postalCode: '69000',
        phone: '04 78 90 12 34',
        email: 'contact@edison.edu',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];
    localStorage.setItem('lycees', JSON.stringify(initialLycees));
  }

  if (!localStorage.getItem('laboratories')) {
    const initialLaboratories: Laboratory[] = [
      {
        id: '1',
        name: 'Laboratoire Électrotechnique',
        lyceeId: '1',
        description: 'Laboratoire principal pour les cours d\'électrotechnique',
        responsibleUserId: '2',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: '2',
        name: 'Laboratoire Électronique',
        lyceeId: '1',
        description: 'Laboratoire spécialisé en électronique',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];
    localStorage.setItem('laboratories', JSON.stringify(initialLaboratories));
  }

  if (!localStorage.getItem('suppliers')) {
    const initialSuppliers: Supplier[] = [
      {
        id: '1',
        name: 'TechnoElec Distribution',
        contactName: 'Pierre Électron',
        email: 'commandes@technoelec.fr',
        phone: '01 44 55 66 77',
        address: '789 Rue des Composants',
        city: 'Paris',
        postalCode: '75010',
        siret: '12345678901234',
        website: 'www.technoelec.fr',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: '2',
        name: 'Résistance & Cie',
        contactName: 'Anne Ampère',
        email: 'vente@resistance-cie.fr',
        phone: '02 33 44 55 66',
        address: '321 Boulevard des Ohms',
        city: 'Nantes',
        postalCode: '44000',
        siret: '98765432109876',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];
    localStorage.setItem('suppliers', JSON.stringify(initialSuppliers));
  }

  if (!localStorage.getItem('articles')) {
    const initialArticles: Article[] = [
      {
        id: '1',
        name: 'Résistance 1kΩ',
        reference: 'R1K-01',
        description: 'Résistance 1/4W 5% axiale',
        category: 'Composants passifs',
        unit: 'pièce',
        minStock: 100,
        maxStock: 500,
        currentStock: 150,
        unitPrice: 0.05,
        supplierId: '1',
        laboratoryId: '1',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: '2',
        name: 'Condensateur 100μF',
        reference: 'C100-01',
        description: 'Condensateur électrolytique 25V',
        category: 'Composants passifs',
        unit: 'pièce',
        minStock: 50,
        maxStock: 200,
        currentStock: 30,
        unitPrice: 0.15,
        supplierId: '1',
        laboratoryId: '1',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: '3',
        name: 'Multimètre numérique',
        reference: 'MULTI-001',
        description: 'Multimètre 3½ digits avec affichage LCD',
        category: 'Instruments de mesure',
        unit: 'pièce',
        minStock: 5,
        maxStock: 20,
        currentStock: 8,
        unitPrice: 45.00,
        supplierId: '2',
        laboratoryId: '1',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];
    localStorage.setItem('articles', JSON.stringify(initialArticles));
  }

  if (!localStorage.getItem('stockMovements')) {
    const initialMovements: StockMovement[] = [
      {
        id: '1',
        articleId: '1',
        laboratoryId: '1',
        type: 'in',
        quantity: 100,
        reason: 'Réapprovisionnement',
        reference: 'CMD-001',
        userId: '2',
        supplierId: '1',
        createdAt: new Date(Date.now() - 86400000) // Yesterday
      },
      {
        id: '2',
        articleId: '2',
        laboratoryId: '1',
        type: 'out',
        quantity: 20,
        reason: 'Utilisation TP',
        userId: '2',
        notes: 'TP classe de 1ère STI2D',
        createdAt: new Date()
      }
    ];
    localStorage.setItem('stockMovements', JSON.stringify(initialMovements));
  }

  if (!localStorage.getItem('supplyRequests')) {
    const initialRequests: SupplyRequest[] = [
      {
        id: '1',
        articleId: '2',
        laboratoryId: '1',
        requestedQuantity: 100,
        urgency: 'high',
        reason: 'Stock faible - nécessaire pour les TP',
        status: 'pending',
        requestedBy: '2',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];
    localStorage.setItem('supplyRequests', JSON.stringify(initialRequests));
  }

  if (!localStorage.getItem('audits')) {
    const initialAudits: Audit[] = [
      {
        id: '1',
        laboratoryId: '1',
        auditType: 'inventory',
        status: 'completed',
        scheduledDate: new Date(Date.now() - 172800000), // 2 days ago
        completedDate: new Date(Date.now() - 86400000), // Yesterday
        auditedBy: '3',
        findings: [
          {
            id: '1',
            articleId: '1',
            expectedQuantity: 150,
            actualQuantity: 145,
            discrepancy: -5,
            reason: 'Utilisation non reportée',
            action: 'Mise à jour du stock'
          }
        ],
        notes: 'Inventaire trimestriel - écarts mineurs',
        createdAt: new Date(Date.now() - 259200000), // 3 days ago
        updatedAt: new Date(Date.now() - 86400000)
      }
    ];
    localStorage.setItem('audits', JSON.stringify(initialAudits));
  }
};

// Initialize data on first load
initializeData();

// CRUD operations for each entity
export const getUsers = (): User[] => {
  return JSON.parse(localStorage.getItem('users') || '[]');
};

export const createUser = (user: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): User => {
  const users = getUsers();
  const newUser: User = {
    ...user,
    id: Date.now().toString(),
    createdAt: new Date(),
    updatedAt: new Date()
  };
  users.push(newUser);
  localStorage.setItem('users', JSON.stringify(users));
  return newUser;
};

export const updateUser = (id: string, updates: Partial<User>): User | null => {
  const users = getUsers();
  const userIndex = users.findIndex(u => u.id === id);
  if (userIndex === -1) return null;
  
  users[userIndex] = { ...users[userIndex], ...updates, updatedAt: new Date() };
  localStorage.setItem('users', JSON.stringify(users));
  return users[userIndex];
};

export const deleteUser = (id: string): boolean => {
  const users = getUsers();
  const filteredUsers = users.filter(u => u.id !== id);
  localStorage.setItem('users', JSON.stringify(filteredUsers));
  return filteredUsers.length < users.length;
};

export const deleteLycee = (id: string): boolean => {
  const lycees = getLycees();
  const filteredLycees = lycees.filter(l => l.id !== id);
  localStorage.setItem('lycees', JSON.stringify(filteredLycees));
  return filteredLycees.length < lycees.length;
};

export const updateLycee = (id: string, updates: Partial<Lycee>): Lycee | null => {
  const lycees = getLycees();
  const lyceeIndex = lycees.findIndex(l => l.id === id);
  if (lyceeIndex === -1) return null;
  
  lycees[lyceeIndex] = { ...lycees[lyceeIndex], ...updates, updatedAt: new Date() };
  localStorage.setItem('lycees', JSON.stringify(lycees));
  return lycees[lyceeIndex];
};

export const deleteLaboratory = (id: string): boolean => {
  const laboratories = getLaboratories();
  const filteredLaboratories = laboratories.filter(l => l.id !== id);
  localStorage.setItem('laboratories', JSON.stringify(filteredLaboratories));
  return filteredLaboratories.length < laboratories.length;
};


export const deleteStockMovement = (id: string): boolean => {
  const movements = getStockMovements();
  const filteredMovements = movements.filter(m => m.id !== id);
  localStorage.setItem('stockMovements', JSON.stringify(filteredMovements));
  return filteredMovements.length < movements.length;
};

export const deleteSupplyRequest = (id: string): boolean => {
  const requests = getSupplyRequests();
  const filteredRequests = requests.filter(r => r.id !== id);
  localStorage.setItem('supplyRequests', JSON.stringify(filteredRequests));
  return filteredRequests.length < requests.length;
};

export const deleteAudit = (id: string): boolean => {
  const audits = getAudits();
  const filteredAudits = audits.filter(a => a.id !== id);
  localStorage.setItem('audits', JSON.stringify(filteredAudits));
  return filteredAudits.length < audits.length;
};

export const updateAudit = (id: string, updates: Partial<Audit>): Audit | null => {
  const audits = getAudits();
  const auditIndex = audits.findIndex(a => a.id === id);
  if (auditIndex === -1) return null;
  
  audits[auditIndex] = { ...audits[auditIndex], ...updates, updatedAt: new Date() };
  localStorage.setItem('audits', JSON.stringify(audits));
  return audits[auditIndex];
};
export const getLycees = (): Lycee[] => {
  return JSON.parse(localStorage.getItem('lycees') || '[]');
};

export const createLycee = (lycee: Omit<Lycee, 'id' | 'createdAt' | 'updatedAt'>): Lycee => {
  const lycees = getLycees();
  const newLycee: Lycee = {
    ...lycee,
    id: Date.now().toString(),
    createdAt: new Date(),
    updatedAt: new Date()
  };
  lycees.push(newLycee);
  localStorage.setItem('lycees', JSON.stringify(lycees));
  return newLycee;
};

export const getLaboratories = (): Laboratory[] => {
  return JSON.parse(localStorage.getItem('laboratories') || '[]');
};

export const createLaboratory = (lab: Omit<Laboratory, 'id' | 'createdAt' | 'updatedAt'>): Laboratory => {
  const laboratories = getLaboratories();
  const newLab: Laboratory = {
    ...lab,
    id: Date.now().toString(),
    createdAt: new Date(),
    updatedAt: new Date()
  };
  laboratories.push(newLab);
  localStorage.setItem('laboratories', JSON.stringify(laboratories));
  return newLab;
};

export const getSuppliers = (): Supplier[] => {
  return JSON.parse(localStorage.getItem('suppliers') || '[]');
};

export const createSupplier = (supplier: Omit<Supplier, 'id' | 'createdAt' | 'updatedAt'>): Supplier => {
  const suppliers = getSuppliers();
  const newSupplier: Supplier = {
    ...supplier,
    id: Date.now().toString(),
    createdAt: new Date(),
    updatedAt: new Date()
  };
  suppliers.push(newSupplier);
  localStorage.setItem('suppliers', JSON.stringify(suppliers));
  return newSupplier;
};

export const getArticles = (): Article[] => {
  return JSON.parse(localStorage.getItem('articles') || '[]');
};

export const createArticle = (article: Omit<Article, 'id' | 'createdAt' | 'updatedAt'>): Article => {
  const articles = getArticles();
  const newArticle: Article = {
    ...article,
    id: Date.now().toString(),
    createdAt: new Date(),
    updatedAt: new Date()
  };
  articles.push(newArticle);
  localStorage.setItem('articles', JSON.stringify(articles));
  return newArticle;
};

export const updateArticle = (id: string, updates: Partial<Article>): Article | null => {
  const articles = getArticles();
  const articleIndex = articles.findIndex(a => a.id === id);
  if (articleIndex === -1) return null;
  
  articles[articleIndex] = { ...articles[articleIndex], ...updates, updatedAt: new Date() };
  localStorage.setItem('articles', JSON.stringify(articles));
  return articles[articleIndex];
};

export const getStockMovements = (): StockMovement[] => {
  return JSON.parse(localStorage.getItem('stockMovements') || '[]');
};

export const createStockMovement = (movement: Omit<StockMovement, 'id' | 'createdAt'>): StockMovement => {
  const movements = getStockMovements();
  const newMovement: StockMovement = {
    ...movement,
    id: Date.now().toString(),
    createdAt: new Date()
  };
  movements.push(newMovement);
  localStorage.setItem('stockMovements', JSON.stringify(movements));
  
  // Update article stock
  const articles = getArticles();
  const articleIndex = articles.findIndex(a => a.id === movement.articleId);
  if (articleIndex !== -1) {
    const article = articles[articleIndex];
    if (movement.type === 'in') {
      article.currentStock += movement.quantity;
    } else {
      article.currentStock -= movement.quantity;
    }
    article.updatedAt = new Date();
    localStorage.setItem('articles', JSON.stringify(articles));
  }
  
  return newMovement;
};

export const getSupplyRequests = (): SupplyRequest[] => {
  return JSON.parse(localStorage.getItem('supplyRequests') || '[]');
};

export const createSupplyRequest = (request: Omit<SupplyRequest, 'id' | 'createdAt' | 'updatedAt'>): SupplyRequest => {
  const requests = getSupplyRequests();
  const newRequest: SupplyRequest = {
    ...request,
    id: Date.now().toString(),
    createdAt: new Date(),
    updatedAt: new Date()
  };
  requests.push(newRequest);
  localStorage.setItem('supplyRequests', JSON.stringify(requests));
  return newRequest;
};

export const updateSupplyRequest = (id: string, updates: Partial<SupplyRequest>): SupplyRequest | null => {
  const requests = getSupplyRequests();
  const requestIndex = requests.findIndex(r => r.id === id);
  if (requestIndex === -1) return null;
  
  requests[requestIndex] = { ...requests[requestIndex], ...updates, updatedAt: new Date() };
  localStorage.setItem('supplyRequests', JSON.stringify(requests));
  return requests[requestIndex];
};

export const getAudits = (): Audit[] => {
  return JSON.parse(localStorage.getItem('audits') || '[]');
};

export const createAudit = (audit: Omit<Audit, 'id' | 'createdAt' | 'updatedAt'>): Audit => {
  const audits = getAudits();
  const newAudit: Audit = {
    ...audit,
    id: Date.now().toString(),
    createdAt: new Date(),
    updatedAt: new Date()
  };
  audits.push(newAudit);
  localStorage.setItem('audits', JSON.stringify(audits));
  return newAudit;
};