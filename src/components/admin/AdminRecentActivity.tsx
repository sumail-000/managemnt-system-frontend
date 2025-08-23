import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UserPlus, Package, DollarSign, AlertTriangle, Icon as LucideIcon } from "lucide-react";
import { adminAPI } from "@/services/api";
import { formatDistanceToNow } from "date-fns";

interface ActivityItem {
  id: number;
  type: "user_signup" | "plan_upgraded" | "product_created" | "product_flagged" | string;
  user?: string | null;
  product?: string | null;
  plan?: string | null;
  timestamp?: string | null;
}

function getIconAndColor(type: string): { Icon: React.ComponentType<any>; color: string } {
  switch (type) {
    case "user_signup":
      return { Icon: UserPlus, color: "green" };
    case "plan_upgraded":
      return { Icon: DollarSign, color: "purple" };
    case "product_created":
      return { Icon: Package, color: "blue" };
    case "product_flagged":
      return { Icon: AlertTriangle, color: "red" };
    default:
      return { Icon: Package, color: "gray" };
  }
}

function getColorClasses(color: string) {
  switch (color) {
    case "green":
      return "text-green-600 bg-green-100";
    case "blue":
      return "text-blue-600 bg-blue-100";
    case "purple":
      return "text-purple-600 bg-purple-100";
    case "red":
      return "text-red-600 bg-red-100";
    default:
      return "text-gray-600 bg-gray-100";
  }
}

function buildActionText(item: ActivityItem): string {
  const user = item.user || "User";
  const product = item.product;
  const plan = item.plan;

  switch (item.type) {
    case "user_signup":
      return `${user} signed up${plan ? ` for ${plan} plan` : ""}`;
    case "plan_upgraded":
      return `${user} upgraded${plan ? ` to ${plan} plan` : ""}`;
    case "product_created":
      return `${user} created${product ? ` \"${product}\"` : " a new product"}`;
    case "product_flagged":
      return `Product${product ? ` \"${product}\"` : ""} flagged`;
    default:
      return `${user} performed an action`;
  }
}

export function AdminRecentActivity() {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      try {
        setLoading(true);
        const payload: any = await adminAPI.getRecentActivities({ limit: 20 });
        // payload is { success: true, data: [...] }
        const items: ActivityItem[] = Array.isArray(payload) ? payload : payload?.data || [];
        if (isMounted) setActivities(items);
      } catch (e) {
        if (isMounted) setActivities([]);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    load();
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, idx) => (
              <div key={idx} className="flex items-start space-x-4 animate-pulse">
                <div className="h-8 w-8 rounded-full bg-gray-200" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 w-48 bg-gray-200 rounded" />
                  <div className="h-2 w-32 bg-gray-200 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : activities.length === 0 ? (
          <div className="text-sm text-muted-foreground">No recent activity.</div>
        ) : (
          <div className="space-y-4 max-h-80 overflow-y-auto pr-1">
            {activities.map((activity) => {
              const { Icon, color } = getIconAndColor(activity.type);
              const actionText = buildActionText(activity);
              const timeText = activity.timestamp
                ? formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })
                : "";
              return (
                <div key={activity.id} className="flex items-start space-x-4">
                  <div className={`h-8 w-8 rounded-full flex items-center justify-center ${getColorClasses(color)}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-muted-foreground">{actionText}</span>
                    </div>
                    {timeText && (
                      <p className="text-xs text-muted-foreground">{timeText}</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
