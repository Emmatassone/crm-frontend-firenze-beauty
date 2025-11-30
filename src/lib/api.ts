const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001'
)
  .trim()
  .replace(/\/+$/, '');

// Helper function for handling API responses
async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: response.statusText }));
    throw new Error(errorData.message || 'API request failed');
  }
  // For 204 No Content, response.json() will fail, so handle it specifically
  if (response.status === 204) {
    return null as T; // Or an appropriate empty representation
  }
  return response.json();
}

// Generic request function with authentication
async function request<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  // Get auth store dynamically to avoid circular dependencies
  const { useAuthStore } = await import('./store/auth');
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

// --- ClientProfile Types (mirroring backend DTOs/Entities for now) ---
export interface ClientProfile {
  id: string;
  name?: string;
  phoneNumber: string;
  email?: string;
  dateOfBirth?: string;
  hairDetails?: string;
  eyelashDetails?: string;
  nailDetails?: string;
  clientAllergies?: string;
  appointments?: any[]; // Define Appointment type later
  createdAt: string; 
  updatedAt: string;
}

export type CreateClientProfileDto = Omit<ClientProfile, 'id' | 'appointments' | 'createdAt' | 'updatedAt'>;
export type UpdateClientProfileDto = Partial<CreateClientProfileDto>;

