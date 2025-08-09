import { useState, useEffect, useCallback } from 'react'
import { productsAPI } from '@/services/api'
import { Product, ProductCamelCase, transformProductToCamelCase, LaravelPaginationResponse } from '@/types/product'
import { useToast } from '@/hooks/use-toast'

export interface FilterState {
  search?: string
  category?: string
  category_id?: string
  status?: string
  isPinned?: boolean
  pinnedOnly?: boolean
  tags?: string[]
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export interface PaginationState {
  currentPage: number
  totalPages: number
  itemsPerPage: number
  total: number
  from: number
  to: number
}

export interface UsePaginatedProductsOptions {
  initialPage?: number
  initialItemsPerPage?: number
  initialFilters?: FilterState
  autoLoad?: boolean
}

interface Category {
  id: string
  name: string
  count?: number
}

export interface UsePaginatedProductsReturn {
  // Data
  products: ProductCamelCase[]
  categories: Category[]
  tags: string[]
  pagination: PaginationState
  filters: FilterState
  
  // Loading states
  loading: boolean
  categoriesLoading: boolean
  tagsLoading: boolean
  
  // Actions
  setPage: (page: number) => void
  setItemsPerPage: (itemsPerPage: number) => void
  setFilters: (filters: Partial<FilterState>) => void
  resetFilters: () => void
  refresh: () => void
  
