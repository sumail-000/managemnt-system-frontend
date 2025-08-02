import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Star, Quote } from "lucide-react"

export function TestimonialsSection() {
  const testimonials = [
    {
      name: "Sarah Johnson",
      title: "Quality Manager",
      company: "Fresh Valley Foods",
      image: "photo-1494790108755-2616b4e1bf72", // Professional woman
      rating: 5,
      content: "FoodManager transformed our labeling process. What used to take hours now takes minutes, and the compliance checking gives us peace of mind. The nutrition analysis is incredibly accurate."
    },
    {
      name: "Ahmed Al-Rashid", 
      title: "Production Director",
      company: "Mediterranean Delights",
      image: "photo-1472099645785-5658abf4ff4e", // Professional man
      rating: 5,
      content: "The bilingual label generation is a game-changer for our Middle Eastern market. The Arabic-English labels look professional and meet all regulatory requirements perfectly."
    },
    {
      name: "Maria Rodriguez",
      title: "Food Scientist",
      company: "Organic Harvest Co.",
      image: "photo-1438761681033-6461ffad8d80", // Professional woman
      rating: 5,
      content: "As a food scientist, I appreciate the detailed nutrition analysis and allergen detection. The platform saves us significant time on compliance documentation and reporting."
    },
    {
      name: "David Chen",
      title: "CEO",
      company: "Artisan Bakery Group",
      image: "photo-1507003211169-0a1dd7228f2d", // Professional man
      rating: 5,
      content: "The QR code integration and public product pages have increased customer trust. Our customers love being able to scan and see detailed ingredient information instantly."
    },
    {
      name: "Lisa Thompson",
      title: "Operations Manager", 
      company: "Healthy Snacks Inc.",
      image: "photo-1487412720507-e7ab37603c6f", // Professional woman
      rating: 5,
      content: "Enterprise features like bulk upload and team collaboration streamlined our entire product management workflow. The API integration works flawlessly with our existing systems."
    },
    {
      name: "Roberto Silva",
      title: "Quality Assurance Lead",
      company: "Global Food Solutions",
      image: "photo-1500648767791-00dcc994a43e", // Professional man
      rating: 5,
      content: "The compliance dashboard and regulatory update notifications keep us ahead of changing regulations. The platform practically runs our quality assurance process."
    }
  ]

  return (
    <section className="py-20 bg-muted/30">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <Badge variant="secondary" className="mb-4">
            Customer Success
          </Badge>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Trusted by Food Industry Leaders
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Join thousands of food businesses who trust FoodManager for their nutrition analysis, labeling, and compliance needs.
          </p>
        </div>

        {/* Testimonials Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <Card key={index} className="dashboard-card group hover:shadow-lg transition-all duration-300">
              <CardContent className="p-6">
                {/* Quote Icon */}
                <div className="w-10 h-10 bg-gradient-primary rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                  <Quote className="w-5 h-5 text-primary-foreground" />
                </div>

                {/* Rating */}
                <div className="flex items-center mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 text-accent fill-current" />
                  ))}
                </div>

                {/* Content */}
                <p className="text-muted-foreground mb-6 leading-relaxed">
                  "{testimonial.content}"
                </p>

                {/* Author */}
                <div className="flex items-center space-x-3">
                  <img
                    src={`https://images.unsplash.com/${testimonial.image}?w=150&h=150&fit=crop&crop=face`}
                    alt={testimonial.name}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                  <div>
                    <p className="font-semibold text-foreground">{testimonial.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {testimonial.title}, {testimonial.company}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-16 pt-16 border-t border-border">
          <div className="text-center">
            <div className="text-3xl font-bold text-foreground mb-2">1000+</div>
            <div className="text-muted-foreground">Happy Customers</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-foreground mb-2">50K+</div>
            <div className="text-muted-foreground">Labels Generated</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-foreground mb-2">99.9%</div>
            <div className="text-muted-foreground">Compliance Rate</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-foreground mb-2">24/7</div>
            <div className="text-muted-foreground">Support Available</div>
          </div>
        </div>
      </div>
    </section>
  )
}