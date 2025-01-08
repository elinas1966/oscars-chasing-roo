import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://intqojhpldgpqffwvuep.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImludHFvamhwbGRncHFmZnd2dWVwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDQ3NDc2MDAsImV4cCI6MjAyMDMyMzYwMH0.GE--C1P40RqFFP8gemxjj8eFmQqDUbADvVhI-KzHgqU';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);