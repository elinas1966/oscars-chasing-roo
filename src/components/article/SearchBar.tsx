
import React, { useState } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, X } from "lucide-react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Article } from "@/utils/articleUtils";

interface SearchBarProps {
  articles: Article[];
  onSearch: (term: string) => void;
}

export const SearchBar = ({ articles = [], onSearch }: SearchBarProps) => {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");

  const handleSelect = (selectedValue: string) => {
    setValue(selectedValue);
    onSearch(selectedValue);
    setOpen(false);
  };

  const handleClear = () => {
    setValue("");
    onSearch("");
  };

  // Make sure we have valid articles before trying to extract titles
  const safeArticles = Array.isArray(articles) ? articles : [];
  
  // Generate search suggestions only if we have a value and articles
  let searchSuggestions: string[] = [];
  
  // Only try to create suggestions if we have a search value and articles
  if (value.length > 0 && safeArticles.length > 0) {
    try {
      // Filter articles safely - make sure we handle all potential undefined values
      const filteredArticles = safeArticles.filter(article => 
        article && 
        typeof article === 'object' && 
        article.title && 
        typeof article.title === 'string' &&
        article.title.toLowerCase().includes(value.toLowerCase())
      );
      
      // Get unique titles only if we have valid filtered articles
      if (filteredArticles && filteredArticles.length > 0) {
        const uniqueTitles = new Set(
          filteredArticles.map(article => article.title.toLowerCase())
        );
        
        // Convert to array and limit to 5 results
        if (uniqueTitles.size > 0) {
          searchSuggestions = Array.from(uniqueTitles).slice(0, 5);
        }
      }
    } catch (error) {
      console.error("Error creating search suggestions:", error);
      searchSuggestions = [];
    }
  }

  // Only show suggestions if we have any
  const showSuggestions = open && value.length > 0 && searchSuggestions.length > 0;

  return (
    <div className="relative flex items-center gap-2 w-full max-w-sm">
      <Popover open={showSuggestions} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <div className="flex-1 flex items-center">
            <Input
              placeholder="Search articles..."
              value={value}
              onChange={(e) => {
                setValue(e.target.value);
                onSearch(e.target.value);
              }}
              className="w-full"
            />
          </div>
        </PopoverTrigger>
        {showSuggestions && (
          <PopoverContent className="w-full p-0" align="start">
            {searchSuggestions.length > 0 && (
              <Command>
                <CommandGroup>
                  {searchSuggestions.map((suggestion, index) => (
                    <CommandItem
                      key={`${suggestion}-${index}`}
                      onSelect={() => handleSelect(suggestion)}
                    >
                      <Search className="mr-2 h-4 w-4" />
                      {suggestion}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </Command>
            )}
          </PopoverContent>
        )}
      </Popover>
      {value && (
        <Button
          variant="ghost"
          size="icon"
          onClick={handleClear}
          className="shrink-0"
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
};
