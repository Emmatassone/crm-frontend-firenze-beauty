export interface Expense {
    id: number;
    date: string;
    month: string;
    product_name: string;
    quantity: number;
    unit_price: number;
    total_price: number;
    category: string;
    description?: string;
    created_at: string;
}

export interface ParsedExpenseItem {
    product_name: string;
    quantity: number;
    unit_price: number;
    total_price: number;
    category: string;
}

export interface CreateExpensePayload {
    date: string;
    product_name: string;
    quantity: number;
    unit_price: number;
    total_price: number;
    category: string;
    description?: string;
}

const getBaseUrl = () =>
    (process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001')
        .trim()
        .replace(/\/+$/, '');

async function getAuthHeaders(): Promise<Record<string, string>> {
    const { useAuthStore } = await import('../store/auth');
    const { token, isTokenValid, logout } = useAuthStore.getState();
    if (token && !isTokenValid()) {
        logout();
        window.location.href = '/login';
        throw new Error('Authentication token expired');
    }
    return token ? { Authorization: `Bearer ${token}` } : {};
}

async function handleResponse<T>(response: Response): Promise<T> {
    if (response.status === 401) {
        const { useAuthStore } = await import('../store/auth');
        useAuthStore.getState().logout();
        window.location.href = '/login';
        throw new Error('Authentication failed');
    }
    if (!response.ok) {
        const err = await response.json().catch(() => ({ message: response.statusText }));
        throw new Error(err.message || 'API request failed');
    }
    if (response.status === 204) return null as T;
    return response.json();
}

export async function getExpenses(month: string): Promise<Expense[]> {
    const auth = await getAuthHeaders();
    const res = await fetch(`${getBaseUrl()}/expenses?month=${month}`, {
        headers: { 'Content-Type': 'application/json', ...auth },
    });
    return handleResponse<Expense[]>(res);
}

export async function createExpense(data: CreateExpensePayload): Promise<Expense> {
    const auth = await getAuthHeaders();
    const res = await fetch(`${getBaseUrl()}/expenses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...auth },
        body: JSON.stringify(data),
    });
    return handleResponse<Expense>(res);
}

export async function createExpensesBatch(items: CreateExpensePayload[]): Promise<Expense[]> {
    const auth = await getAuthHeaders();
    const res = await fetch(`${getBaseUrl()}/expenses/batch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...auth },
        body: JSON.stringify(items),
    });
    return handleResponse<Expense[]>(res);
}

export async function parseReceipt(file: File): Promise<ParsedExpenseItem[]> {
    const auth = await getAuthHeaders();
    const formData = new FormData();
    formData.append('receipt', file);
    const res = await fetch(`${getBaseUrl()}/expenses/parse-receipt`, {
        method: 'POST',
        headers: { ...auth },
        body: formData,
    });
    return handleResponse<ParsedExpenseItem[]>(res);
}

export async function deleteExpense(id: number): Promise<void> {
    const auth = await getAuthHeaders();
    const res = await fetch(`${getBaseUrl()}/expenses/${id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', ...auth },
    });
    return handleResponse<void>(res);
}
