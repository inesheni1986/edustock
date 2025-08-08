export interface User {
  id: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: 'admin' | 'professor' | 'auditor';
  lyceeId?: string;
  laboratoryIds: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Lycee {
  id: string;
  name: string;
  address: string;
  city: string;
  postalCode: string;
  phone: string;
  email: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Laboratory {
  id: string;
  name: string;
  lyceeId: string;
  description?: string;
  responsibleUserId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Supplier {
  id: string;
  name: string;
  contactName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  postalCode: string;
  siret?: string;
  website?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Article {
  id: string;
  name: string;
  reference: string;
  description?: string;
  category: string;
  unit: string;
  minStock: number;
  maxStock: number;
  currentStock: number;
  unitPrice: number;
  supplierId?: string;
  laboratoryId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface StockMovement {
  id: string;
  articleId: string;
  laboratoryId: string;
  type: 'in' | 'out';
  quantity: number;
  reason: string;
  reference?: string;
  userId: string;
  supplierId?: string;
  notes?: string;
  createdAt: Date;
}

export interface SupplyRequest {
  id: string;
  articleId: string;
  laboratoryId: string;
  requestedQuantity: number;
  urgency: 'low' | 'medium' | 'high';
  reason: string;
  status: 'pending' | 'approved' | 'ordered' | 'delivered' | 'cancelled';
  requestedBy: string;
  approvedBy?: string;
  supplierId?: string;
  orderReference?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Audit {
  id: string;
  laboratoryId: string;
  auditType: 'inventory' | 'quality' | 'compliance';
  status: 'planned' | 'in_progress' | 'completed' | 'cancelled';
  scheduledDate: Date;
  completedDate?: Date;
  auditedBy: string;
  findings: AuditFinding[];
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuditFinding {
  id: string;
  articleId: string;
  expectedQuantity: number;
  actualQuantity: number;
  discrepancy: number;
  reason?: string;
  action?: string;
}

export interface DashboardStats {
  totalArticles: number;
  lowStockItems: number;
  pendingRequests: number;
  recentMovements: number;
  totalLaboratories: number;
  activeSuppliers: number;
}

export interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
}