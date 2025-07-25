import { useState, useEffect, useCallback } from 'react';
import { edamamAPI } from '@/services/api';
import { useToast } from '@/hooks/use-toast';

export interface EdamamFoodItem {
  food_id: string;
  label: string;
  brand?: string;
  category?: string;
  category_label?: string;
}

interface UseEdamamAutocompleteOptions {
  limit?: number;
  debounceMs?: number;
  minQueryLength?: number;
}

export const useEdamamAutocomplete = (options: UseEdamamAutocompleteOptions = {}) => {
  const {
    limit = 10,
    debounceMs = 300,
    minQueryLength = 2
  } = options;

  const [suggestions, setSuggestions] = useState<EdamamFoodItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Debounced search function
  const debouncedSearch = useCallback(
    debounce(async (query: string) => {
      if (query.length < minQueryLength) {
        setSuggestions([]);
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);
        
        const response = await edamamAPI.food.autocomplete(query, limit);
        
        console.log('API Response:', response.data);
        
        if (response.data?.hints) {
          // Transform hints to match EdamamFoodItem interface
          const transformedSuggestions = response.data.hints.map((hint: any) => ({
            food_id: hint.food?.foodId || '',
            label: hint.food?.label || '',
            brand: hint.food?.brand || undefined,
            category: hint.food?.category || undefined,
            category_label: hint.food?.categoryLabel || undefined
          }));
          setSuggestions(transformedSuggestions);
        } else {
          setSuggestions([]);
        }
      } catch (err: any) {
        console.error('Edamam autocomplete error:', err);
        setError(err.response?.data?.message || 'Failed to fetch suggestions');
        setSuggestions([]);
        
        // Show error toast for user feedback
        toast({
          title: "Search Error",
          description: "Unable to fetch food suggestions. Please try again.",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    }, debounceMs),
    [limit, minQueryLength, debounceMs, toast]
  );

  const search = useCallback((query: string) => {
    console.log('useEdamamAutocomplete search called with:', query);
    if (!query.trim()) {
      console.log('Empty query, clearing suggestions');
      setSuggestions([]);
      setIsLoading(false);
      setError(null);
      return;
    }

    console.log('Setting loading to true and calling debouncedSearch');
    setIsLoading(true);
    debouncedSearch(query);
  }, [debouncedSearch]);

  const clearSuggestions = useCallback(() => {
    setSuggestions([]);
    setError(null);
  }, []);

  return {
    suggestions,
    isLoading,
    error,
    search,
    clearSuggestions
  };
};

// Debounce utility function
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

export default useEdamamAutocomplete;