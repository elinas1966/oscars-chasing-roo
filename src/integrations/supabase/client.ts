import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://intqojhpldgpqffwvuep.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImludHFvamhwbGRncHFmZnd2dWVwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzUzMTU0NTYsImV4cCI6MjA1MDg5MTQ1Nn0.lRak6og1_okKAcpo4YHAjzJnzwVjsDRVQWY82cgtNEs';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);