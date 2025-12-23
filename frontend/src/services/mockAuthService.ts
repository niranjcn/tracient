import { AuthResponse, LoginCredentials } from '@/types';
import { TOKEN_KEY, REFRESH_TOKEN_KEY } from '@/utils/constants';

// Mock users for temporary login
const MOCK_USERS = {
  'worker@gmail.com': {
    password: 'worker',
    user: {
      id: 'worker-001',
      name: 'Demo Worker',
      email: 'worker@gmail.com',
      role: 'worker',
      orgMSP: 'WorkerMSP',
      idHash: 'aadhar-hash-001', // Must match backend registered worker
      phone: '9876543210',
      status: 'active' as const,
      createdAt: new Date().toISOString(),
      aadhaarVerified: true,
      bplStatus: 'BPL' as const,
      totalIncome: 85000,
      profileImage: '/avatar-worker.png',
    },
  },
  'employer@gmail.com': {
    password: 'employer',
    user: {
      id: 'employer-001',
      name: 'Demo Employer',
      email: 'employer@gmail.com',
      role: 'employer',
      orgMSP: 'EmployerMSP',
      idHash: 'hash_pan_ABCDE1234F',
      phone: '9876543211',
      status: 'active' as const,
      createdAt: new Date().toISOString(),
      businessName: 'Demo Construction Pvt Ltd',
      gstin: '27ABCDE1234F1Z5',
      panVerified: true,
      workerCount: 42,
      profileImage: '/avatar-employer.png',
    },
  },
  'government@gmail.com': {
    password: 'government',
    user: {
      id: 'gov-001',
      name: 'Demo Government Official',
      email: 'government@gmail.com',
      role: 'government',
      orgMSP: 'GovMSP',
      idHash: 'hash_emp_GOV123456',
      phone: '9876543212',
      status: 'active' as const,
      createdAt: new Date().toISOString(),
      department: 'Ministry of Labour & Employment',
      designation: 'Senior Analyst',
      employeeId: 'GOV123456',
      profileImage: '/avatar-government.png',
    },
  },
  'admin@gmail.com': {
    password: 'admin',
    user: {
      id: 'admin-001',
      name: 'System Administrator',
      email: 'admin@gmail.com',
      role: 'admin',
      orgMSP: 'AdminMSP',
      idHash: 'hash_admin_001',
      phone: '9876543213',
      status: 'active' as const,
      createdAt: new Date().toISOString(),
      permissions: ['*'],
      profileImage: '/avatar-admin.png',
    },
  },
};

// Generate a mock JWT token
const generateMockToken = (email: string): string => {
  const payload = { email, timestamp: Date.now() };
  return `mock_token_${btoa(JSON.stringify(payload))}`;
};

export const mockAuthService = {
  // Mock login
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    await new Promise(resolve => setTimeout(resolve, 500)); // Simulate network delay

    const email = credentials.identifier.toLowerCase();
    const mockUser = MOCK_USERS[email as keyof typeof MOCK_USERS];

    if (!mockUser) {
      throw new Error('Invalid email or password');
    }

    if (mockUser.password !== credentials.password) {
      throw new Error('Invalid email or password');
    }

    const token = generateMockToken(email);
    const refreshToken = `refresh_${token}`;

    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);

    // Store user data for getCurrentUser
    localStorage.setItem('mockUser', JSON.stringify(mockUser.user));

    return {
      success: true,
      token,
      refreshToken,
      user: {
        id: mockUser.user.id,
        name: mockUser.user.name,
        email: mockUser.user.email,
        role: mockUser.user.role,
        orgMSP: mockUser.user.orgMSP,
      },
    };
  },

  // Mock logout
  logout: async (): Promise<void> => {
    await new Promise(resolve => setTimeout(resolve, 200));
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem('mockUser');
  },

  // Get current user
  getCurrentUser: async () => {
    await new Promise(resolve => setTimeout(resolve, 200));
    const userStr = localStorage.getItem('mockUser');
    if (!userStr) {
      throw new Error('Not authenticated');
    }
    return JSON.parse(userStr);
  },

  // Check if authenticated
  isAuthenticated: (): boolean => {
    return !!localStorage.getItem(TOKEN_KEY);
  },

  // Get stored token
  getToken: (): string | null => {
    return localStorage.getItem(TOKEN_KEY);
  },
};

export default mockAuthService;
