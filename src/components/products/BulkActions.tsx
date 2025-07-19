import { 
  X, 
  Trash2, 
  Pin, 
  PinOff, 
  Eye, 
  EyeOff,
  CheckCircle,
  FileX
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu"

interface BulkActionsProps {
  selectedCount: number
  onClearSelection: () => void
  onBulkDelete: () => void
  onBulkPin: () => void
  onBulkUnpin: () => void
  onBulkStatusChange: (status: "Published" | "Draft") => void
}

export function BulkActions({
  selectedCount,
  onClearSelection,
  onBulkDelete,
  onBulkPin,
  onBulkUnpin,
  onBulkStatusChange
}: BulkActionsProps) {
  return (
    <Card className="p-4 bg-primary/5 border-primary/20">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Badge variant="secondary" className="font-medium">
            {selectedCount} selected
          </Badge>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearSelection}
            className="h-7 px-2"
          >
            <X className="h-3 w-3 mr-1" />
            Clear
          </Button>
        </div>

        <div className="flex items-center gap-2">
          {/* Pin Actions */}
          <Button
            variant="outline"
            size="sm"
            onClick={onBulkPin}
            className="h-8"
          >
            <Pin className="h-4 w-4 mr-1" />
            Pin
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={onBulkUnpin}
            className="h-8"
          >
            <PinOff className="h-4 w-4 mr-1" />
            Unpin
          </Button>

          <Separator orientation="vertical" className="h-6" />

          {/* Status Change */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-8">
                Change Status
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => onBulkStatusChange("Published")}>
                <CheckCircle className="h-4 w-4 mr-2" />
                Publish
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onBulkStatusChange("Draft")}>
                <FileX className="h-4 w-4 mr-2" />
                Set as Draft
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Separator orientation="vertical" className="h-6" />

          {/* Delete */}
          <Button
            variant="destructive"
            size="sm"
            onClick={onBulkDelete}
            className="h-8"
          >
            <Trash2 className="h-4 w-4 mr-1" />
            Delete
          </Button>
        </div>
      </div>
    </Card>
  )
}