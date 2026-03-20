/**
 * Axios instance that attaches Supabase session token to requests
 * so the backend can verify JWT and validate user_id.
 */
import axios from 'axios'
import { supabase } from '../services/supabase'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use(async (config) => {
  try {
    const { data: { session } } = await supabase.auth.getSession()
    if (session?.access_token) {
      config.headers.Authorization = `Bearer ${session.access_token}`
    }
  } catch (_) {}
  return config
})

export default api
export { API_URL }
