import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Save, X, Plus, Tag, Loader2 } from 'lucide-react';
import { Category } from '@/types/category';
import { useToast } from '@/hooks/use-toast';
import { useCategories } from '@/hooks/useCategories';

interface CategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCategoryCreated: (category: Category) => void;
  existingCategories: Category[];
  loading?: boolean;
}

export const CategoryModal = ({
  isOpen,
  onClose,
  onCategoryCreated,
  existingCategories,
  loading = false
}: CategoryModalProps) => {
  const [categoryName, setCategoryName] = useState('');
  const [validationError, setValidationError] = useState('');
  const { toast } = useToast();
  const { createCategory, creating } = useCategories({ autoLoad: false });

  useEffect(() => {
    if (isOpen) {
      setCategoryName('');
      setValidationError('');
    }
  }, [isOpen]);

  const validateCategoryName = (name: string): string => {
    if (!name.trim()) {
      return 'Category name is required';
    }
    if (name.trim().length < 2) {
      return 'Category name must be at least 2 characters';
    }
    if (name.trim().length > 255) {
      return 'Category name must be less than 255 characters';
    }
    if ((existingCategories || []).some(cat => cat.name.toLowerCase() === name.trim().toLowerCase())) {
      return 'Category already exists';
    }
    return '';
  };

  const handleCategoryNameChange = (value: string) => {
    setCategoryName(value);
    const error = validateCategoryName(value);
    setValidationError(error);
  };

  const handleCreateCategory = async () => {
    const trimmedName = categoryName.trim();
    const error = validateCategoryName(trimmedName);
    
    if (error) {
      setValidationError(error);
      return;
    }

    try {
      console.log('[CategoryModal] Creating category:', trimmedName);
      const newCategory = await createCategory({ name: trimmedName });
      
      if (newCategory) {
        console.log('[CategoryModal] Category created successfully:', newCategory);
        onCategoryCreated(newCategory);
        setCategoryName('');
        setValidationError('');
      }
    } catch (error) {
      console.error('[CategoryModal] Error creating category:', error);
      // Error handling is already done in useCategories hook
    }
  };



  const handleClose = () => {
    setCategoryName('');
    setValidationError('');
    onClose();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !validationError && categoryName.trim()) {
      handleCreateCategory();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <Tag className="h-5 w-5" />
            Manage Categories
          </DialogTitle>
          <DialogDescription>
            Create a new category for your products
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden space-y-6">
          {/* Create New Category Section */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="categoryName">Create New Category</Label>
              <div className="flex gap-2">
                <div className="flex-1">
                  <Input
                    id="categoryName"
                    value={categoryName}
                    onChange={(e) => handleCategoryNameChange(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Enter category name..."
                    className={validationError ? 'border-destructive' : ''}
                    disabled={creating || loading}
                  />
                  {validationError && (
                    <p className="text-sm text-destructive mt-1">{validationError}</p>
                  )}
                </div>
                <Button
                  onClick={handleCreateCategory}
                  disabled={!categoryName.trim() || !!validationError || creating || loading}
                  className="min-w-[100px]"
                >
                  {creating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating
                    </>
                  ) : (
                    <>
                      <Plus className="mr-2 h-4 w-4" />
                      Create
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>



          {/* Current Categories Info */}
          {existingCategories && existingCategories.length > 0 && (
            <div className="space-y-2">
              <Label>Your Categories ({existingCategories?.length || 0})</Label>
              <div className="flex flex-wrap gap-1">
                {(existingCategories || []).slice(0, 10).map((category) => (
                  <Badge key={category.id} variant="outline" className="text-xs">
                    {category.name}
                  </Badge>
                ))}
                {existingCategories && existingCategories.length > 10 && (
                  <Badge variant="secondary" className="text-xs">
                    +{(existingCategories?.length || 0) - 10} more
                  </Badge>
                )}
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="flex-shrink-0">
          <Button variant="outline" onClick={handleClose}>
            <X className="mr-2 h-4 w-4" />
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};