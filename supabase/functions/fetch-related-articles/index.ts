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
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    // Example: Fetch news articles about your movie from a news API
    // You would need to replace this with your preferred news API
    const response = await fetch(
      `https://api.example.com/news?q=your-movie-title`,
      {
        headers: {
          'Authorization': `Bearer ${Deno.env.get('NEWS_API_KEY')}`,
        },
      }
    );

    const newsData = await response.json();

    // Process and insert articles
    const articles = newsData.articles.map((article: any) => ({
      title: article.title,
      summary: article.description,
      source: article.source.name,
      url: article.url,
      language: 'EN', // You might want to detect language
      date: new Date(article.publishedAt).toISOString().split('T')[0],
    }));

    // Insert articles into the database
    const { error } = await supabaseClient
      .from('articles')
      .insert(articles);

    if (error) throw error;

    return new Response(
      JSON.stringify({ message: 'Articles fetched and stored successfully' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});