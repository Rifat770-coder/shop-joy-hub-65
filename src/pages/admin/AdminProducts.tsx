import { useMemo, useState } from 'react';
import { Plus, Search, Edit, Trash2, MoreHorizontal, Loader2, PlusCircle, XCircle } from 'lucide-react';
import { AdminLayout } from './AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { getPrimaryImage, normalizeImageUrl } from '@/lib/image-utils';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  useProducts, 
  useAddProduct, 
  useUpdateProduct, 
  useDeleteProduct,
  Product 
} from '@/hooks/useProducts';

export default function AdminProducts() {
  const { data: products = [], isLoading } = useProducts();
  const addProduct = useAddProduct();
  const updateProduct = useUpdateProduct();
  const deleteProduct = useDeleteProduct();

  // normalizeImageUrl is imported from @/lib/image-utils

  const [searchQuery, setSearchQuery] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [newProduct, setNewProduct] = useState({
    name: '',
    description: '',
    price: '',
    originalPrice: '',
    category: '',
    stock: '',
  });
  const [newImageUrls, setNewImageUrls] = useState<string[]>(['']);
  const [editImageUrls, setEditImageUrls] = useState<string[]>(['']);

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const categoryOptions = useMemo(() => {
    const set = new Set(products.map((p) => p.category));
    if (editingProduct?.category) set.add(editingProduct.category);
    if (newProduct.category) set.add(newProduct.category);
    return Array.from(set).sort();
  }, [products, editingProduct?.category, newProduct.category]);

  const handleAddProduct = async () => {
    if (!newProduct.name || !newProduct.price || !newProduct.category) {
      return;
    }

    const images = newImageUrls.map(normalizeImageUrl).filter(Boolean);
    const imageValue = images.length > 0 ? images.join('|') : 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&h=400&fit=crop';

    await addProduct.mutateAsync({
      name: newProduct.name,
      description: newProduct.description || undefined,
      price: parseFloat(newProduct.price),
      originalPrice: newProduct.originalPrice ? parseFloat(newProduct.originalPrice) : undefined,
      category: newProduct.category,
      stock: parseInt(newProduct.stock) || 0,
      image: imageValue,
    });

    setNewProduct({ name: '', description: '', price: '', originalPrice: '', category: '', stock: '' });
    setNewImageUrls(['']);
    setIsAddDialogOpen(false);
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    const imgs = product.image ? product.image.split('|').filter(Boolean) : [''];
    setEditImageUrls(imgs.length > 0 ? imgs : ['']);
    setIsEditDialogOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editingProduct) return;

    const images = editImageUrls.map(normalizeImageUrl).filter(Boolean);
    const imageValue = images.length > 0 ? images.join('|') : editingProduct.image || '';

    await updateProduct.mutateAsync({
      id: editingProduct.id,
      name: editingProduct.name,
      description: editingProduct.description,
      price: editingProduct.price,
      originalPrice: editingProduct.originalPrice ?? undefined,
      category: editingProduct.category,
      stock: editingProduct.stock,
      image: imageValue,
    });

    setIsEditDialogOpen(false);
    setEditingProduct(null);
  };

  const handleDeleteProduct = async (productId: string) => {
    await deleteProduct.mutateAsync(productId);
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Products</h1>
            <p className="text-muted-foreground mt-1">
              Manage your product inventory
            </p>
          </div>

          <Dialog open={isAddDialogOpen} onOpenChange={(open) => { setIsAddDialogOpen(open); if (!open) setNewImageUrls(['']); }}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Add Product
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Add New Product</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Product Name *</Label>
                  <Input
                    id="name"
                    value={newProduct.name}
                    onChange={(e) =>
                      setNewProduct({ ...newProduct, name: e.target.value })
                    }
                    placeholder="Enter product name"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={newProduct.description}
                    onChange={(e) =>
                      setNewProduct({ ...newProduct, description: e.target.value })
                    }
                    placeholder="Enter product description"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="price">Sale Price *</Label>
                    <Input
                      id="price"
                      type="number"
                      value={newProduct.price}
                      onChange={(e) =>
                        setNewProduct({ ...newProduct, price: e.target.value })
                      }
                      placeholder="0.00"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="originalPrice">Original Price (MRP)</Label>
                    <Input
                      id="originalPrice"
                      type="number"
                      value={newProduct.originalPrice}
                      onChange={(e) =>
                        setNewProduct({ ...newProduct, originalPrice: e.target.value })
                      }
                      placeholder="0.00 (optional)"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="stock">Stock</Label>
                    <Input
                      id="stock"
                      type="number"
                      value={newProduct.stock}
                      onChange={(e) =>
                        setNewProduct({ ...newProduct, stock: e.target.value })
                      }
                      placeholder="0"
                    />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="category">Category *</Label>
                  <Select
                    value={newProduct.category}
                    onValueChange={(value) =>
                      setNewProduct({ ...newProduct, category: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categoryOptions.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>Image URLs</Label>
                  <div className="text-xs text-muted-foreground -mt-1 space-y-0.5">
                    <p>Use a direct image URL. Recommended free hosts:</p>
                    <p>• <a href="https://imgbb.com" target="_blank" rel="noreferrer" className="underline text-primary">imgbb.com</a> — upload → copy "Direct link"</p>
                    <p>• <a href="https://imgur.com" target="_blank" rel="noreferrer" className="underline text-primary">imgur.com</a> — upload → right-click image → copy image address</p>
                  </div>
                  {newImageUrls.map((url, idx) => (
                    <div key={idx} className="flex gap-2 items-center">
                      <Input
                        value={url}
                        onChange={(e) => {
                          const updated = [...newImageUrls];
                          updated[idx] = e.target.value;
                          setNewImageUrls(updated);
                        }}
                        placeholder={idx === 0 ? 'https://i.ibb.co/xxx/image.jpg' : 'Additional image URL'}
                      />
                      {newImageUrls.length > 1 && (
                        <button type="button" onClick={() => setNewImageUrls(newImageUrls.filter((_, i) => i !== idx))}>
                          <XCircle className="h-5 w-5 text-destructive" />
                        </button>
                      )}
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="w-fit gap-1"
                    onClick={() => setNewImageUrls([...newImageUrls, ''])}
                  >
                    <PlusCircle className="h-4 w-4" />
                    Add another image
                  </Button>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddProduct} disabled={addProduct.isPending}>
                  {addProduct.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Add Product
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Edit Product Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Edit Product</DialogTitle>
            </DialogHeader>
            {editingProduct && (
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="edit-name">Product Name *</Label>
                  <Input
                    id="edit-name"
                    value={editingProduct.name}
                    onChange={(e) =>
                      setEditingProduct({ ...editingProduct, name: e.target.value })
                    }
                    placeholder="Enter product name"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-description">Description</Label>
                  <Textarea
                    id="edit-description"
                    value={editingProduct.description || ''}
                    onChange={(e) =>
                      setEditingProduct({ ...editingProduct, description: e.target.value })
                    }
                    placeholder="Enter product description"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="edit-price">Sale Price *</Label>
                    <Input
                      id="edit-price"
                      type="number"
                      value={editingProduct.price}
                      onChange={(e) =>
                        setEditingProduct({ ...editingProduct, price: parseFloat(e.target.value) || 0 })
                      }
                      placeholder="0.00"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="edit-originalPrice">Original Price (MRP)</Label>
                    <Input
                      id="edit-originalPrice"
                      type="number"
                      value={editingProduct.originalPrice ?? ''}
                      onChange={(e) =>
                        setEditingProduct({ ...editingProduct, originalPrice: e.target.value ? parseFloat(e.target.value) : undefined })
                      }
                      placeholder="0.00 (optional)"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="edit-stock">Stock</Label>
                    <Input
                      id="edit-stock"
                      type="number"
                      value={editingProduct.stock}
                      onChange={(e) =>
                        setEditingProduct({ ...editingProduct, stock: parseInt(e.target.value) || 0 })
                      }
                      placeholder="0"
                    />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-category">Category *</Label>
                  <Select
                    value={editingProduct.category}
                    onValueChange={(value) =>
                      setEditingProduct({ ...editingProduct, category: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categoryOptions.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>Image URLs</Label>
                  <div className="text-xs text-muted-foreground -mt-1 space-y-0.5">
                    <p>Use a direct image URL. Recommended free hosts:</p>
                    <p>• <a href="https://imgbb.com" target="_blank" rel="noreferrer" className="underline text-primary">imgbb.com</a> — upload → copy "Direct link"</p>
                    <p>• <a href="https://imgur.com" target="_blank" rel="noreferrer" className="underline text-primary">imgur.com</a> — upload → right-click image → copy image address</p>
                  </div>
                  {editImageUrls.map((url, idx) => (
                    <div key={idx} className="flex gap-2 items-center">
                      <Input
                        value={url}
                        onChange={(e) => {
                          const updated = [...editImageUrls];
                          updated[idx] = e.target.value;
                          setEditImageUrls(updated);
                        }}
                        placeholder={idx === 0 ? 'https://i.ibb.co/xxx/image.jpg' : 'Additional image URL'}
                      />
                      {editImageUrls.length > 1 && (
                        <button type="button" onClick={() => setEditImageUrls(editImageUrls.filter((_, i) => i !== idx))}>
                          <XCircle className="h-5 w-5 text-destructive" />
                        </button>
                      )}
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="w-fit gap-1"
                    onClick={() => setEditImageUrls([...editImageUrls, ''])}
                  >
                    <PlusCircle className="h-4 w-4" />
                    Add another image
                  </Button>
                </div>
              </div>
            )}
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveEdit} disabled={updateProduct.isPending}>
                {updateProduct.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Save Changes
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Search */}
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Table */}
        <div className="border border-border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead>Product</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead>Rating</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProducts.map((product) => (
                <TableRow key={product.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <img
                        src={getPrimaryImage(product.image)}
                        alt={product.name}
                        className="w-12 h-12 rounded-lg object-cover"
                      />
                      <div>
                        <p className="font-medium">{product.name}</p>
                        <p className="text-sm text-muted-foreground line-clamp-1">
                          {product.description}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{product.category}</Badge>
                  </TableCell>
                  <TableCell className="font-medium">
                    ${Number(product.price).toFixed(2)}
                  </TableCell>
                  <TableCell>
                    <span
                      className={`font-medium ${
                        product.stock < 10 ? 'text-destructive' : 'text-foreground'
                      }`}
                    >
                      {product.stock}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <span className="text-warning">★</span>
                      <span>{Number(product.rating).toFixed(1)}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onSelect={(e) => {
                          e.preventDefault();
                          handleEditProduct(product);
                        }}>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive"
                          onSelect={(e) => {
                            e.preventDefault();
                            handleDeleteProduct(product.id);
                          }}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </AdminLayout>
  );
}
