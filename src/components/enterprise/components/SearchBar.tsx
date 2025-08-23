import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"

interface SearchBarProps {
  placeholder?: string
  onSearch?: (query: string) => void
  className?: string
}

export function SearchBar({ 
  placeholder = "Search enterprise features...", 
  onSearch,
  className = "w-64"
}: SearchBarProps) {
  return (
    <div className={`relative ${className}`}>
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <Input 
        placeholder={placeholder}
        className="pl-10 bg-muted/50 border-border/50 focus:border-primary/50 transition-all duration-200"
        onChange={(e) => onSearch?.(e.target.value)}
      />
    </div>
  )
}