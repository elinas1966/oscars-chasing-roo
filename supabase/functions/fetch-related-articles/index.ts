import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { DOMParser } from "https://deno.land/x/deno_dom@v0.1.38/deno-dom-wasm.ts";

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

    const { keywords } = await req.json();
    console.log(`Fetching articles for keywords: ${keywords}`);

    // Clean and validate keywords
    const cleanKeywords = keywords
      .trim()
      .replace(/[^\w\s]/g, '') // Remove special characters
      .replace(/\s+/g, ' '); // Replace multiple spaces with single space

    if (!cleanKeywords) {
      console.error('Invalid keywords after cleaning:', keywords);
      throw new Error('Invalid keywords provided');
    }

    // Get the configuration that was just created
    const { data: config, error: configError } = await supabaseClient
      .from('fetch_configurations')
      .select('*')
      .eq('keywords', keywords)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    
    if (configError) throw configError;

    // Construct Google Search URL
    const searchUrl = `https://www.googleapis.com/customsearch/v1?key=${Deno.env.get('GOOGLE_API_KEY')}&cx=${Deno.env.get('GOOGLE_SEARCH_ENGINE_ID')}&q=${encodeURIComponent(cleanKeywords)}&num=10`;
    
    console.log('Making Google Search API request');
    const searchResponse = await fetch(searchUrl);
    const searchData = await searchResponse.json();

    if (!searchResponse.ok) {
      console.error('Google Search API error:', searchData);
      throw new Error(`Google Search API error: ${searchResponse.statusText}`);
    }

    const articles = [];
    let successfulScrapes = 0;

    for (const item of searchData.items || []) {
      try {
        console.log(`Scraping URL: ${item.link}`);
        const response = await fetch(item.link);
        const html = await response.text();
        
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        
        if (!doc) {
          console.log(`Failed to parse HTML for ${item.link}`);
          continue;
        }

        // Extract meta description or first paragraph
        let summary = '';
        const metaDesc = doc.querySelector('meta[name="description"]');
        if (metaDesc && metaDesc.getAttribute('content')) {
          summary = metaDesc.getAttribute('content');
        } else {
          const firstParagraph = doc.querySelector('p');
          if (firstParagraph) {
            summary = firstParagraph.textContent;
          }
        }

        // Clean and truncate summary
        summary = summary.trim();
        if (summary.length > 500) {
          summary = summary.substring(0, 497) + '...';
        }

        if (summary) {
          articles.push({
            title: item.title,
            summary,
            source: new URL(item.link).hostname,
            url: item.link,
            language: 'EN',
            date: new Date().toISOString().split('T')[0],
          });
          successfulScrapes++;
        }
      } catch (error) {
        console.error(`Error scraping ${item.link}:`, error);
        continue;
      }
    }

    // Record fetch history
    const { error: historyError } = await supabaseClient
      .from('fetch_history')
      .insert({
        configuration_id: config.id,
        articles_count: successfulScrapes,
        status: 'success'
      });

    if (historyError) {
      console.error('Error recording fetch history:', historyError);
      throw historyError;
    }

    // Insert articles
    if (articles.length > 0) {
      const { error: insertError } = await supabaseClient
        .from('articles')
        .insert(articles);

      if (insertError) {
        console.error('Error inserting articles:', insertError);
        throw insertError;
      }
    }

    console.log(`Successfully scraped ${successfulScrapes} articles`);

    return new Response(
      JSON.stringify({ 
        message: 'Articles fetched and stored successfully',
        count: successfulScrapes
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