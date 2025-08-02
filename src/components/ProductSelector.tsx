import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Package, ChevronDown } from "lucide-react"
import { productsAPI } from "@/services/api"
import { Product } from "@/types/product"

interface ProductSelectorProps {
  onProductSelect: (product: Product | null) => void
  selectedProductId?: string
}

export function ProductSelector({ onProductSelect, selectedProductId }: ProductSelectorProps) {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true)
        const response = await productsAPI.getAll({ per_page: 100, sort_by: 'updated_at', sort_order: 'desc' })
        setProducts(response.data || [])
        
        // Auto-select first product if none selected
        if (!selectedProductId && response.data && response.data.length > 0) {
          const firstProduct = response.data[0]
          setSelectedProduct(firstProduct)
          onProductSelect(firstProduct)
        } else if (selectedProductId) {
          const product = response.data?.find(p => p.id === selectedProductId)
          if (product) {
            setSelectedProduct(product)
            onProductSelect(product)
          }
        }
      } catch (error) {
        console.error('Error fetching products:', error)
        setProducts([])
      } finally {
        setLoading(false)
      }
    }

    fetchProducts()
  }, [selectedProductId, onProductSelect])

  const handleProductChange = (productId: string) => {
    const product = products.find(p => p.id === productId)
    setSelectedProduct(product || null)
    onProductSelect(product || null)
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            Select Product
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse">
            <div className="h-10 bg-muted rounded-md"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (products.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            Select Product
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-4">
            No products available. Create your first product to see compliance feedback.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="w-5 h-5" />
          Select Product
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Select value={selectedProduct?.id || ""} onValueChange={handleProductChange}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Choose a product to analyze..." />
          </SelectTrigger>
          <SelectContent>
            {products.map((product) => (
              <SelectItem key={product.id} value={product.id}>
                <div className="flex items-center justify-between w-full">
                  <div className="flex flex-col">
                    <span className="font-medium">{product.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {product.category?.name || 'No Category'} • {product.description?.substring(0, 50) || 'No description'}
                    </span>
                  </div>
                  <Badge 
                    variant={product.status === "published" ? "default" : "secondary"}
                    className="ml-2"
                  >
                    {product.status}
                  </Badge>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        {selectedProduct && (
          <div className="mt-4 p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">{selectedProduct.name}</h4>
                <p className="text-sm text-muted-foreground">
                  {selectedProduct.category?.name} • {selectedProduct.serving_size} {selectedProduct.serving_unit}
                </p>
              </div>
              <Badge variant={selectedProduct.status === "published" ? "default" : "secondary"}>
                {selectedProduct.status}
              </Badge>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}