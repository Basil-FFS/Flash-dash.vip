import bcrypt from 'bcryptjs';
import { createClient } from '@supabase/supabase-js';
import jwt from 'jsonwebtoken';

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

// Helper function to verify JWT token
function verifyToken(authHeader) {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  
  const token = authHeader.substring(7);
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    return null;
  }
}

// Helper function to check if user is admin
function isAdmin(user) {
  return user && user.role === 'admin';
}

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
    const { path, httpMethod, body, headers } = event;
    const data = body ? JSON.parse(body) : {};

    // Verify authentication
    const user = verifyToken(headers.authorization);
    if (!user) {
      return {
        statusCode: 401,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Unauthorized' })
      };
    }

    // Check admin role
    if (!isAdmin(user)) {
      return {
        statusCode: 403,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Admin access required' })
      };
    }

    // Route handling
    if (path.endsWith('/employees') && httpMethod === 'GET') {
      return await getEmployees();
    } else if (path.endsWith('/employees') && httpMethod === 'POST') {
      return await createEmployee(data);
    } else if (path.includes('/employees/') && httpMethod === 'PUT') {
      const id = path.split('/employees/')[1];
      return await updateEmployee(id, data);
    } else if (path.includes('/employees/') && httpMethod === 'DELETE') {
      const id = path.split('/employees/')[1];
      return await deleteEmployee(id);
    } else if (path.includes('/reset-password') && httpMethod === 'PUT') {
      const id = path.split('/employees/')[1];
      return await resetPassword(id, data);
    } else {
      return {
        statusCode: 404,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Route not found' })
      };
    }
  } catch (error) {
    console.error('Admin function error:', error);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
}

async function getEmployees() {
  try {
    const { data, error } = await supabase
      .from('employees')
      .select('id,email,role,agentName,firstName,lastName,active,created_at,updated_at')
      .order('created_at', { ascending: false });

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
      body: JSON.stringify({ employees: data })
    };
  } catch (error) {
    console.error('Get employees error:', error);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
}

async function createEmployee(data) {
  try {
    const { email, password, role = 'agent', agentName, firstName, lastName } = data || {};
    if (!email || !password) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Email and password required' })
      };
    }

    const password_hash = await bcrypt.hash(password, 12);
    const { data: employee, error } = await supabase
      .from('employees')
      .insert({ 
        email, 
        role, 
        password_hash, 
        agentName, 
        firstName, 
        lastName, 
        active: true 
      })
      .select('id,email,role,agentName,firstName,lastName,active')
      .single();

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
      body: JSON.stringify({ employee })
    };
  } catch (error) {
    console.error('Create employee error:', error);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
}

async function updateEmployee(id, data) {
  try {
    const { email, role, agentName, firstName, lastName, password } = data || {};
    const updates = {};

    // Validate email format if provided
    if (email !== undefined) {
      if (email && !email.includes('@')) {
        return {
          statusCode: 400,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'Invalid email format' })
        };
      }
      updates.email = email;
    }

    // Validate role if provided
    if (role !== undefined) {
      if (role && !['admin', 'agent'].includes(role)) {
        return {
          statusCode: 400,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'Invalid role. Must be "admin" or "agent"' })
        };
      }
      updates.role = role;
    }

    // Handle name fields (allow empty strings)
    if (agentName !== undefined) updates.agentName = agentName || '';
    if (firstName !== undefined) updates.firstName = firstName || '';
    if (lastName !== undefined) updates.lastName = lastName || '';

    // Only hash password if it's provided
    if (password) {
      if (password.length < 6) {
        return {
          statusCode: 400,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'Password must be at least 6 characters' })
        };
      }
      updates.password_hash = await bcrypt.hash(password, 12);
    }

    const { data: employee, error } = await supabase
      .from('employees')
      .update(updates)
      .eq('id', id)
      .select('id,email,role,agentName,firstName,lastName,active')
      .single();

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
      body: JSON.stringify({ employee })
    };
  } catch (error) {
    console.error('Update employee error:', error);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
}

async function deleteEmployee(id) {
  try {
    const { error } = await supabase
      .from('employees')
      .delete()
      .eq('id', id);

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
      body: JSON.stringify({ message: 'Employee deleted successfully' })
    };
  } catch (error) {
    console.error('Delete employee error:', error);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
}

async function resetPassword(id, data) {
  try {
    const { newPassword } = data || {};
    if (!newPassword || newPassword.length < 6) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Password must be at least 6 characters' })
      };
    }

    const password_hash = await bcrypt.hash(newPassword, 12);
    const { error } = await supabase
      .from('employees')
      .update({ password_hash })
      .eq('id', id);

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
      body: JSON.stringify({ message: 'Password reset successfully' })
    };
  } catch (error) {
    console.error('Reset password error:', error);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
}
