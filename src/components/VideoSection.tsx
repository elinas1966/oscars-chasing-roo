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
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchLatestVideo = async () => {
      try {
        const { data, error } = await supabase
          .from('videos')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (error) {
          console.error('Error fetching video:', error);
          setIsLoading(false);
          return;
        }

        if (data) {
          setVideo(data);
          const { data: signedUrl, error: urlError } = await supabase.storage
            .from('videos')
            .createSignedUrl(data.file_path, 3600);
          
          if (urlError) {
            console.error('Error getting signed URL:', urlError);
          } else if (signedUrl) {
            setVideoUrl(signedUrl.signedUrl);
          }
        }
      } catch (err) {
        console.error('Unexpected error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLatestVideo();
  }, []);

  if (isLoading) {
    return (
      <section className="max-w-4xl mx-auto px-4 py-12">
        <div className="animate-pulse">
          <div className="h-8 w-64 bg-primary/10 rounded mb-8 mx-auto"></div>
          <div className="aspect-video bg-primary/5 rounded-lg"></div>
        </div>
      </section>
    );
  }

  if (!video || !videoUrl) {
    return (
      <section className="max-w-4xl mx-auto px-4 py-12">
        <div className="text-center text-gray-400">
          <h2 className="font-serif text-3xl md:text-4xl mb-4">No Videos Yet</h2>
          <p>Check back soon for new content</p>
        </div>
      </section>
    );
  }

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