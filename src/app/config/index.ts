import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env') });

export default {
  node_env: process.env.NODE_ENV || 'development',
  port: process.env.PORT ? parseInt(process.env.PORT, 10) : 5000,
  database_url: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/postgres?schema=public',
  
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT ? parseInt(process.env.REDIS_PORT, 10) : 6379,
    password: process.env.REDIS_PASSWORD || undefined,
    url: process.env.REDIS_URL || 'redis://localhost:6379',
  },

  jwt: {
    access_secret: process.env.JWT_ACCESS_SECRET || 'shunno_academy_super_secret_access_jwt_key_2026',
    access_expires_in: process.env.JWT_ACCESS_EXPIRES_IN || '7d',
    refresh_secret: process.env.JWT_REFRESH_SECRET || 'shunno_academy_super_secret_refresh_jwt_key_2026',
    refresh_expires_in: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
  },

  salt_rounds: process.env.SALT_ROUNDS ? parseInt(process.env.SALT_ROUNDS, 10) : 12,

  admin: {
    name: process.env.ADMIN_NAME || 'Shunno Admin',
    email: process.env.ADMIN_EMAIL || 'nfoshunnoacademy@gmail.com',
    password: process.env.ADMIN_PASSWORD || 'AdminPassword123!',
    phone: process.env.ADMIN_PHONE || '01704293125',
  },

  cloudinary: {
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'demo',
    api_key: process.env.CLOUDINARY_API_KEY || '123456789012345',
    api_secret: process.env.CLOUDINARY_API_SECRET || 'abcdefghijklmnopqrstuvwxyz',
    folder: process.env.CLOUDINARY_FOLDER || 'shunno-academy',
  },

  client_url: process.env.CLIENT_URL || 'http://localhost:3000',
  server_url: process.env.SERVER_URL || process.env.RENDER_EXTERNAL_URL || '',
  host_on: process.env.HOST_ON || '',

  google: {
    client_id: process.env.GOOGLE_CLIENT_ID || '',
  },

  turnstile: {
    secret_key: process.env.TURNSTILE_SECRET_KEY || '',
  },

  email: {
    smtp_host: (process.env.SMTP_HOST || 'smtp.gmail.com').replace(/^["']|["']$/g, '').trim(),
    smtp_port: process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT.replace(/^["']|["']$/g, '').trim(), 10) : 587,
    smtp_secure: process.env.SMTP_SECURE === 'true',
    smtp_user: (process.env.SMTP_USER || '').replace(/^["']|["']$/g, '').trim(),
    smtp_pass: (process.env.SMTP_PASS || '').replace(/^["']|["']$/g, '').replace(/\s+/g, '').trim(),
    from_name: (process.env.SMTP_FROM_NAME || 'Shunno Academy').replace(/^["']|["']$/g, '').trim(),
    from_email: (process.env.SMTP_FROM_EMAIL || 'shunnoacademy0@gmail.com').replace(/^["']|["']$/g, '').trim(),
    resend_api_key: (process.env.RESEND_API_KEY || '').replace(/^["']|["']$/g, '').trim(),
  },
};
