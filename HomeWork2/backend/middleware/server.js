import express from 'express'
import cors from 'cors'
import morgan from 'morgan'
import dotenv from 'dotenv'
import { createProxyMiddleware } from 'http-proxy-middleware'

dotenv.config()

const app = express()

const PORT = process.env.PORT || 9000
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || 'http://localhost:5173'
const GO_SERVICE_URL = process.env.GO_SERVICE_URL || 'http://localhost:8080'
const JAVA_SERVICE_URL = process.env.JAVA_SERVICE_URL || 'http://localhost:8000'
const THIRD_SERVICE_URL = process.env.THIRD_SERVICE_URL || 'http://localhost:7000'

app.use(cors({ origin: FRONTEND_ORIGIN }))
app.use(morgan('dev'))

app.get('/health', (_req, res) => {
  res.json({
    service: 'middleware-gateway',
    status: 'ok',
    upstreams: {
      go: GO_SERVICE_URL,
      java: JAVA_SERVICE_URL,
      third: THIRD_SERVICE_URL,
    },
  })
})

app.use(createProxyMiddleware({
  pathFilter: '/api/auth/login',
  target: GO_SERVICE_URL,
  changeOrigin: true,
  pathRewrite: { '^/api/auth/login': '/login' },
}))

app.use(createProxyMiddleware({
  pathFilter: '/api/auth/register',
  target: GO_SERVICE_URL,
  changeOrigin: true,
  pathRewrite: { '^/api/auth/register': '/register' },
}))

app.use(createProxyMiddleware({
  pathFilter: '/api/users',
  target: GO_SERVICE_URL,
  changeOrigin: true,
  pathRewrite: { '^/api/users': '/users' },
}))

app.use(createProxyMiddleware({
  pathFilter: '/api/music',
  target: JAVA_SERVICE_URL,
  changeOrigin: true,
  pathRewrite: { '^/api/music': '/v1/api' },
}))

app.use(createProxyMiddleware({
  pathFilter: '/api/third',
  target: THIRD_SERVICE_URL,
  changeOrigin: true,
  pathRewrite: { '^/api/third': '' },
}))

app.use((_req, res) => {
  res.status(404).json({ error: 'Route not found on middleware' })
})

app.listen(PORT, () => {
  console.log(`middleware-gateway running on http://localhost:${PORT}`)
})