  // Computed
  hasNextPage: boolean
  hasPreviousPage: boolean
  isEmpty: boolean
}

const defaultFilters: FilterState = {
  search: '',
  category: '',
  status: 'all',
  isPinned: undefined,
  pinnedOnly: false,
  tags: [],
  sortBy: 'created_at',
  sortOrder: 'desc'
}

const defaultPagination: PaginationState = {
  currentPage: 1,
  totalPages: 1,
  itemsPerPage: 12,
  total: 0,
  from: 0,
  to: 0
}

export function usePaginatedProducts(options: UsePaginatedProductsOptions = {}): UsePaginatedProductsReturn {
  const {
    initialPage = 1,
    initialItemsPerPage = 12,
    initialFilters = {},
    autoLoad = true
  } = options

  const { toast } = useToast()
  
  // State
  const [products, setProducts] = useState<ProductCamelCase[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [tags, setTags] = useState<string[]>([])
  const [pagination, setPagination] = useState<PaginationState>({
    ...defaultPagination,
    currentPage: initialPage,
    itemsPerPage: initialItemsPerPage
  })
  const [filters, setFiltersState] = useState<FilterState>({
    ...defaultFilters,
    ...initialFilters
  })
  const [loading, setLoading] = useState(false)
  const [categoriesLoading, setCategoriesLoading] = useState(false)
  const [tagsLoading, setTagsLoading] = useState(false)

  // Load products with current filters and pagination
  const loadProducts = useCallback(async () => {
    try {
      setLoading(true)
      
      const params: any = {
        page: pagination.currentPage,
        per_page: pagination.itemsPerPage,
        sort_by: filters.sortBy,
        sort_order: filters.sortOrder
      }
      
      // Add filters to params
      if (filters.search) params.search = filters.search
      if (filters.category_id) params.category_id = filters.category_id
      if (filters.category) params.category = filters.category // Keep for backward compatibility
      if (filters.status && filters.status !== 'all') params.status = filters.status
      if (filters.isPinned !== undefined) params.is_pinned = filters.isPinned
      if (filters.tags && filters.tags.length > 0) params.tags = filters.tags
      
      console.log('[usePaginatedProducts] Loading products with params:', params)
      
      const response = await productsAPI.getAll(params)
      console.log('[usePaginatedProducts] Products API response:', response)
      
      if (response) {
        // The API interceptor returns response.data directly, so response is the Laravel pagination object
        // Laravel paginate() returns data in response.data and pagination info in response root
        const isLaravelPagination = response && typeof response === 'object' && 'data' in response && Array.isArray(response.data)
        const transformedProducts = isLaravelPagination
          ? (response as unknown as LaravelPaginationResponse<Product>).data.map(transformProductToCamelCase)
          : Array.isArray(response) 
            ? (response as unknown as Product[]).map(transformProductToCamelCase)
            : []
        
        setProducts(transformedProducts)
        
        // Update pagination from Laravel pagination response
        if (isLaravelPagination) {
          const paginationData = response as unknown as LaravelPaginationResponse<Product>
          console.log('[usePaginatedProducts] Laravel pagination data:', {
            current_page: paginationData.current_page,
            last_page: paginationData.last_page,
            total: paginationData.total,
            from: paginationData.from,
            to: paginationData.to,
            per_page: paginationData.per_page,
            data_length: paginationData.data?.length
          })
          console.log('[usePaginatedProducts] Setting pagination state:', {
            prev_total: pagination.total,
            new_total: paginationData.total,
            fallback_total: transformedProducts.length,
            final_total: paginationData.total || transformedProducts.length
          })
          setPagination(prev => ({
            ...prev,
            currentPage: paginationData.current_page || pagination.currentPage,
            totalPages: paginationData.last_page || 1,
            total: paginationData.total || transformedProducts.length,
            from: paginationData.from || 1,
            to: paginationData.to || transformedProducts.length
          }))
        } else {
          // Fallback for simple array response
          setPagination(prev => ({
            ...prev,
            total: transformedProducts.length,
            totalPages: 1,
            from: 1,
            to: transformedProducts.length
          }))
        }
        
        console.log('[usePaginatedProducts] Transformed products:', transformedProducts)
      }
    } catch (error) {
      console.error('[usePaginatedProducts] Failed to load products:', error)
      toast({
        title: "Error",
        description: "Failed to load products. Please try again.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }, [pagination.currentPage, pagination.itemsPerPage, filters, toast])

  // Load categories
  const loadCategories = useCallback(async () => {
    try {
      setCategoriesLoading(true)
      const response = await productsAPI.getCategories()
      console.log('[usePaginatedProducts] Categories API response:', response)
      
      if (Array.isArray(response)) {
        const categoryObjects = response.map(cat => 
          typeof cat === 'string' ? { id: cat, name: cat } : { id: cat.id.toString(), name: cat.name, count: cat.products_count }
        )
        setCategories(categoryObjects)
      } else if (response?.data && Array.isArray(response.data)) {
        const categoryObjects = response.data.map(cat => 
          typeof cat === 'string' ? { id: cat, name: cat } : { id: cat.id.toString(), name: cat.name, count: cat.products_count }
        )
        setCategories(categoryObjects)
      }
    } catch (error) {
      console.error('[usePaginatedProducts] Failed to load categories:', error)
    } finally {
      setCategoriesLoading(false)
    }
  }, [])

  // Load tags - Currently not implemented, return empty array
  const loadTags = useCallback(async () => {
    try {
      setTagsLoading(true)
      // TODO: Implement tags system - could extract from nutrition analysis data
      console.log('[usePaginatedProducts] Tags system not implemented yet')
      setTags([])
    } catch (error) {
      console.error('[usePaginatedProducts] Failed to load tags:', error)
      // Don't show error toast for tags as it's not critical
    } finally {
      setTagsLoading(false)
    }
  }, [])

  // Actions
  const setPage = useCallback((page: number) => {
    setPagination(prev => ({ ...prev, currentPage: page }))
  }, [])

  const setItemsPerPage = useCallback((itemsPerPage: number) => {
    setPagination(prev => ({ 
      ...prev, 
      itemsPerPage, 
      currentPage: 1 // Reset to first page when changing items per page
    }))
  }, [])

  const setFilters = useCallback((newFilters: Partial<FilterState>) => {
    setFiltersState(prev => ({ ...prev, ...newFilters }))
    // Reset to first page when filters change
    setPagination(prev => ({ ...prev, currentPage: 1 }))
  }, [])

  const resetFilters = useCallback(() => {
    setFiltersState(defaultFilters)
    setPagination(prev => ({ ...prev, currentPage: 1 }))
  }, [])

  const refresh = useCallback(() => {
    loadProducts()
  }, [loadProducts])

  // Computed values
  const hasNextPage = pagination.currentPage < pagination.totalPages
  const hasPreviousPage = pagination.currentPage > 1
  const isEmpty = products.length === 0 && !loading

  // Effects
  useEffect(() => {
    if (autoLoad) {
      loadCategories()
      loadTags()
    }
  }, [autoLoad, loadCategories, loadTags])

  useEffect(() => {
    if (autoLoad) {
      loadProducts()
    }
  }, [autoLoad, loadProducts])

  return {
    // Data
    products,
    categories,
    tags,
    pagination,
    filters,
    
    // Loading states
    loading,
    categoriesLoading,
    tagsLoading,
    
    // Actions
    setPage,
    setItemsPerPage,
    setFilters,
    resetFilters,
    refresh,
    
    // Computed
    hasNextPage,
    hasPreviousPage,
    isEmpty
  }
}