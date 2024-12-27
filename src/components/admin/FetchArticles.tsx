import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

const FetchArticles = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [keywords, setKeywords] = useState("");
  const [isFetching, setIsFetching] = useState(false);
  const [fetchDetails, setFetchDetails] = useState<{
    totalArticles?: number;
    gnewsArticles?: number;
    googleArticles?: number;
  }>({});

  const { data: fetchConfigurations, isLoading: isLoadingConfigs } = useQuery({
    queryKey: ["fetchConfigurations"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("fetch_configurations")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  const { data: fetchHistory, isLoading: isLoadingHistory } = useQuery({
    queryKey: ["fetchHistory"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("fetch_history")
        .select(`
          *,
          fetch_configurations (keywords)
        `)
        .order("created_at", { ascending: false })
        .limit(10);
      
      if (error) throw error;
      return data;
    },
  });

  const { mutate: saveFetchConfiguration } = useMutation({
    mutationFn: async (keywords: string) => {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!user) throw new Error("No authenticated user");

      const { error } = await supabase
        .from("fetch_configurations")
        .insert([{ 
          keywords,
          created_by: user.id
        }]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fetchConfigurations"] });
    },
    onError: (error) => {
      console.error('Error saving fetch configuration:', error);
      toast({
        title: "Error",
        description: "Failed to save fetch configuration: " + error.message,
        variant: "destructive",
      });
    },
  });

  const handleFetchRelated = async () => {
    try {
      setIsFetching(true);
      setFetchDetails({});
      await saveFetchConfiguration(keywords);
      
      const { data, error } = await supabase.functions.invoke('fetch-related-articles', {
        body: { keywords },
      });
      
      if (error) throw error;

      // Parse the detailed fetch results
      setFetchDetails({
        totalArticles: data.count,
        gnewsArticles: data.gnewsCount || 0,
        googleArticles: data.googleCount || 0
      });

      toast({
        title: "Success",
        description: `Successfully fetched ${data.count} related articles (GNews: ${data.gnewsCount || 0}, Google: ${data.googleCount || 0})`,
      });
      
      queryClient.invalidateQueries({ queryKey: ["articles"] });
      queryClient.invalidateQueries({ queryKey: ["fetchHistory"] });
      setKeywords("");
    } catch (error) {
      console.error('Error fetching related articles:', error);
      toast({
        title: "Error",
        description: "Failed to fetch related articles: " + error.message,
        variant: "destructive",
      });
    } finally {
      setIsFetching(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Fetch Articles</h2>
        <div className="flex gap-4 mb-4">
          <Input
            placeholder="Enter keywords for article fetch"
            value={keywords}
            onChange={(e) => setKeywords(e.target.value)}
          />
          <Button 
            onClick={handleFetchRelated}
            disabled={isFetching || !keywords.trim()}
          >
            {isFetching ? "Fetching..." : "Fetch Articles"}
          </Button>
        </div>
        
        {/* Fetch Details */}
        {isFetching ? (
          <div className="mt-4 space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        ) : fetchDetails.totalArticles !== undefined ? (
          <div className="mt-4 bg-secondary/10 p-3 rounded-md">
            <p className="font-medium">Fetch Results:</p>
            <div className="grid grid-cols-3 gap-2 mt-2">
              <div className="bg-background p-2 rounded-md text-center">
                <p className="text-sm text-muted-foreground">Total Articles</p>
                <p className="font-bold">{fetchDetails.totalArticles}</p>
              </div>
              <div className="bg-background p-2 rounded-md text-center">
                <p className="text-sm text-muted-foreground">GNews</p>
                <p className="font-bold">{fetchDetails.gnewsArticles}</p>
              </div>
              <div className="bg-background p-2 rounded-md text-center">
                <p className="text-sm text-muted-foreground">Google Search</p>
                <p className="font-bold">{fetchDetails.googleArticles}</p>
              </div>
            </div>
          </div>
        ) : null}
      </Card>

      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Fetch History</h2>
        {isLoadingHistory ? (
          <p>Loading history...</p>
        ) : (
          <div className="space-y-4">
            {fetchHistory?.map((entry) => (
              <div key={entry.id} className="border-b pb-2">
                <p className="font-medium">Keywords: {entry.fetch_configurations.keywords}</p>
                <p>Articles fetched: {entry.articles_count}</p>
                <p>Status: {entry.status}</p>
                <p className="text-sm text-gray-500">
                  {new Date(entry.created_at).toLocaleString()}
                </p>
                {entry.error && (
                  <p className="text-red-500 text-sm">{entry.error}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};

export default FetchArticles;