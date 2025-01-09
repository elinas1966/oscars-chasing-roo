import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { videoBlob, title, articleId, startTime, duration } = await req.json()

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Convert base64 to Blob
    const binaryString = atob(videoBlob.split(',')[1]);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    const blob = new Blob([bytes], { type: 'video/webm' });

    // Generate unique filename
    const fileName = `${crypto.randomUUID()}.webm`

    // Upload to storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('video-clips')
      .upload(fileName, blob, {
        contentType: 'video/webm',
        upsert: false
      })

    if (uploadError) {
      console.error('Upload error:', uploadError)
      throw new Error('Failed to upload video clip')
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('video-clips')
      .getPublicUrl(fileName)

    // Save to database
    const { data: clipData, error: dbError } = await supabase
      .from('video_clips')
      .insert({
        title,
        file_path: fileName,
        article_id: articleId,
        start_time: startTime,
        duration: duration
      })
      .select()
      .single()

    if (dbError) {
      console.error('Database error:', dbError)
      throw new Error('Failed to save video clip metadata')
    }

    return new Response(
      JSON.stringify({ 
        message: 'Video clip created successfully',
        clipId: clipData.id,
        url: publicUrl
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        }
      }
    )
  } catch (error) {
    console.error('Error creating video clip:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Failed to create video clip',
        details: error.message 
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        },
        status: 500 
      }
    )
  }
})