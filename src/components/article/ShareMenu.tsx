import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Share2,
  Twitter,
  Facebook,
  Linkedin,
  Mail,
  Copy,
  Video
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

interface ShareMenuProps {
  articleTitle: string;
  articleUrl: string;
}

export const ShareMenu = ({ articleTitle, articleUrl }: ShareMenuProps) => {
  const { toast } = useToast();

  const handleShare = async (platform: string) => {
    const shareUrl = articleUrl;
    const shareText = `Check out this article: ${articleTitle}`;
    const videoElement = document.querySelector('video') as HTMLVideoElement;
    
    let shareLink = '';
    
    switch (platform) {
      case 'video':
        if (videoElement) {
          try {
            const startTime = Math.max(0, videoElement.currentTime - 5);
            const mediaRecorder = new MediaRecorder(videoElement.captureStream());
            const chunks: BlobPart[] = [];
            
            mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
            mediaRecorder.onstop = async () => {
              const blob = new Blob(chunks, { type: 'video/webm' });
              const url = URL.createObjectURL(blob);
              
              const a = document.createElement('a');
              a.href = url;
              a.download = 'video-clip.webm';
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
              URL.revokeObjectURL(url);
              
              toast({
                title: "Video clip created!",
                description: "The video clip has been downloaded to your device.",
              });
            };
            
            videoElement.currentTime = startTime;
            mediaRecorder.start();
            
            setTimeout(() => {
              mediaRecorder.stop();
            }, 10000);
            
          } catch (err) {
            console.error('Failed to create video clip:', err);
            toast({
              title: "Error",
              description: "Failed to create video clip. Please try again.",
              variant: "destructive",
            });
          }
        } else {
          toast({
            title: "Error",
            description: "No video found on the page.",
            variant: "destructive",
          });
        }
        return;
      case 'twitter':
        shareLink = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
        break;
      case 'facebook':
        shareLink = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
        break;
      case 'linkedin':
        shareLink = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`;
        break;
      case 'email':
        shareLink = `mailto:?subject=${encodeURIComponent(articleTitle)}&body=${encodeURIComponent(`${shareText}\n\n${shareUrl}`)}`;
        break;
      case 'copy':
        try {
          await navigator.clipboard.writeText(shareUrl);
          toast({
            title: "Link copied!",
            description: "The article link has been copied to your clipboard.",
          });
          return;
        } catch (err) {
          console.error('Failed to copy:', err);
          toast({
            title: "Copy failed",
            description: "Failed to copy the link to clipboard.",
            variant: "destructive",
          });
          return;
        }
    }
    
    if (shareLink) {
      window.open(shareLink, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="text-primary hover:text-primary/80">
          <Share2 className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="bg-secondary/95 backdrop-blur-sm border-primary/10">
        <DropdownMenuItem onClick={() => handleShare('video')} className="gap-2 cursor-pointer">
          <Video className="h-4 w-4" /> Share Video Clip
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleShare('twitter')} className="gap-2 cursor-pointer">
          <Twitter className="h-4 w-4" /> Share on X
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleShare('facebook')} className="gap-2 cursor-pointer">
          <Facebook className="h-4 w-4" /> Share on Facebook
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleShare('linkedin')} className="gap-2 cursor-pointer">
          <Linkedin className="h-4 w-4" /> Share on LinkedIn
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleShare('email')} className="gap-2 cursor-pointer">
          <Mail className="h-4 w-4" /> Share via Email
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleShare('copy')} className="gap-2 cursor-pointer">
          <Copy className="h-4 w-4" /> Copy Link
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};