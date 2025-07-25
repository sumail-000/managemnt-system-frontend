import { useState, useEffect, useCallback } from "react"
import { useCategories } from "@/hooks/useCategories"
import { useToast } from "@/hooks/use-toast"
import { Category, CategoryFormData } from "@/types/category"
import { CategoryHeader } from "@/components/category/CategoryHeader"
import { CategoryStats } from "@/components/category/CategoryStats"
import { CategoryTable } from "@/components/category/CategoryTable"
import { CategoryDialogs } from "@/components/category/CategoryDialogs"

export default function CategoryManagement() {
  const { toast } = useToast()
  const {
    categories,
    loading,
    creating,
    updating,
    deleting,
    searching,
    loadCategories,
    createCategory,
    updateCategory,
    deleteCategory,
    searchCategories,
    isEmpty
  } = useCategories({ autoLoad: true })

  // Local state
  const [searchTerm, setSearchTerm] = useState("")
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null)
  const [formData, setFormData] = useState<CategoryFormData>({ name: "" })


  // Handle create category
  const handleCreateCategory = async () => {
    if (!formData.name.trim()) {
      toast({
        title: "Error",
        description: "Category name is required",
        variant: "destructive"
      })
      return
    }

    const result = await createCategory(formData)
    if (result) {
      setIsCreateDialogOpen(false)
      setFormData({ name: "" })
    }
  }

  // Handle edit category
  const handleEditCategory = async () => {
    if (!selectedCategory || !formData.name.trim()) {
      toast({
        title: "Error",
        description: "Category name is required",
        variant: "destructive"
      })
      return
    }

    const result = await updateCategory(selectedCategory.id.toString(), formData)
    if (result) {
      setIsEditDialogOpen(false)
      setSelectedCategory(null)
      setFormData({ name: "" })
    }
  }

  // Handle delete category
  const handleDeleteCategory = async () => {
    if (!selectedCategory) return

    const result = await deleteCategory(selectedCategory.id.toString())
    if (result) {
      setIsDeleteDialogOpen(false)
      setSelectedCategory(null)
    }
  }

  // Open edit dialog
  const openEditDialog = (category: Category) => {
    setSelectedCategory(category)
    setFormData({ name: category.name })
    setIsEditDialogOpen(true)
  }

  // Open delete dialog
  const openDeleteDialog = (category: Category) => {
    setSelectedCategory(category)
    setIsDeleteDialogOpen(true)
  }

  // Reset form when dialogs close
  const resetForm = () => {
    setFormData({ name: "" })
    setSelectedCategory(null)
  }

  // Handle search button click
  const handleSearch = useCallback(async () => {
    if (searchTerm.trim()) {
      await searchCategories(searchTerm)
    } else {
      await loadCategories()
    }
  }, [searchTerm, searchCategories, loadCategories])

  // Handle search input change
  const handleSearchChange = (term: string) => {
    setSearchTerm(term)
  }

  // Handle clear search
  const handleClearSearch = useCallback(async () => {
    setSearchTerm("")
    await loadCategories()
  }, [loadCategories])

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6 lg:py-8 space-y-6 lg:space-y-8 max-w-7xl">
        {/* Header */}
        <CategoryHeader 
          onCreateClick={() => setIsCreateDialogOpen(true)}
          isCreating={creating}
        />

        {/* Stats */}
        <CategoryStats 
          categories={categories}
          filteredCategories={categories}
          searchTerm={searchTerm}
        />

        {/* Main Table/Content */}
        <CategoryTable
          categories={categories}
          loading={loading || searching}
          isEmpty={isEmpty}
          searchTerm={searchTerm}
          onSearchChange={handleSearchChange}
          onSearch={handleSearch}
          onClearSearch={handleClearSearch}
          onRefresh={loadCategories}
          onEdit={openEditDialog}
          onDelete={openDeleteDialog}
          onCreateClick={() => setIsCreateDialogOpen(true)}
        />

        {/* Dialogs */}
        <CategoryDialogs
          isCreateDialogOpen={isCreateDialogOpen}
          setIsCreateDialogOpen={setIsCreateDialogOpen}
          isEditDialogOpen={isEditDialogOpen}
          setIsEditDialogOpen={setIsEditDialogOpen}
          isDeleteDialogOpen={isDeleteDialogOpen}
          setIsDeleteDialogOpen={setIsDeleteDialogOpen}
          formData={formData}
          setFormData={setFormData}
          selectedCategory={selectedCategory}
          onCreateCategory={handleCreateCategory}
          onEditCategory={handleEditCategory}
          onDeleteCategory={handleDeleteCategory}
          onResetForm={resetForm}
          creating={creating}
          updating={updating}
          deleting={deleting}
        />
      </div>
    </div>
  )
}