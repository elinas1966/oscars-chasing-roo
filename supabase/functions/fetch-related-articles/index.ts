import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('Fetching articles from GNews...');
    
    // Fetch articles from GNews API
    const response = await fetch(
      `https://gnews.io/api/v4/search?q=movie&lang=en&country=us&max=10&apikey=${Deno.env.get('GNEWS_API_KEY')}`
    );

    if (!response.ok) {
      throw new Error(`GNews API error: ${response.statusText}`);
    }

    const data = await response.json();
    console.log(`Found ${data.articles?.length ?? 0} articles`);

    // Transform and insert articles
    const articles = data.articles.map((article: any) => ({
      title: article.title,
      summary: article.description,
      source: article.source.name,
      url: article.url,
      language: 'EN',
      date: new Date(article.publishedAt).toISOString().split('T')[0],
    }));

    // Insert articles into the database
    const { error } = await supabaseClient
      .from('articles')
      .insert(articles);

    if (error) {
      console.error('Error inserting articles:', error);
      throw error;
    }

    console.log('Articles successfully inserted into database');

    return new Response(
      JSON.stringify({ 
        message: 'Articles fetched and stored successfully',
        count: articles.length 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error in fetch-related-articles:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});