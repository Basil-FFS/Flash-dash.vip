import axios from 'axios';
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

// Helper: sanitize incoming payload (basic trimming)
function sanitizePayload(payload) {
  const clean = {};
  for (const [key, val] of Object.entries(payload)) {
    if (typeof val === 'string') {
      clean[key] = val.trim();
    } else {
      clean[key] = val;
    }
  }
  return clean;
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
    const { path, httpMethod, body } = event;

    // Route handling
    if (path.endsWith('/submit-lead') && httpMethod === 'POST') {
      return await submitLead(body);
    } else {
      return {
        statusCode: 404,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Route not found' })
      };
    }
  } catch (error) {
    console.error('Submissions function error:', error);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
}

async function submitLead(body) {
  try {
    // 1. Parse and sanitize input
    const payload = sanitizePayload(JSON.parse(body));

    // 2. Required fields per ForthCRM docs
    const required = [
      'Fname', 'Lname', 'phone', 'email',
      'address', 'city', 'state', 'zip',
      'DOB', 'SSN', 'monthly_income', 'total_unsecured_debt'
    ];

    const missing = required.filter(f => !payload[f]);
    if (missing.length > 0) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({
          error: `Missing required fields: ${missing.join(', ')}`,
          received: payload
        })
      };
    }

    // 3. Prepare data for ForthCRM (x-www-form-urlencoded)
    const formData = new URLSearchParams();
    for (const [key, val] of Object.entries(payload)) {
      formData.append(key, val);
    }

    console.log("➡️ Submitting lead to Forth:", formData.toString());

    // 4. Send to ForthCRM
    const forthUrl = process.env.FORTH_CRM_URL;
    if (!forthUrl) {
      return {
        statusCode: 500,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'FORTH_CRM_URL not configured' })
      };
    }

    const response = await axios.post(
      forthUrl,
      formData,
      {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        timeout: 15000
      }
    );

    console.log("✅ Forth response:", response.data);

    // 5. Save success in Supabase
    await supabase.from('submissions').insert({
      employee_id: null, // or pass user.id if auth is implemented
      payload,
      forth_status: 'success',
      forth_response: response.data
    });

    // 6. Return response to frontend
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({ ok: true, forth_response: response.data })
    };

  } catch (err) {
    console.error("❌ Forth error:", err.response?.data || err.message);

    // Save failure to Supabase
    try {
      await supabase.from('submissions').insert({
        employee_id: null,
        payload: JSON.parse(body),
        forth_status: 'error',
        forth_response: err.response?.data || err.message
      });
    } catch (dbError) {
      console.error("Failed to save error to database:", dbError);
    }

    return {
      statusCode: 502,
      headers: corsHeaders,
      body: JSON.stringify({
        error: 'Failed to submit to Forth',
        details: err.response?.data || err.message
      })
    };
  }
}
