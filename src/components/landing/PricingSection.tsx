import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Check, Star, Zap, Crown, Loader2 } from "lucide-react"
import { Link } from "react-router-dom"
import { useState, useEffect } from "react"
import { membershipAPI } from "@/services/api"

interface MembershipPlan {
  id: number;
  name: string;
  price: number;
  description: string;
  features: string[];
  product_limit: number;
  label_limit: number;
}

interface PlanDisplay {
  name: string;
  price: number;
  icon: any;
  description: string;
  badge: string | null;
  features: string[];
  limitations: string[];
  product_limit: number;
  label_limit: number;
}

export function PricingSection() {
  const [plans, setPlans] = useState<PlanDisplay[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Icon mapping for each plan
  const iconMap: { [key: string]: any } = {
    'Basic': Star,
    'Pro': Zap,
    'Enterprise': Crown
  };

  // Badge mapping for each plan
  const badgeMap: { [key: string]: string | null } = {
    'Basic': null,
    'Pro': 'Most Popular',
    'Enterprise': 'Best Value'
  };

  // Generate limitations based on plan features and limits
  const generateLimitations = (plan: MembershipPlan): string[] => {
    const limitations: string[] = [];
    
    if (plan.name === 'Basic') {
      limitations.push('No API access', 'No bulk operations', 'Limited templates');
    } else if (plan.name === 'Pro') {
      limitations.push('Limited API calls', 'No team collaboration');
    }
    // Enterprise has no limitations
    
    return limitations;
  };

  // Transform API data to display format
  const transformPlanData = (apiPlans: MembershipPlan[]): PlanDisplay[] => {
    return apiPlans.map(plan => ({
      name: plan.name,
      price: plan.price,
      icon: iconMap[plan.name] || Star,
      description: plan.description,
      badge: badgeMap[plan.name] || null,
      features: plan.features,
      limitations: generateLimitations(plan),
      product_limit: plan.product_limit,
      label_limit: plan.label_limit
    }));
  };

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        setLoading(true);
        const response = await membershipAPI.getPlans();
        console.log('[PricingSection] API response:', response);
        
        // The API returns the plans array directly
        const apiPlans = response.data || response;
        const transformedPlans = transformPlanData(apiPlans);
        setPlans(transformedPlans);
        setError(null);
      } catch (err) {
        console.error('[PricingSection] Failed to fetch plans:', err);
        setError('Failed to load pricing plans');
        
        // Fallback to hardcoded data if API fails
        const fallbackPlans: PlanDisplay[] = [
          {
            name: "Basic",
            price: 0,
            icon: Star,
            description: "Perfect for small food businesses getting started",
            badge: null,
            features: [
              "Manual product entry only",
              "Max 3 product submissions/14 days",
              "Standard label templates",
              "Basic compliance feedback",
              "Self-help support",
              "Email notifications",
              "Basic nutrition analysis"
            ],
            limitations: [
              "No API access",
              "No bulk operations",
              "Limited templates"
            ],
            product_limit: 3,
            label_limit: 10
          },
          {
            name: "Pro",
            price: 79,
            icon: Zap,
            description: "Ideal for growing businesses with advanced needs",
            badge: "Most Popular",
            features: [
              "20 product limit/month",
              "Advanced label templates",
              "Priority label validation",
              "Label validation PDF reports",
              "Product dashboard & history",
              "Email + chat support",
              "Nutritionist support",
              "QR code generation",
              "Multi-language labels",
              "Allergen detection"
            ],
            limitations: [
              "Limited API calls",
              "No team collaboration"
            ],
            product_limit: 20,
            label_limit: 100
          },
          {
            name: "Enterprise",
            price: 199,
            icon: Crown,
            description: "Complete solution for large organizations",
            badge: "Best Value",
            features: [
              "Unlimited products",
              "Bulk upload via Excel/CSV/API",
              "Dedicated account manager",
              "Full API access",
              "Custom badges & certificates",
              "Compliance dashboard",
              "Role-based team access",
              "Private label management",
              "Regulatory update access",
              "24/7 priority support",
              "Custom integrations",
              "White-label options"
            ],
            limitations: [],
            product_limit: 0,
            label_limit: 0
          }
        ];
        setPlans(fallbackPlans);
      } finally {
        setLoading(false);
      }
    };

    fetchPlans();
  }, []);

  if (loading) {
    return (
      <section id="pricing" className="py-20 bg-background">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Loading pricing plans...</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="pricing" className="py-20 bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <Badge variant="secondary" className="mb-4">
            Pricing Plans
          </Badge>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Choose the Perfect Plan for Your Business
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Start with our free trial and scale as your business grows. All plans include our core nutrition analysis and label generation features.
          </p>
          {error && (
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                {error} - Showing cached pricing information.
              </p>
            </div>
          )}
        </div>

        {/* Pricing Cards */}
        <div className="grid lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {plans.map((plan, index) => (
            <Card 
              key={index} 
              className="relative dashboard-card h-full flex flex-col transition-all duration-300 hover:scale-105 hover:shadow-lg"
            >
              {plan.badge && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <Badge variant="default" className="bg-gradient-primary">
                    {plan.badge}
                  </Badge>
                </div>
              )}

              <CardHeader className="text-center pb-6">
                <div className="w-16 h-16 bg-gradient-primary rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <plan.icon className="w-8 h-8 text-primary-foreground" />
                </div>
                <CardTitle className="text-2xl font-bold">{plan.name}</CardTitle>
                <div className="mt-4">
                  <span className="text-4xl font-bold text-foreground">${plan.price}</span>
                  <span className="text-muted-foreground">{plan.name === 'Basic' ? '/14 days' : '/month'}</span>
                </div>
                <p className="text-muted-foreground mt-2">{plan.description}</p>
                
                {/* Plan Limits */}
                <div className="mt-3 text-sm text-muted-foreground">
                  <div className="flex justify-between">
                    <span>Products:</span>
                    <span className="font-medium">
                      {plan.product_limit === 0 ? 'Unlimited' : `${plan.product_limit}${plan.name === 'Basic' ? '/14 days' : '/month'}`}
                    </span>
                  </div>
                  <div className="flex justify-between mt-1">
                    <span>Labels:</span>
                    <span className="font-medium">
                      {plan.label_limit === 0 ? 'Unlimited' : `${plan.label_limit}${plan.name === 'Basic' ? '/14 days' : '/month'}`}
                    </span>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="flex flex-col h-full">
                {/* Features List */}
                <div className="space-y-3 flex-grow">
                  {plan.features.map((feature, featureIndex) => (
                    <div key={featureIndex} className="flex items-start space-x-3">
                      <Check className="w-5 h-5 text-success mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-muted-foreground">{feature}</span>
                    </div>
                  ))}
                </div>

                {/* Limitations */}
                {plan.limitations.length > 0 && (
                  <div className="pt-6 border-t border-border">
                    <p className="text-xs text-muted-foreground mb-2">Limitations:</p>
                    <div className="space-y-1">
                      {plan.limitations.map((limitation, limitIndex) => (
                        <div key={limitIndex} className="flex items-center space-x-2">
                          <div className="w-1 h-1 bg-muted-foreground rounded-full" />
                          <span className="text-xs text-muted-foreground">{limitation}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Spacer for consistent button placement */}
                <div className="mt-auto pt-6">
                  {/* CTA Button */}
                  <Button 
                    className="w-full" 
                    variant="outline"
                    size="lg"
                    asChild
                  >
                    <Link to="/register" state={{ selectedPlan: plan.name.toLowerCase() }}>
                      {index === 0 ? "Start Free Trial" : `Choose ${plan.name}`}
                    </Link>
                  </Button>

                  {index === 0 && (
                    <p className="text-xs text-center text-muted-foreground mt-2">
                      14-day free trial • No credit card required
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-16">
          <p className="text-muted-foreground mb-4">
            Need a custom solution? We offer tailored plans for large enterprises.
          </p>
          <Button variant="outline" size="lg">
            Contact Sales
          </Button>
        </div>
      </div>
    </section>
  )
}