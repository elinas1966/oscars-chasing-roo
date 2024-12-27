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
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { keywords, mode } = await req.json();
    console.log(`Fetching articles for keywords: ${keywords}, mode: ${mode}`);

    let fetchConfigurations;
    if (mode === 'scheduled') {
      // For scheduled jobs, get all active configurations
      const { data: configs, error: configError } = await supabaseClient
        .from('fetch_configurations')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(3); // Get the 3 most recent configurations

      if (configError) throw configError;
      fetchConfigurations = configs;
    } else {
      // For manual fetches, we need to get the configuration that was just created
      const { data: config, error: configError } = await supabaseClient
        .from('fetch_configurations')
        .select('*')
        .eq('keywords', keywords)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      
      if (configError) throw configError;
      fetchConfigurations = [config];
    }

    let totalArticles = 0;
    for (const config of fetchConfigurations) {
      // Clean and validate keywords
      const cleanKeywords = config.keywords
        .trim()
        .replace(/[^\w\s]/g, '') // Remove special characters
        .replace(/\s+/g, ' '); // Replace multiple spaces with single space

      if (!cleanKeywords) {
        console.error('Invalid keywords after cleaning:', config.keywords);
        throw new Error('Invalid keywords provided');
      }

      console.log(`Processing configuration with cleaned keywords: ${cleanKeywords}`);
      
      const queryParams = new URLSearchParams({
        q: cleanKeywords,
        lang: 'en',
        country: 'us',
        max: '10',
        apikey: Deno.env.get('GNEWS_API_KEY') || '',
      });

      const apiUrl = `https://gnews.io/api/v4/search?${queryParams.toString()}`;
      console.log('Calling GNews API with URL:', apiUrl);

      const response = await fetch(apiUrl);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('GNews API error:', errorText);
        throw new Error(`GNews API error: ${response.statusText}. ${errorText}`);
      }

      const data = await response.json();
      console.log(`Found ${data.articles?.length ?? 0} articles for keywords: ${cleanKeywords}`);

      if (!data.articles || !Array.isArray(data.articles)) {
        console.error('Invalid response from GNews:', data);
        throw new Error('Invalid response from GNews API');
      }

      const articles = data.articles.map((article: any) => ({
        title: article.title,
        summary: article.description,
        source: article.source.name,
        url: article.url,
        language: 'EN',
        date: new Date(article.publishedAt).toISOString().split('T')[0],
      }));

      // Record fetch history
      const { error: historyError } = await supabaseClient
        .from('fetch_history')
        .insert({
          configuration_id: config.id,
          articles_count: articles.length,
          status: 'success'
        });

      if (historyError) {
        console.error('Error recording fetch history:', historyError);
        throw historyError;
      }

      // Insert articles
      const { error: insertError } = await supabaseClient
        .from('articles')
        .insert(articles);

      if (insertError) {
        console.error('Error inserting articles:', insertError);
        throw insertError;
      }

      totalArticles += articles.length;
    }

    console.log(`Successfully processed all configurations, total articles: ${totalArticles}`);

    return new Response(
      JSON.stringify({ 
        message: 'Articles fetched and stored successfully',
        count: totalArticles
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