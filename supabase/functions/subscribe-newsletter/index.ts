import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { create } from "https://deno.land/x/djwt@v2.8/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SPREADSHEET_ID = '1RlH5_KfY5XOU7kvqeaFY2sRmPWhshvcH2dCQ5Vci9Bo';

function parseServiceAccountKey(rawKey: string): Record<string, string> {
  let key = rawKey.trim();
  
  // Handle if the JSON was double-stringified or escaped
  if (key.startsWith('"') && key.endsWith('"')) {
    key = key.slice(1, -1);
  }
  
  // Handle escaped newlines and quotes
  key = key.replace(/\\n/g, '\n').replace(/\\"/g, '"');
  
  // If it still starts with a backslash, try parsing as escaped JSON
  if (key.startsWith('\\')) {
    key = key.replace(/\\/g, '');
  }
  
  // Normalize whitespace - replace multiple spaces/newlines with single space
  key = key.replace(/\s+/g, ' ');
  
  console.log('Parsing key, first 50 chars:', key.substring(0, 50));
  
  try {
    return JSON.parse(key);
  } catch (e) {
    console.error('Failed to parse service account key. First 100 chars:', key.substring(0, 100));
    console.error('Parse error:', e);
    throw new Error('Invalid service account key format. Please paste the raw JSON content from your service account file.');
  }
}

async function getAccessToken(serviceAccountKey: string): Promise<string> {
  const credentials = parseServiceAccountKey(serviceAccountKey);
  
  if (!credentials.client_email || !credentials.private_key) {
    throw new Error('Service account key missing client_email or private_key');
  }
  
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iss: credentials.client_email,
    scope: 'https://www.googleapis.com/auth/spreadsheets',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
  };

  // Import the private key
  const pemHeader = "-----BEGIN PRIVATE KEY-----";
  const pemFooter = "-----END PRIVATE KEY-----";
  const pemContents = credentials.private_key
    .replace(pemHeader, "")
    .replace(pemFooter, "")
    .replace(/\n/g, "");
  
  const binaryKey = Uint8Array.from(atob(pemContents), c => c.charCodeAt(0));
  
  const cryptoKey = await crypto.subtle.importKey(
    "pkcs8",
    binaryKey,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const jwt = await create(
    { alg: "RS256", typ: "JWT" },
    payload,
    cryptoKey
  );

  // Exchange JWT for access token
  const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  });

  const tokenData = await tokenResponse.json();
  
  if (!tokenResponse.ok) {
    console.error('Token exchange failed:', tokenData);
    throw new Error('Failed to get access token');
  }

  return tokenData.access_token;
}

async function checkEmailExists(accessToken: string, email: string): Promise<boolean> {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/A:A`;
  
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const errorData = await response.text();
    console.error('Google Sheets API error when checking emails:', errorData);
    throw new Error('Failed to check existing emails');
  }

  const data = await response.json();
  const values = data.values || [];
  
  // Normalize the input email for comparison (lowercase, trimmed)
  const normalizedEmail = email.toLowerCase().trim();
  
  // Check if any existing email matches (case-insensitive)
  for (const row of values) {
    if (row[0] && row[0].toLowerCase().trim() === normalizedEmail) {
      return true;
    }
  }
  
  return false;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email } = await req.json();

    if (!email) {
      return new Response(
        JSON.stringify({ error: 'Email is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const serviceAccountKey = Deno.env.get('GOOGLE_SERVICE_ACCOUNT_KEY');
    if (!serviceAccountKey) {
      console.error('GOOGLE_SERVICE_ACCOUNT_KEY is not set');
      return new Response(
        JSON.stringify({ error: 'Server configuration error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get access token using service account
    const accessToken = await getAccessToken(serviceAccountKey);

    // Check if email already exists in the spreadsheet
    const emailExists = await checkEmailExists(accessToken, email);
    
    if (emailExists) {
      console.log('Email already subscribed:', email);
      return new Response(
        JSON.stringify({ error: 'already_subscribed', message: 'This email is already subscribed to our newsletter.' }),
        { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Append email to Google Sheets
    const timestamp = new Date().toISOString();
    const values = [[email, timestamp]];

    const url = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/A:B:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ values }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Google Sheets API error:', errorData);
      return new Response(
        JSON.stringify({ error: 'Failed to save email to spreadsheet' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Email saved successfully:', email);

    return new Response(
      JSON.stringify({ success: true, message: 'Email saved successfully' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: unknown) {
    console.error('Error in subscribe-newsletter function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
