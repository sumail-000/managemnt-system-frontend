import { LandingHeader } from "@/components/landing/LandingHeader"
import { HeroSection } from "@/components/landing/HeroSection"
import { FeaturesSection } from "@/components/landing/FeaturesSection"
import { PricingSection } from "@/components/landing/PricingSection"
import { TestimonialsSection } from "@/components/landing/TestimonialsSection"
import { LandingFooter } from "@/components/landing/LandingFooter"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowRight, Users, Building, Award } from "lucide-react"
import { Link } from "react-router-dom"

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      <LandingHeader />
      <HeroSection />
      <FeaturesSection />
      <PricingSection />
      <TestimonialsSection />
      
      {/* About Section */}
      <section id="about" className="py-20 bg-background">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <Badge variant="secondary" className="mb-4">
              About FoodManager
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
              Leading the Future of Food Management
            </h2>
            <p className="text-xl text-muted-foreground mb-12 leading-relaxed">
              Founded by food industry experts and technology leaders, FoodManager was created to solve the complex challenges of modern food production, labeling, and compliance. Our platform combines cutting-edge AI with deep industry knowledge to deliver solutions that food businesses can trust.
            </p>
            
            <div className="grid md:grid-cols-3 gap-8 mb-12">
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-primary rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Users className="w-8 h-8 text-primary-foreground" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Expert Team</h3>
                <p className="text-muted-foreground">Food scientists, nutritionists, and tech experts working together</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-primary rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Building className="w-8 h-8 text-primary-foreground" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Industry Focus</h3>
                <p className="text-muted-foreground">Purpose-built for food and beverage companies of all sizes</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-primary rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Award className="w-8 h-8 text-primary-foreground" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Proven Results</h3>
                <p className="text-muted-foreground">99.9% compliance rate and 1000+ satisfied customers</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section id="contact" className="py-20 bg-gradient-hero relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-accent/10" />
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-4xl mx-auto text-center text-white">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Ready to Transform Your Food Management?
            </h2>
            <p className="text-xl opacity-90 mb-8">
              Join thousands of food businesses who trust FoodManager for their nutrition analysis, labeling, and compliance needs. Start your free trial today.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="xl" variant="secondary" className="bg-white text-foreground hover:bg-gray-100" asChild>
                <Link to="/register" state={{ selectedPlan: "basic" }}>
                  Start Free Trial
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </Button>
              <Button size="xl" variant="outline" className="border-white text-white hover:bg-white hover:text-foreground">
                Schedule Demo
              </Button>
            </div>
            <p className="text-sm opacity-80 mt-6">
              No credit card required • 14-day free trial • Cancel anytime
            </p>
          </div>
        </div>
      </section>

      <LandingFooter />
    </div>
  )
}