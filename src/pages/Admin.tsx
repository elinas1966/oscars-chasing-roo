import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card } from "@/components/ui/card";

const Admin = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    title: "",
    summary: "",
    source: "",
    url: "",
    language: "EN",
  });

  const { mutate: addArticle, isPending } = useMutation({
    mutationFn: async (articleData: typeof formData) => {
      const { error } = await supabase.from("articles").insert([articleData]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["articles"] });
      toast({
        title: "Success",
        description: "Article added successfully",
      });
      setFormData({
        title: "",
        summary: "",
        source: "",
        url: "",
        language: "EN",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to add article: " + error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addArticle(formData);
  };

  const handleFetchRelated = async () => {
    try {
      const response = await fetch("/api/fetch-related-articles", {
        method: "POST",
      });
      if (!response.ok) throw new Error("Failed to fetch related articles");
      
      toast({
        title: "Success",
        description: "Related articles fetched successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["articles"] });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch related articles",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-serif text-primary">Admin Dashboard</h1>
          <div className="space-x-4">
            <Button variant="outline" onClick={() => navigate("/")}>
              View Site
            </Button>
            <Button onClick={handleFetchRelated}>
              Fetch Related Articles
            </Button>
          </div>
        </div>

        <Card className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Title</label>
              <Input
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Summary</label>
              <Textarea
                value={formData.summary}
                onChange={(e) =>
                  setFormData({ ...formData, summary: e.target.value })
                }
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Source</label>
              <Input
                value={formData.source}
                onChange={(e) =>
                  setFormData({ ...formData, source: e.target.value })
                }
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">URL</label>
              <Input
                type="url"
                value={formData.url}
                onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Language</label>
              <Select
                value={formData.language}
                onValueChange={(value) =>
                  setFormData({ ...formData, language: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select language" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="EN">English</SelectItem>
                  <SelectItem value="ES">Spanish</SelectItem>
                  <SelectItem value="FR">French</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button type="submit" disabled={isPending}>
              {isPending ? "Adding..." : "Add Article"}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default Admin;