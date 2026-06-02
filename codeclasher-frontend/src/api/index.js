import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
})

// Attach JWT token to every request
api.interceptors.request.use(config => {
  const token = localStorage.getItem('access_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Auto-refresh on 401
api.interceptors.response.use(
  res => res,
  async err => {
    const original = err.config
    if (err.response?.status === 401 && !original._retry) {
      original._retry = true
      try {
        const refresh = localStorage.getItem('refresh_token')
        const { data } = await axios.post('/api/auth/refresh/', { refresh })
        localStorage.setItem('access_token', data.access)
        original.headers.Authorization = `Bearer ${data.access}`
        return api(original)
      } catch {
        localStorage.clear()
        window.location.href = '/login'
      }
    }
    return Promise.reject(err)
  }
)

// ─── Auth ──────────────────────────────────────────────────────────
export const authAPI = {
  login:    (credentials) => api.post('/auth/login/', credentials),
  register: (data) => api.post('/users/register/', data),
  refresh:  (token) => api.post('/auth/refresh/', { refresh: token }),
}

// ─── Users ─────────────────────────────────────────────────────────
export const usersAPI = {
  me:          () => api.get('/users/profiles/me/'),
  updateMe:    (data) => api.patch('/users/profiles/me/', data),
  leaderboard: () => api.get('/users/profiles/leaderboard/'),
  getProfile:  (id) => api.get(`/users/profiles/${id}/`),
}

// ─── Problems ──────────────────────────────────────────────────────
export const problemsAPI = {
  list:   (params) => api.get('/problems/', { params }),
  detail: (slug) => api.get(`/problems/${slug}/`),
  run:    (slug, data) => api.post(`/problems/${slug}/run/`, data),
}

// ─── Battles ───────────────────────────────────────────────────────
export const battlesAPI = {
  joinQueue:   (mode) => api.post('/battles/queue/join/', { mode }),
  leaveQueue:  () => api.post('/battles/queue/leave/'),
  queueStatus: () => api.get('/battles/queue/status/'),
  createRoom:  (data) => api.post('/battles/create-room/', data),
  joinRoom:    (room_code) => api.post('/battles/join-room/', { room_code }),
  getRoom:     (room_code) => api.get(`/battles/room/${room_code}/`),
  submit:      (room_code, data) => api.post(`/battles/room/${room_code}/submit/`, data),
  forfeit:     (room_code) => api.post(`/battles/room/${room_code}/forfeit/`),
  myBattles:   () => api.get('/battles/'),
  leaveRoom:   (room_code) => api.post(`/battles/room/${room_code}/leave/`),
}

export default api
