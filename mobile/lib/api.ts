import * as SecureStore from 'expo-secure-store';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'https://medcare-vert.vercel.app';

async function getAuthToken(): Promise<string | null> {
  return SecureStore.getItemAsync('auth_token');
}

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = await getAuthToken();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
    headers['Cookie'] = `token=${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorMessage = `Request failed with status ${response.status}`;
    try {
      const error = await response.json();
      errorMessage = error.error || error.message || errorMessage;
    } catch {
      // ignore parse error
    }
    throw new Error(errorMessage);
  }

  const text = await response.text();
  if (!text) return {} as T;
  return JSON.parse(text) as T;
}

// Auth
export const api = {
  auth: {
    login: (mobile: string) =>
      request('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ mobile }),
      }),

    verifyOtp: (mobile: string, otp: string) =>
      request<{ token: string; user: User }>('/api/auth/verify-otp', {
        method: 'POST',
        body: JSON.stringify({ mobile, otp }),
      }),

    loginEmail: (email: string, password: string) =>
      request<{ token: string; user: User }>('/api/auth/login-email', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      }),

    register: (data: RegisterData) =>
      request<{ token: string; user: User }>('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    forgotPassword: (email: string) =>
      request('/api/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email }),
      }),

    logout: () =>
      request('/api/auth/logout', { method: 'POST' }),

    me: () =>
      request<{ user: User }>('/api/auth/me'),
  },

  medicines: {
    list: () =>
      request<{ medicines: Medicine[] }>('/api/medicines'),

    get: (id: string) =>
      request<{ medicine: MedicineDetail }>(`/api/medicines/${id}`),

    create: (data: CreateMedicineData) =>
      request<{ medicine: Medicine }>('/api/medicines', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    update: (id: string, data: Partial<CreateMedicineData>) =>
      request<{ medicine: Medicine }>(`/api/medicines/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),

    delete: (id: string) =>
      request(`/api/medicines/${id}`, { method: 'DELETE' }),
  },

  intake: {
    list: (params?: { days?: number; medicineId?: string }) => {
      const qs = new URLSearchParams();
      if (params?.days) qs.set('days', String(params.days));
      if (params?.medicineId) qs.set('medicineId', params.medicineId);
      return request<{ intakes: Intake[] }>(`/api/intake?${qs}`);
    },

    log: (data: LogIntakeData) =>
      request('/api/intake', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  },

  stock: {
    refill: (patientMedicineId: string, quantity: number, notes?: string) =>
      request('/api/stock', {
        method: 'POST',
        body: JSON.stringify({ patientMedicineId, quantity, notes }),
      }),
  },

  user: {
    updateProfile: (data: { name?: string; email?: string }) =>
      request('/api/user/profile', {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
  },

  notifications: {
    getPreferences: () =>
      request<{ preferences: NotificationPreferences }>('/api/notifications/preferences'),

    updatePreferences: (data: Partial<NotificationPreferences>) =>
      request('/api/notifications/preferences', {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
  },
};

// Types
export interface User {
  id: string;
  mobile?: string;
  email?: string;
  name?: string;
  createdAt: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
}

export interface Medicine {
  id: string;
  customName?: string;
  medicine?: {
    id: string;
    name: string;
    genericName?: string;
    dosageForm: string;
    strength?: string;
  };
  dosageForm?: string;
  strength?: string;
  currentStock: number;
  dosagePerIntake: number;
  unit: string;
  frequency: string;
  reminderEnabled: boolean;
  reminderTimes: string[];
  lowStockThreshold: number;
  notes?: string;
  isActive: boolean;
  createdAt: string;
  daysRemaining?: number;
}

export interface MedicineDetail extends Medicine {
  intakes: Intake[];
  stockHistory: StockHistory[];
}

export interface CreateMedicineData {
  medicineName: string;
  genericName?: string;
  dosageForm: string;
  strength?: string;
  currentStock: number;
  dosagePerIntake: number;
  unit: string;
  frequency: string;
  reminderEnabled: boolean;
  reminderTimes: string[];
  lowStockThreshold: number;
  notes?: string;
}

export interface Intake {
  id: string;
  patientMedicineId: string;
  scheduledTime: string;
  takenAt?: string;
  status: 'PENDING' | 'TAKEN' | 'SKIPPED' | 'MISSED';
  dosageTaken?: number;
  notes?: string;
  patientMedicine?: {
    customName?: string;
    medicine?: { name: string };
    unit: string;
    dosagePerIntake: number;
  };
}

export interface StockHistory {
  id: string;
  changeType: string;
  quantity: number;
  previousStock: number;
  newStock: number;
  notes?: string;
  createdAt: string;
}

export interface NotificationPreferences {
  emailEnabled: boolean;
  pushEnabled: boolean;
  smsEnabled: boolean;
  soundEnabled: boolean;
  reminderEnabled: boolean;
  stockAlertEnabled: boolean;
}
