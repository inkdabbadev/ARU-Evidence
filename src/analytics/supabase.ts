import { createClient } from '@supabase/supabase-js';
const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
export const configured = Boolean(url && key);
// Separate storage prevents an admin login becoming the visitor identity.
export const visitorClient = configured ? createClient(url, key, { auth: { storageKey: 'case-visitor-auth', detectSessionInUrl: false } }) : null;
export const adminClient = configured ? createClient(url, key, { auth: { storageKey: 'case-admin-auth', detectSessionInUrl: false } }) : null;
