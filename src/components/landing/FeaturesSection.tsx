import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  BarChart3, 
  FileText, 
  QrCode, 
  Shield, 
  Globe, 
  Zap,
  CheckCircle,
  Users,
  Database
} from "lucide-react"

export function FeaturesSection() {
  const mainFeatures = [
    {
      icon: BarChart3,
      title: "Advanced Nutrition Analysis",
      description: "AI-powered nutrition analysis using Edamam API with automatic allergen detection and macro/micro nutrient calculations.",
      badges: ["AI-Powered", "Real-time"]
    },
    {
      icon: FileText,
      title: "Multi-Language Labels",
      description: "Generate professional, compliant food labels in Arabic and English with customizable templates and live preview.",
      badges: ["Bilingual", "Compliant"]
    },
    {
      icon: QrCode,
      title: "Smart QR Codes",
      description: "Create unique QR codes linking to public product pages with nutrition facts, ingredients, and allergen information.",
      badges: ["Premium", "Analytics"]
    }
  ]

  const additionalFeatures = [
    {
      icon: Shield,
      title: "Regulatory Compliance",
      description: "Built-in compliance checking for food safety regulations and automatic warnings for high sodium, sugar content."
    },
    {
      icon: Globe,
      title: "Global Standards",
      description: "Support for international food labeling standards and multi-currency pricing for global businesses."
    },
    {
      icon: Zap,
      title: "Instant Processing",
      description: "Lightning-fast ingredient processing and label generation with real-time preview and editing capabilities."
    },
    {
      icon: Users,
      title: "Team Collaboration",
      description: "Role-based access control for teams with shared product libraries and collaborative editing features."
    },
    {
      icon: Database,
      title: "Bulk Operations",
      description: "Enterprise-grade bulk upload via Excel/CSV and full API access for seamless integration."
    },
    {
      icon: CheckCircle,
      title: "Quality Assurance",
      description: "Automated validation checks and nutritionist review options to ensure accuracy and compliance."
    }
  ]

  return (
    <section id="features" className="py-20 bg-muted/30">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <Badge variant="secondary" className="mb-4">
            Features
          </Badge>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Everything You Need for Food Management
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            From ingredient analysis to label generation, our comprehensive platform handles every aspect of food product management with professional-grade tools.
          </p>
        </div>

        {/* Main Features */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          {mainFeatures.map((feature, index) => (
            <Card key={index} className="dashboard-card group hover:shadow-glow transition-all duration-300">
              <CardHeader className="text-center pb-4">
                <div className="w-16 h-16 bg-gradient-primary rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                  <feature.icon className="w-8 h-8 text-primary-foreground" />
                </div>
                <h3 className="text-xl font-semibold text-foreground">{feature.title}</h3>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-muted-foreground mb-4">{feature.description}</p>
                <div className="flex flex-wrap justify-center gap-2">
                  {feature.badges.map((badge, badgeIndex) => (
                    <Badge key={badgeIndex} variant="outline">
                      {badge}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Additional Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {additionalFeatures.map((feature, index) => (
            <Card key={index} className="p-6 hover:shadow-md transition-shadow duration-300">
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-gradient-secondary rounded-lg flex items-center justify-center flex-shrink-0">
                  <feature.icon className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h4 className="font-semibold text-foreground mb-2">{feature.title}</h4>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}