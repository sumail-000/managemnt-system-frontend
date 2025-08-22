import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { adminAPI } from '@/services/api'
import { ArrowLeft, User, Calendar, Package, Flag, Eye, EyeOff, Trash2 } from 'lucide-react'

interface AdminProductDetail {
  id: number
  name: string
  description?: string
  status: 'draft' | 'published'
  is_public: boolean
  is_flagged?: boolean
  created_at: string
  updated_at: string
  image?: string | null
  category?: { id: number; name: string } | null
  user?: {
    id: number
    name: string
    email: string
    company?: string
    membership_plan?: { id: number; name: string; price: number }
  } | null
  // Optional JSON fields if present
  ingredients?: any[]
  nutrition_data?: any
}

export default function AdminProductDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [product, setProduct] = useState<AdminProductDetail | null>(null)
  const [loading, setLoading] = useState(true)

  const loadProduct = async () => {
    try {
      setLoading(true)
      const res: any = await adminAPI.getProductById(String(id))
      if (res.success) setProduct(res.data)
    } catch (e) {
      navigate('/admin-panel/products')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadProduct()
  }, [id])

  const handleDelete = async () => {
    if (!product) return
    if (!confirm('This will permanently delete the product. Continue?')) return
    try {
      await adminAPI.deleteProduct(product.id)
      navigate('/admin-panel/products')
    } catch (e) {}
  }

  if (loading) {
    return (<div className="p-6">Loading...</div>)
  }
  if (!product) {
    return (<div className="p-6">Product not found</div>)
  }

  const statusBadge = product.is_flagged
    ? <Badge className="bg-red-100 text-red-800">Flagged</Badge>
    : product.is_public
      ? <Badge className="bg-blue-100 text-blue-800">Public</Badge>
      : product.status === 'published'
        ? <Badge className="bg-green-100 text-green-800">Published</Badge>
        : <Badge className="bg-yellow-100 text-yellow-800">Draft</Badge>

  const ingredients = Array.isArray((product as any).ingredients) ? (product as any).ingredients : []
  const nutrition = (product as any).nutrition_data || {}
  const per = nutrition.per_serving_data || {}
  const nutrients = per.nutrients_per_serving || {}

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-4 h-4 mr-2" /> Back
          </Button>
          <h1 className="text-2xl font-bold">{product.name}</h1>
          {statusBadge}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleDelete}>
            <Trash2 className="w-4 h-4 mr-2" /> Delete
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Product Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {product.image && (
                <img src={product.image} alt={product.name} className="w-full h-64 object-cover rounded-lg" />
              )}
              <p className="text-muted-foreground">{product.description || 'No Description'}</p>
              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <div className="text-sm text-muted-foreground">Category</div>
                  <div className="font-medium">{product.category?.name || 'N/A'}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Visibility</div>
                  <div className="flex items-center gap-2">
                    {product.is_public ? <Eye className="w-4 h-4 text-blue-600"/> : <EyeOff className="w-4 h-4 text-muted-foreground"/>}
                    <div className="font-medium">{product.is_public ? 'Public' : 'Private'}</div>
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Created</div>
                  <div className="font-medium">{new Date(product.created_at).toLocaleString()}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Ingredients</CardTitle>
            </CardHeader>
            <CardContent>
              {ingredients.length > 0 ? (
                <div className="space-y-2">
                  {ingredients.map((ing: any, idx: number) => (
                    <div key={idx} className="flex items-center justify-between p-2 bg-muted/50 rounded-lg">
                      <span className="font-medium">{ing.name || ing.ingredient || 'Ingredient'}</span>
                      {(ing.amount || ing.unit) && (
                        <Badge variant="outline">{ing.amount} {ing.unit}</Badge>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-muted-foreground">No ingredients data</div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Basic Nutrition (per serving)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <div className="text-sm text-muted-foreground">Calories</div>
                  <div className="font-semibold">{per.calories_per_serving ?? per.calories ?? 'N/A'}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Serving Size</div>
                  <div className="font-semibold">{per.serving_size_grams ? `${per.serving_size_grams} g` : 'N/A'}</div>
                </div>
              </div>
              <Separator className="my-4" />
              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <div className="text-sm text-muted-foreground">Total Fat</div>
                  <div className="font-semibold">{nutrients.FAT?.quantity ?? 'N/A'} g</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Carbohydrates</div>
                  <div className="font-semibold">{nutrients.CHOCDF?.quantity ?? 'N/A'} g</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Protein</div>
                  <div className="font-semibold">{nutrients.PROCNT?.quantity ?? 'N/A'} g</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Creator</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4" />
                <div className="font-medium">{product.user?.name || 'Unknown User'}</div>
              </div>
              <div className="text-sm text-muted-foreground">{product.user?.email}</div>
              {product.user?.company && (
                <div className="text-sm">Company: {product.user.company}</div>
              )}
              <Separator />
              <div>
                <div className="text-sm text-muted-foreground">Plan</div>
                <div className="font-medium">{product.user?.membership_plan?.name || 'N/A'}</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Meta</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Status</span>
                {statusBadge}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Category</span>
                <span className="text-sm">{product.category?.name || 'N/A'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Created</span>
                <span className="text-sm">{new Date(product.created_at).toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Updated</span>
                <span className="text-sm">{new Date(product.updated_at).toLocaleString()}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
