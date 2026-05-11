// lib/metrics.ts
import client from 'prom-client'

const register = new client.Registry()
client.collectDefaultMetrics({ register })

export const httpRequestsTotal = new client.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'path', 'status'],
  registers: [register],
})

export const httpRequestDuration = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'HTTP request duration in seconds',
  labelNames: ['method', 'path'],
  registers: [register],
})

export const totalUsersGauge = new client.Gauge({
  name: 'bookflow_users_total',
  help: 'Total number of registered users',
  registers: [register],
})

export const totalAppointmentsGauge = new client.Gauge({
  name: 'bookflow_appointments_total',
  help: 'Total number of appointments',
  registers: [register],
})

export const pendingAppointmentsGauge = new client.Gauge({
  name: 'bookflow_appointments_pending',
  help: 'Number of pending appointments',
  registers: [register],
})

export const chatbotRequestsTotal = new client.Counter({
  name: 'bookflow_chatbot_requests_total',
  help: 'Total chatbot API requests',
  labelNames: ['source'],
  registers: [register],
})

export { register }