import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Helper function to handle CORS
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
};

export async function handler(event, context) {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: ''
    };
  }

  try {
    const { path, httpMethod, body } = event;
    const data = body ? JSON.parse(body) : {};

    // Route handling
    if (path.endsWith('/login') && httpMethod === 'POST') {
      return await handleLogin(data);
    } else if (path.endsWith('/seed') && httpMethod === 'POST') {
      return await handleSeed(data);
    } else {
      return {
        statusCode: 404,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Route not found' })
      };
    }
  } catch (error) {
    console.error('Auth function error:', error);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
}

async function handleLogin(data) {
  try {
    const { email, password } = data || {};
    if (!email || !password) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Email and password required' })
      };
    }

    // Supabase query
    const { data: userData, error } = await supabase
      .from('employees')
      .select('id,email,password_hash,role,active')
      .eq('email', email)
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return {
        statusCode: 401,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Invalid credentials' })
      };
    }

    if (!userData) {
      return {
        statusCode: 401,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Invalid credentials' })
      };
    }

    if (!userData.active) {
      return {
        statusCode: 403,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Account disabled' })
      };
    }

    // Compare password
    const ok = await bcrypt.compare(password, userData.password_hash);
    if (!ok) {
      return {
        statusCode: 401,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Invalid credentials' })
      };
    }

    // JWT secret check
    if (!process.env.JWT_SECRET) {
      console.error('JWT_SECRET not set!');
      return {
        statusCode: 500,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Server misconfiguration' })
      };
    }

    const token = jwt.sign(
      { id: userData.id, email: userData.email, role: userData.role },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({ 
        token, 
        user: { 
          id: userData.id, 
          email: userData.email, 
          role: userData.role 
        } 
      })
    };
  } catch (err) {
    console.error('Login error:', err);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
}

async function handleSeed(data) {
  try {
    if (process.env.NODE_ENV === 'production' || process.env.ENABLE_DEV_SEED !== 'true') {
      return {
        statusCode: 403,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Seed disabled' })
      };
    }

    // Get credentials from environment variables for security
    const email = process.env.SEED_EMAIL;
    const password = process.env.SEED_PASSWORD;
    
    if (!email || !password) {
      return {
        statusCode: 500,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Seed credentials not configured' })
      };
    }

    const hash = await bcrypt.hash(password, 12);
    
    const { error } = await supabase.from('employees').insert({
      email,
      password_hash: hash,
      role: 'admin',
      active: true
    });

    if (error) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: error.message })
      };
    }

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({ ok: true })
    };
  } catch (err) {
    console.error('Seed error:', err);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
}
