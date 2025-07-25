import { AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Category, CategoryFormData } from "@/types/category"

interface CategoryDialogsProps {
  // Create Dialog
  isCreateDialogOpen: boolean
  setIsCreateDialogOpen: (open: boolean) => void
  
  // Edit Dialog
  isEditDialogOpen: boolean
  setIsEditDialogOpen: (open: boolean) => void
  
  // Delete Dialog
  isDeleteDialogOpen: boolean
  setIsDeleteDialogOpen: (open: boolean) => void
  
  // Form Data
  formData: CategoryFormData
  setFormData: (data: CategoryFormData) => void
  selectedCategory: Category | null
  
  // Handlers
  onCreateCategory: () => void
  onEditCategory: () => void
  onDeleteCategory: () => void
  onResetForm: () => void
  
  // Loading States
  creating: boolean
  updating: boolean
  deleting: boolean
}

export function CategoryDialogs({
  isCreateDialogOpen,
  setIsCreateDialogOpen,
  isEditDialogOpen,
  setIsEditDialogOpen,
  isDeleteDialogOpen,
  setIsDeleteDialogOpen,
  formData,
  setFormData,
  selectedCategory,
  onCreateCategory,
  onEditCategory,
  onDeleteCategory,
  onResetForm,
  creating,
  updating,
  deleting
}: CategoryDialogsProps) {
  return (
    <>
      {/* Create Category Dialog */}
      <Dialog 
        open={isCreateDialogOpen} 
        onOpenChange={(open) => {
          setIsCreateDialogOpen(open)
          if (!open) onResetForm()
        }}
      >
        <DialogContent className="sm:max-w-md bg-card border-border/50">
          <DialogHeader className="space-y-3">
            <DialogTitle className="text-xl font-semibold text-foreground">
              Create New Category
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Add a new category to organize your products. Categories help you better manage and filter your inventory.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="category-name" className="text-sm font-medium text-foreground">
                Category Name
              </Label>
              <Input
                id="category-name"
                value={formData.name}
                onChange={(e) => setFormData({ name: e.target.value })}
                placeholder="Enter category name..."
                className="bg-muted/30 border-border/50 focus:bg-background"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    onCreateCategory()
                  }
                }}
              />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button 
              variant="outline" 
              onClick={() => setIsCreateDialogOpen(false)}
              disabled={creating}
              className="border-border/50 hover:bg-muted/50"
            >
              Cancel
            </Button>
            <Button 
              onClick={onCreateCategory}
              disabled={creating || !formData.name.trim()}
              className="btn-gradient"
            >
              {creating ? "Creating..." : "Create Category"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Category Dialog */}
      <Dialog 
        open={isEditDialogOpen} 
        onOpenChange={(open) => {
          setIsEditDialogOpen(open)
          if (!open) onResetForm()
        }}
      >
        <DialogContent className="sm:max-w-md bg-card border-border/50">
          <DialogHeader className="space-y-3">
            <DialogTitle className="text-xl font-semibold text-foreground">
              Edit Category
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Update the category name. This will affect how your products are organized.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-category-name" className="text-sm font-medium text-foreground">
                Category Name
              </Label>
              <Input
                id="edit-category-name"
                value={formData.name}
                onChange={(e) => setFormData({ name: e.target.value })}
                placeholder="Enter category name..."
                className="bg-muted/30 border-border/50 focus:bg-background"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    onEditCategory()
                  }
                }}
              />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button 
              variant="outline" 
              onClick={() => setIsEditDialogOpen(false)}
              disabled={updating}
              className="border-border/50 hover:bg-muted/50"
            >
              Cancel
            </Button>
            <Button 
              onClick={onEditCategory}
              disabled={updating || !formData.name.trim()}
              className="btn-gradient"
            >
              {updating ? "Updating..." : "Update Category"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Category Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent className="bg-card border-border/50">
          <AlertDialogHeader className="space-y-3">
            <AlertDialogTitle className="flex items-center gap-3 text-xl font-semibold">
              <div className="h-10 w-10 rounded-full bg-destructive/10 flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-destructive" />
              </div>
              Delete Category
            </AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground space-y-2">
              <p>
                Are you sure you want to delete the category <span className="font-semibold text-foreground">"{selectedCategory?.name}"</span>? 
                This action cannot be undone.
              </p>
              {selectedCategory?.products_count && selectedCategory.products_count > 0 && (
                <div className="mt-3 p-3 bg-destructive/10 rounded-lg border border-destructive/20">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                    <div className="text-sm">
                      <p className="font-medium text-destructive mb-1">Warning</p>
                      <p className="text-destructive/90">
                        This category is used by <span className="font-semibold">{selectedCategory.products_count} product(s)</span>. 
                        Deleting it may affect those products.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 sm:gap-0">
            <AlertDialogCancel 
              disabled={deleting}
              className="border-border/50 hover:bg-muted/50"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={onDeleteCategory}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? "Deleting..." : "Delete Category"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}