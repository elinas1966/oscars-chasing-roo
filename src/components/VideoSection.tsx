import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface Video {
  id: string;
  title: string;
  file_path: string;
}

export const VideoSection = () => {
  const [video, setVideo] = useState<Video | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const videoUrl = "https://intqojhpldgpqffwvuep.supabase.co/storage/v1/object/public/videos/Home%20%20ROO.mp4?t=2024-12-28T21%3A40%3A53.759Z";

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

  return (
    <section className="max-w-4xl mx-auto px-4 py-12">
      <h2 className="font-serif text-3xl md:text-4xl text-primary mb-6 text-center">
        {video?.title || "Chasing Roo"}
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