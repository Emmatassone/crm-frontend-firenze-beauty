// Helper function for handling API responses
async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: response.statusText }));
    throw new Error(errorData.message || 'API request failed');
  }
  if (response.status === 204) {
    return null as T;
  }
  return response.json();
}

// Generic request function with authentication
async function request<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const API_BASE_URL = (
    process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001'
  )
    .trim()
    .replace(/\/+$/, '');

  const url = `${API_BASE_URL}${endpoint}`;

  // Get auth store dynamically to avoid circular dependencies
  const { useAuthStore } = await import('../store/auth');
  const { token, isTokenValid, logout } = useAuthStore.getState();

  // Check if token is valid before making request
  if (token) {
    const isValid = isTokenValid();

    if (!isValid) {
      logout();
      window.location.href = '/login';
      throw new Error('Authentication token expired');
    }
  }

  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options?.headers,
    },
  });

  // Handle 401 responses (token expired or invalid)
  if (response.status === 401) {
    logout();
    window.location.href = '/login';
    throw new Error('Authentication failed');
  }

  return handleResponse<T>(response);
}

// Dashboard
export const getDashboardSummary = (): Promise<any> => request('/analytics/dashboard');

// Finance
export const getFinanceMonthlyRevenue = (): Promise<any[]> => request('/analytics/finance');

// Employees
export const getEmployeeMonthlyPerformance = (): Promise<any[]> => request('/analytics/employees');
export const getEmployeeRetentionFacts = (): Promise<any[]> => request('/analytics/employees/retention');

// Clients
export const getClientMonthlyBehavior = (): Promise<any[]> => request('/analytics/clients');
