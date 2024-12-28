import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface Video {
  id: string;
  title: string;
  file_path: string;
}

export const VideoSection = () => {
  const [video, setVideo] = useState<Video | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);

  useEffect(() => {
    const fetchLatestVideo = async () => {
      const { data, error } = await supabase
        .from('videos')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error) {
        console.error('Error fetching video:', error);
        return;
      }

      if (data) {
        setVideo(data);
        const { data: signedUrl } = await supabase.storage
          .from('videos')
          .createSignedUrl(data.file_path, 3600);
        
        if (signedUrl) {
          setVideoUrl(signedUrl.signedUrl);
        }
      }
    };

    fetchLatestVideo();
  }, []);

  if (!video || !videoUrl) return null;

  return (
    <section className="max-w-4xl mx-auto px-4 py-12">
      <h2 className="font-serif text-3xl md:text-4xl text-primary mb-8 text-center">
        {video.title}
      </h2>
      <div className="relative w-full aspect-video rounded-lg overflow-hidden shadow-lg shadow-primary/10">
        <video
          className="w-full h-full object-cover"
          controls
          preload="metadata"
          src={videoUrl}
        >
          Your browser does not support the video tag.
        </video>
      </div>
    </section>
  );
};