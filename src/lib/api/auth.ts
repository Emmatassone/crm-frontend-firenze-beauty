import axios from 'axios';

const API_URL = (
  process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001'
)
  .trim()
  .replace(/\/+$/, '');

export const login = async (email: string, password: string): Promise<{ access_token: string }> => {
  const response = await axios.post(`${API_URL}/auth/login`, {
    email,
    password,
  });
  return response.data;
}; 