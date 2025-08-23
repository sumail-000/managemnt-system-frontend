import { cn } from "@/lib/utils"
import {
  Sidebar,
  SidebarContent,
  useSidebar,
} from "@/components/ui/sidebar"
import { BrandHeader } from "./components/BrandHeader"
import { NavigationGroup } from "./components/NavigationGroup"
import { mockQuery } from "./EnterpriseMockData"

export function EnterpriseSidebar() {
  const { state } = useSidebar()
  const isCollapsed = state === "collapsed"

  return (
    <Sidebar 
      className={cn(
        "border-r-2 border-primary/10 bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950",
        isCollapsed ? "w-16" : "w-72"
      )}
      collapsible="icon"
    >
      <SidebarContent>
        <BrandHeader />

        {/* Navigation Groups */}
        <div className="flex-1 overflow-y-auto py-4">
          {mockQuery.navigationItems.map((group) => (
            <NavigationGroup
              key={group.title}
              title={group.title}
              items={group.items}
            />
          ))}
        </div>
      </SidebarContent>
    </Sidebar>
  )
}