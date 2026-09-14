import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { env } from './config/env.js';
import { connectDB } from './config/db.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import apiRoutes from './routes/index.js';

const app = express();

// Security middleware
app.use(helmet());

// CORS
app.use(
  cors({
    origin: env.CLIENT_URL,
    credentials: true,
  })
);

// Compression
app.use(compression());

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// API routes
app.use('/api', apiRoutes);

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

// Start server
async function start(): Promise<void> {
  // Connect to MongoDB
  await connectDB();

  app.listen(env.PORT, () => {
    console.log(`
┌─────────────────────────────────────────┐
│                                         │
│   ToolSAP API Server                    │
│   Environment: ${env.NODE_ENV.padEnd(24)}│
│   Port: ${String(env.PORT).padEnd(31)}│
│   URL: http://localhost:${String(env.PORT).padEnd(16)}│
│                                         │
└─────────────────────────────────────────┘
    `);
  });
}

start().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
