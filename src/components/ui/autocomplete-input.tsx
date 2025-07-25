import React, { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Input } from './input';
import { Button } from './button';
import { ChevronDown, X, Search } from 'lucide-react';

export interface AutocompleteOption {
  value: string;
  label: string;
  description?: string;
}

interface AutocompleteInputProps {
  value?: string;
  onChange?: (value: string) => void;
  onSelect?: (option: AutocompleteOption) => void;
  options?: AutocompleteOption[];
  placeholder?: string;
  disabled?: boolean;
  loading?: boolean;
  className?: string;
  inputClassName?: string;
  dropdownClassName?: string;
  emptyMessage?: string;
  allowCustomValue?: boolean;
  onSearch?: (query: string) => void;
  manualTrigger?: boolean;
  searchButtonLabel?: string;
}

export const AutocompleteInput = React.forwardRef<
  HTMLInputElement,
  AutocompleteInputProps
>((
  {
    value = '',
    onChange,
    onSelect,
    options = [],
    placeholder = 'Search...',
    disabled = false,
    loading = false,
    className,
    inputClassName,
    dropdownClassName,
    emptyMessage = 'No results found',
    allowCustomValue = true,
    onSearch,
    manualTrigger = false,
    searchButtonLabel = 'Search',
    ...props
  },
  ref
) => {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState(value);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Update input value when prop changes
  useEffect(() => {
    setInputValue(value);
  }, [value]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setHighlightedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    onChange?.(newValue);
    
    // Only trigger search automatically if not in manual mode
    if (!manualTrigger) {
      onSearch?.(newValue);
      
      if (newValue.trim()) {
        setIsOpen(true);
        setHighlightedIndex(-1);
      } else {
        setIsOpen(false);
      }
    }
  };

  const handleManualSearch = () => {
    if (inputValue.trim()) {
      onSearch?.(inputValue);
      setIsOpen(true);
      setHighlightedIndex(-1);
    }
  };

  const handleOptionSelect = (option: AutocompleteOption) => {
    setInputValue(option.label);
    onChange?.(option.label);
    onSelect?.(option);
    setIsOpen(false);
    setHighlightedIndex(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Handle Enter key for manual search when in manual mode
    if (e.key === 'Enter' && manualTrigger && !isOpen) {
      e.preventDefault();
      handleManualSearch();
      return;
    }

    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'Enter') {
        setIsOpen(true);
        e.preventDefault();
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev < options.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev > 0 ? prev - 1 : options.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0 && options[highlightedIndex]) {
          handleOptionSelect(options[highlightedIndex]);
        } else if (allowCustomValue && inputValue.trim()) {
          onChange?.(inputValue);
          setIsOpen(false);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setHighlightedIndex(-1);
        break;
    }
  };

  const handleClear = () => {
    setInputValue('');
    onChange?.('');
    setIsOpen(false);
    setHighlightedIndex(-1);
  };

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
    setHighlightedIndex(-1);
  };

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      <div className="relative">
        <Input
          ref={ref}
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          className={cn(
            'pr-20',
            inputClassName
          )}
          {...props}
        />
        <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {inputValue && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 hover:bg-muted"
              onClick={handleClear}
              disabled={disabled}
            >
              <X className="h-3 w-3" />
            </Button>
          )}
          {manualTrigger && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 hover:bg-muted"
              onClick={handleManualSearch}
              disabled={disabled}
              title={searchButtonLabel}
            >
              <Search className="h-3 w-3" />
            </Button>
          )}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 hover:bg-muted"
            onClick={toggleDropdown}
            disabled={disabled}
          >
            <ChevronDown className={cn(
              'h-3 w-3 transition-transform',
              isOpen && 'rotate-180'
            )} />
          </Button>
        </div>
      </div>

      {isOpen && (
        <div
          ref={dropdownRef}
          className={cn(
            'absolute z-50 w-full mt-1 bg-popover border rounded-md shadow-md max-h-60 overflow-auto',
            dropdownClassName
          )}
        >
          {loading ? (
            <div className="p-3 text-sm text-muted-foreground text-center">
              Loading...
            </div>
          ) : options.length > 0 ? (
            options.map((option, index) => (
              <div
                key={`${option.value}-${index}`}
                className={cn(
                  'px-3 py-2 cursor-pointer text-sm border-b last:border-b-0',
                  'hover:bg-accent hover:text-accent-foreground',
                  highlightedIndex === index && 'bg-accent text-accent-foreground'
                )}
                onClick={() => handleOptionSelect(option)}
                onMouseEnter={() => setHighlightedIndex(index)}
              >
                <div className="font-medium">{option.label}</div>
                {option.description && (
                  <div className="text-xs text-muted-foreground mt-1">
                    {option.description}
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="p-3 text-sm text-muted-foreground text-center">
              {emptyMessage}
            </div>
          )}
        </div>
      )}
    </div>
  );
});

AutocompleteInput.displayName = 'AutocompleteInput';

export default AutocompleteInput;