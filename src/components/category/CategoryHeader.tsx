import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"

interface CategoryHeaderProps {
  onCreateClick: () => void
  isCreating: boolean
}

export function CategoryHeader({ onCreateClick, isCreating }: CategoryHeaderProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="space-y-1">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
          Category Management
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground max-w-2xl">
          Organize your products with categories. Create, edit, and manage your product categories efficiently.
        </p>
      </div>
      <Button 
        onClick={onCreateClick}
        disabled={isCreating}
        className="btn-gradient shrink-0 shadow-glow w-full sm:w-auto"
        size="lg"
      >
        <Plus className="mr-2 h-4 w-4" />
        Add Category
      </Button>
    </div>
  )
}