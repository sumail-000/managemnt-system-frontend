import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Save, X, FileText } from 'lucide-react';
import { Ingredient } from '@/types/ingredient';

interface NotesModalProps {
  isOpen: boolean;
  onClose: () => void;
  ingredient: Ingredient | null;
  onSave: (ingredientId: string, updates: { notes: string }) => void;
}

export const NotesModal = ({ isOpen, onClose, ingredient, onSave }: NotesModalProps) => {
  const [notes, setNotes] = useState('');
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (ingredient) {
      setNotes(ingredient.notes || '');
      setHasChanges(false);
    }
  }, [ingredient]);

  const handleNotesChange = (value: string) => {
    setNotes(value);
    setHasChanges(value !== (ingredient?.notes || ''));
  };

  const handleSave = () => {
    if (ingredient) {
      onSave(ingredient.id, { notes });
      setHasChanges(false);
      onClose();
    }
  };

  const handleClose = () => {
    if (hasChanges) {
      if (window.confirm('You have unsaved changes. Are you sure you want to close?')) {
        setNotes(ingredient?.notes || '');
        setHasChanges(false);
        onClose();
      }
    } else {
      onClose();
    }
  };

  if (!ingredient) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Internal Notes for {ingredient.name}
          </DialogTitle>
          <div className="flex items-center gap-2 mt-2">
            <Badge variant="outline" className="text-xs">
              {ingredient.quantity} {ingredient.unit}
            </Badge>
            <Badge variant="secondary" className="text-xs">
              Internal Only
            </Badge>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          <div className="space-y-4 h-full">
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => handleNotesChange(e.target.value)}
                placeholder="Add internal notes for this ingredient... These notes are for internal use only and will not appear on labels or customer-facing materials."
                className="min-h-[200px] resize-none"
              />
              <p className="text-sm text-muted-foreground">
                {notes.length}/1000 characters
              </p>
            </div>

            <div className="bg-muted/50 p-3 rounded-lg">
              <h4 className="text-sm font-medium mb-2">Note Guidelines:</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Use for supplier information, storage requirements, or handling instructions</li>
                <li>• Include any special preparation notes or quality considerations</li>
                <li>• Add sourcing details or alternative suppliers</li>
                <li>• These notes are internal only and won't appear on product labels</li>
              </ul>
            </div>
          </div>
        </div>

        <DialogFooter className="flex-shrink-0">
          <Button variant="outline" onClick={handleClose}>
            <X className="mr-2 h-4 w-4" />
            Cancel
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={!hasChanges}
            className="min-w-[100px]"
          >
            <Save className="mr-2 h-4 w-4" />
            Save Notes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};