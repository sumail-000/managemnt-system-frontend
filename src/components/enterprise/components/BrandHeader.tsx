import { Building } from "lucide-react"
import { cn } from "@/lib/utils"
import { useSidebar } from "@/components/ui/sidebar"

export function BrandHeader() {
  const { state } = useSidebar()
  const isCollapsed = state === "collapsed"

  return (
    <div className={cn(
      "border-b border-primary/20 transition-all duration-300",
      isCollapsed ? "p-3 flex justify-center" : "p-6"
    )}>
      {!isCollapsed ? (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg ring-2 ring-white/20">
            <Building className="w-5 h-5 text-white" />
          </div>
          <div className="space-y-1">
            <h2 className="text-lg font-bold bg-gradient-to-r from-blue-200 to-indigo-200 bg-clip-text text-transparent">
              Enterprise
            </h2>
            <p className="text-xs text-slate-400">Admin Center</p>
          </div>
        </div>
      ) : (
        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg ring-2 ring-white/20">
          <Building className="w-5 h-5 text-white" />
        </div>
      )}
    </div>
  )
}