// --- ClientProfile API Functions ---
export const getClientProfiles = (): Promise<ClientProfile[]> => request<ClientProfile[]>('/client-profiles');
export const getClientProfileById = (id: string): Promise<ClientProfile> => request<ClientProfile>(`/client-profiles/${id}`);
export const createClientProfile = (data: CreateClientProfileDto): Promise<ClientProfile> => request<ClientProfile>('/client-profiles', { method: 'POST', body: JSON.stringify(data) });
export const updateClientProfile = (id: string, data: UpdateClientProfileDto): Promise<ClientProfile> => request<ClientProfile>(`/client-profiles/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
export const deleteClientProfile = (id: string): Promise<void> => request<void>(`/client-profiles/${id}`, { method: 'DELETE' });

// --- Appointment Types ---
export interface Appointment {
  id: string;
  appointmentDate: string;
  attendedEmployee: string;
  clientName: string;
  clientId: string;
  client?: ClientProfile; // Optional, if eager loaded
  arrivalTime?: string;
  leaveTime?: string;
  serviceConsumed: string;
  serviceQuantities?: string;
  usedDiscount?: string;
  additionalComments?: string;
  totalAmount?: number;
  createdAt: string; 
  updatedAt: string;
}
export type CreateAppointmentDto = Omit<Appointment, 'id' | 'client' | 'createdAt' | 'updatedAt'>;
export type UpdateAppointmentDto = Partial<CreateAppointmentDto>;

// --- Appointment API Functions ---
export const getAppointments = (): Promise<Appointment[]> => request<Appointment[]>('/appointments');
export const getAppointmentById = (id: string): Promise<Appointment> => request<Appointment>(`/appointments/${id}`);
export const createAppointment = (data: CreateAppointmentDto): Promise<Appointment> => request<Appointment>('/appointments', { method: 'POST', body: JSON.stringify(data) });
export const updateAppointment = (id: string, data: UpdateAppointmentDto): Promise<Appointment> => request<Appointment>(`/appointments/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
export const deleteAppointment = (id: string): Promise<void> => request<void>(`/appointments/${id}`, { method: 'DELETE' });


// --- Product Types ---
export interface Product {
  id: string;
  productName: string;
  currentStock?: number;
  model?: string;
  purchasePrice?: number;
  sellingPrice?: number;
  lastRestockDate?: string;
  createdAt: string; 
  updatedAt: string;
}
export type CreateProductDto = Omit<Product, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateProductDto = Partial<CreateProductDto>;

// --- Product API Functions ---
export const getProducts = (): Promise<Product[]> => request<Product[]>('/products');
export const getProductById = (id: string): Promise<Product> => request<Product>(`/products/${id}`);
export const createProduct = (data: CreateProductDto): Promise<Product> => request<Product>('/products', { method: 'POST', body: JSON.stringify(data) });
export const updateProduct = (id: string, data: UpdateProductDto): Promise<Product> => request<Product>(`/products/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
export const deleteProduct = (id: string): Promise<void> => request<void>(`/products/${id}`, { method: 'DELETE' });

// --- Service Types ---
export interface Service {
  id: string;
  name: string;
  abbreviation?: string;
  description?: string;
  area?: string;
  price: number;
  duration?: number;
  createdAt: string;
  updatedAt: string;
}

export type CreateServiceDto = Omit<Service, 'id' | 'createdAt' | 'updatedAt'> & { abbreviation?: string; area?: string };
export type UpdateServiceDto = Partial<CreateServiceDto>;

// --- Service API Functions ---
export const getServices = (): Promise<Service[]> => request<Service[]>('/services');
export const getServiceById = (id: string): Promise<Service> => request<Service>(`/services/${id}`);
export const createService = (data: CreateServiceDto): Promise<Service> => request<Service>('/services', { method: 'POST', body: JSON.stringify(data) });
export const updateService = (id: string, data: UpdateServiceDto): Promise<Service> => request<Service>(`/services/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
export const deleteService = (id: string): Promise<void> => request<void>(`/services/${id}`, { method: 'DELETE' });

// --- Employee Types ---
export interface Employee {
  id: string;
  name: string;
  email: string;
  jobTitle: string;
  status: 'active' | 'suspended' | 'retired';
  level?: string;
  phoneNumber?: string;
  address?: string;
  dateOfBirth?: string;
  createdAt: string;
  updatedAt: string;
}

export type CreateEmployeeDto = Omit<Employee, 'id' | 'createdAt' | 'updatedAt'> & { password?: string };
export type UpdateEmployeeDto = Partial<Omit<Employee, 'id' | 'createdAt' | 'updatedAt'>> & { password?: string };

// --- Employee API Functions ---
export const getEmployees = (): Promise<Employee[]> => request<Employee[]>('/employees');
export const getEmployeeById = (id: string): Promise<Employee> => request<Employee>(`/employees/${id}`);
export const createEmployee = (data: CreateEmployeeDto): Promise<Employee> => request<Employee>('/employees', { method: 'POST', body: JSON.stringify(data) });
export const updateEmployee = (id: string, data: UpdateEmployeeDto): Promise<Employee> => request<Employee>(`/employees/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
export const deleteEmployee = (id: string): Promise<void> => request<void>(`/employees/${id}`, { method: 'DELETE' });

// --- ProductSale Types ---
export interface ProductSale {
  id: string;
  productName: string;
  sku?: string;
  productId: string;
  product?: Product; // Relation
  clientName?: string;
  clientId?: string;
  client?: ClientProfile; // Relation
  dateTime: string; // ISO string
  quantitySold: number;
  sellingPricePerUnit: number;
  totalSaleAmount: number;
  discountApplied?: string;
  finalAmount: number;
  sellerEmployeeId?: string;
  sellerEmployee?: Employee; // Relation
  comment?: string;
  createdAt: string;
  updatedAt: string;
}

// For CreateProductSaleDto, productName and sku are not sent by client, they are set by backend service.
// totalSaleAmount and finalAmount are also calculated by backend or validated if sent.
export interface CreateProductSaleDto {
  productId: string;
  clientId?: string;
  dateTime?: string; // Optional, defaults to now on backend
  quantitySold: number;
  sellingPricePerUnit: number; // Price at time of sale
  totalSaleAmount: number; // Pre-calculated by frontend for validation or reference
  discountApplied?: string;
  finalAmount: number; // Pre-calculated by frontend for validation or reference
  sellerEmployeeId?: string;
  comment?: string;
}

export type UpdateProductSaleDto = Partial<Omit<CreateProductSaleDto, 'productId' | 'quantitySold' | 'sellingPricePerUnit' | 'totalSaleAmount' | 'finalAmount'> & { comment?: string }>; // Example: only comment updatable

// --- ProductSale API Functions ---
export const getProductSales = (): Promise<ProductSale[]> => request<ProductSale[]>('/sales');
export const getProductSaleById = (id: string): Promise<ProductSale> => request<ProductSale>(`/sales/${id}`);
export const createProductSale = (data: CreateProductSaleDto): Promise<ProductSale> => request<ProductSale>('/sales', { method: 'POST', body: JSON.stringify(data) });
// Update might be very restricted or not used for sales records
export const updateProductSale = (id: string, data: UpdateProductSaleDto): Promise<ProductSale> => request<ProductSale>(`/sales/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
// Delete also sensitive
export const deleteProductSale = (id: string): Promise<void> => request<void>(`/sales/${id}`, { method: 'DELETE' }); 