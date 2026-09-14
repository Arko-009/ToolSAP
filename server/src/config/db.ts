import mongoose from 'mongoose';
import { env } from './env.js';

export async function connectDB(): Promise<void> {
  try {
    await mongoose.connect(env.MONGODB_URI);
    console.log(`✓ MongoDB connected: ${mongoose.connection.host}`);
  } catch (error) {
    console.error('✗ MongoDB connection error:', error);
    // Don't exit process — allow the app to run without DB in development
    if (env.NODE_ENV === 'production') {
      process.exit(1);
    } else {
      console.warn('⚠ Running without database connection in development mode');
    }
  }
}

mongoose.connection.on('disconnected', () => {
  console.warn('⚠ MongoDB disconnected');
});

mongoose.connection.on('error', (err) => {
  console.error('✗ MongoDB error:', err);
});
