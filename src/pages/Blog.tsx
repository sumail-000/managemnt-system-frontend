import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Link } from "react-router-dom"
import { LandingHeader } from "@/components/landing/LandingHeader"
import { LandingFooter } from "@/components/landing/LandingFooter"
import { ArrowRight, Calendar, User, Clock } from "lucide-react"

export default function Blog() {
  const featuredPost = {
    id: 1,
    title: "The Future of Food Labeling: Digital QR Codes and Smart Packaging",
    excerpt: "Explore how digital technologies are revolutionizing food labeling and creating new opportunities for transparency and consumer engagement.",
    content: "The food industry is undergoing a digital transformation that's changing how we think about product labeling and consumer information...",
    author: "Sarah Johnson",
    date: "2024-01-15",
    readTime: "8 min read",
    image: "/lovable-uploads/94830338-2722-401b-8db4-d8a4edbf8523.png",
    category: "Technology",
    featured: true
  }

  const blogPosts = [
    {
      id: 2,
      title: "Understanding FDA Nutrition Labeling Requirements in 2024",
      excerpt: "A comprehensive guide to the latest FDA requirements for nutrition facts labels and how to ensure compliance.",
      author: "Dr. Michael Chen",
      date: "2024-01-12",
      readTime: "6 min read",
      category: "Compliance"
    },
    {
      id: 3,
      title: "5 Common Allergen Labeling Mistakes That Could Cost Your Business",
      excerpt: "Learn about the most frequent allergen labeling errors and how to avoid them to protect your customers and business.",
      author: "Emily Rodriguez",
      date: "2024-01-10",
      readTime: "4 min read",
      category: "Safety"
    },
    {
      id: 4,
      title: "How AI is Transforming Nutrition Analysis for Food Manufacturers",
      excerpt: "Discover how artificial intelligence is making nutrition analysis faster, more accurate, and more accessible for businesses of all sizes.",
      author: "Alex Thompson",
      date: "2024-01-08",
      readTime: "7 min read",
      category: "Innovation"
    },
    {
      id: 5,
      title: "Sustainable Packaging: Balancing Environmental Goals with Label Requirements",
      excerpt: "Navigate the challenges of eco-friendly packaging while maintaining compliance with labeling regulations.",
      author: "Lisa Green",
      date: "2024-01-05",
      readTime: "5 min read",
      category: "Sustainability"
    },
    {
      id: 6,
      title: "International Food Labeling: Expanding Your Business Globally",
      excerpt: "Understanding different international labeling requirements when expanding your food business to new markets.",
      author: "Marco Silva",
      date: "2024-01-03",
      readTime: "9 min read",
      category: "International"
    },
    {
      id: 7,
      title: "The Complete Guide to Organic Food Certification and Labeling",
      excerpt: "Everything you need to know about obtaining organic certification and proper organic labeling practices.",
      author: "Jennifer Adams",
      date: "2024-01-01",
      readTime: "6 min read",
      category: "Organic"
    }
  ]

  const categories = ["All", "Technology", "Compliance", "Safety", "Innovation", "Sustainability", "International", "Organic"]

  return (
    <div className="min-h-screen bg-background">
      <LandingHeader />
      
      {/* Hero Section */}
      <section className="pt-24 pb-16 bg-gradient-subtle">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <Badge variant="secondary" className="mb-4">
              Food Industry Blog
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
              Latest Insights & Updates
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Stay informed with the latest trends, regulations, and best practices in food labeling, nutrition analysis, and industry compliance.
            </p>
          </div>
        </div>
      </section>

      {/* Categories Filter */}
      <section className="py-8 border-b border-border">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap gap-2 justify-center">
            {categories.map((category) => (
              <Button
                key={category}
                variant={category === "All" ? "default" : "outline"}
                size="sm"
                className="transition-all duration-200"
              >
                {category}
              </Button>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Post */}
      <section className="py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-8 text-center">Featured Article</h2>
            <Card className="dashboard-card overflow-hidden">
              <div className="md:flex">
                <div className="md:w-1/2">
                  <img 
                    src={featuredPost.image} 
                    alt={featuredPost.title}
                    className="w-full h-64 md:h-full object-cover"
                  />
                </div>
                <div className="md:w-1/2 p-8">
                  <div className="flex items-center gap-4 mb-4">
                    <Badge variant="default">{featuredPost.category}</Badge>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="w-4 h-4" />
                      <span>{new Date(featuredPost.date).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold text-foreground mb-4">
                    {featuredPost.title}
                  </h3>
                  <p className="text-muted-foreground mb-6">
                    {featuredPost.excerpt}
                  </p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <User className="w-4 h-4" />
                        <span>{featuredPost.author}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="w-4 h-4" />
                        <span>{featuredPost.readTime}</span>
                      </div>
                    </div>
                    <Button variant="gradient" className="group">
                      Read More
                      <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Blog Grid */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-foreground mb-12 text-center">Latest Articles</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {blogPosts.map((post) => (
              <Card key={post.id} className="dashboard-card hover-scale">
                <CardHeader>
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="outline">{post.category}</Badge>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Calendar className="w-3 h-3" />
                      <span>{new Date(post.date).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <h3 className="text-xl font-semibold text-foreground line-clamp-2">
                    {post.title}
                  </h3>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4 line-clamp-3">
                    {post.excerpt}
                  </p>
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <User className="w-3 h-3" />
                        <span>{post.author}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        <span>{post.readTime}</span>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" className="group">
                      Read
                      <ArrowRight className="w-3 h-3 ml-2 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter CTA */}
      <section className="py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <Card className="dashboard-card bg-gradient-primary text-primary-foreground">
            <CardContent className="text-center py-12">
              <h3 className="text-3xl font-bold mb-4">Stay Updated</h3>
              <p className="text-primary-foreground/90 mb-8 max-w-2xl mx-auto">
                Subscribe to our newsletter and never miss an important update about food industry regulations, best practices, and new features.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
                <input 
                  type="email" 
                  placeholder="Enter your email"
                  className="flex-1 px-4 py-2 rounded-lg text-foreground bg-background/90 border border-background/20"
                />
                <Button variant="secondary">
                  Subscribe
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <LandingFooter />
    </div>
  )
}