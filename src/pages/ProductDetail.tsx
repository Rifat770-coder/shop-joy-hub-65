import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  Star, 
  Heart, 
  ShoppingCart, 
  Minus, 
  Plus, 
  Truck, 
  Shield, 
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  User
} from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ProductCard } from '@/components/products/ProductCard';
import { products } from '@/data/products';
import { useCart } from '@/context/CartContext';
import { useFavorites } from '@/hooks/useFavorites';

// Mock reviews data
const mockReviews = [
  {
    id: '1',
    author: 'Sarah Johnson',
    rating: 5,
    date: '2024-01-10',
    title: 'Absolutely love it!',
    content: 'This product exceeded my expectations. The quality is outstanding and it arrived quickly. Would definitely recommend to anyone looking for a premium product.',
    helpful: 24,
  },
  {
    id: '2',
    author: 'Michael Chen',
    rating: 4,
    date: '2024-01-08',
    title: 'Great value for money',
    content: 'Very happy with my purchase. The product works exactly as described. Only giving 4 stars because the packaging could be better.',
    helpful: 12,
  },
  {
    id: '3',
    author: 'Emily Williams',
    rating: 5,
    date: '2024-01-05',
    title: 'Perfect!',
    content: 'Exactly what I was looking for. The build quality is impressive and it looks even better in person than in the photos.',
    helpful: 18,
  },
];

// Mock gallery images
const getGalleryImages = (mainImage: string) => [
  mainImage,
  'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&h=600&fit=crop',
  'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&h=600&fit=crop',
  'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=600&h=600&fit=crop',
];

const ProductDetail = () => {
  const { id } = useParams();
  const { addToCart } = useCart();
  const { toggleFavorite, isFavorite } = useFavorites();
  const [quantity, setQuantity] = useState(1);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  const product = products.find((p) => p.id === id);

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Product Not Found</h1>
            <Link to="/products">
              <Button>Back to Products</Button>
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const galleryImages = getGalleryImages(product.image);
  const discount = product.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  const relatedProducts = products
    .filter((p) => p.category === product.category && p.id !== product.id)
    .slice(0, 4);

  const favorite = isFavorite(product.id);

  const handlePrevImage = () => {
    setSelectedImageIndex((prev) => 
      prev === 0 ? galleryImages.length - 1 : prev - 1
    );
  };

  const handleNextImage = () => {
    setSelectedImageIndex((prev) => 
      prev === galleryImages.length - 1 ? 0 : prev + 1
    );
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }).map((_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${
          i < rating ? 'fill-warning text-warning' : 'text-muted'
        }`}
      />
    ));
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 py-8">
        <div className="container">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
            <Link to="/" className="hover:text-foreground">Home</Link>
            <span>/</span>
            <Link to="/products" className="hover:text-foreground">Products</Link>
            <span>/</span>
            <Link to={`/products?category=${product.category}`} className="hover:text-foreground">
              {product.category}
            </Link>
            <span>/</span>
            <span className="text-foreground">{product.name}</span>
          </nav>

          {/* Product Section */}
          <div className="grid lg:grid-cols-2 gap-12 mb-16">
            {/* Image Gallery */}
            <div className="space-y-4">
              <div className="relative aspect-square bg-secondary/50 rounded-2xl overflow-hidden group">
                <img
                  src={galleryImages[selectedImageIndex]}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
                
                {/* Navigation Arrows */}
                <button
                  onClick={handlePrevImage}
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-background/80 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-background"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  onClick={handleNextImage}
                  className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-background/80 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-background"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>

                {/* Discount Badge */}
                {discount > 0 && (
                  <Badge className="absolute top-4 left-4 gradient-primary border-0 text-sm">
                    -{discount}% OFF
                  </Badge>
                )}
              </div>

              {/* Thumbnails */}
              <div className="flex gap-3">
                {galleryImages.map((img, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImageIndex(index)}
                    className={`w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${
                      selectedImageIndex === index
                        ? 'border-primary'
                        : 'border-transparent hover:border-border'
                    }`}
                  >
                    <img
                      src={img}
                      alt={`${product.name} ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Product Info */}
            <div className="space-y-6">
              <div>
                <p className="text-sm text-primary font-medium uppercase tracking-wide mb-2">
                  {product.category}
                </p>
                <h1 className="text-3xl md:text-4xl font-bold mb-4">{product.name}</h1>
                
                {/* Rating */}
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1">
                    {renderStars(Math.round(product.rating))}
                  </div>
                  <span className="font-medium">{product.rating}</span>
                  <span className="text-muted-foreground">
                    ({product.reviews.toLocaleString()} reviews)
                  </span>
                </div>
              </div>

              {/* Price */}
              <div className="flex items-baseline gap-3">
                <span className="text-4xl font-bold text-primary">
                  ${product.price.toFixed(2)}
                </span>
                {product.originalPrice && (
                  <span className="text-xl text-muted-foreground line-through">
                    ${product.originalPrice.toFixed(2)}
                  </span>
                )}
              </div>

              <Separator />

              {/* Description */}
              <p className="text-muted-foreground leading-relaxed">
                {product.description}
              </p>

              {/* Stock Status */}
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${product.stock > 10 ? 'bg-success' : product.stock > 0 ? 'bg-warning' : 'bg-destructive'}`} />
                <span className="text-sm">
                  {product.stock > 10
                    ? 'In Stock'
                    : product.stock > 0
                    ? `Only ${product.stock} left`
                    : 'Out of Stock'}
                </span>
              </div>

              {/* Quantity */}
              <div className="flex items-center gap-4">
                <span className="font-medium">Quantity:</span>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="w-12 text-center font-medium">{quantity}</span>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-4">
                <Button
                  variant="hero"
                  size="xl"
                  className="flex-1 gap-2"
                  onClick={() => addToCart(product, quantity)}
                  disabled={product.stock === 0}
                >
                  <ShoppingCart className="h-5 w-5" />
                  Add to Cart
                </Button>
                <Button
                  variant="outline"
                  size="xl"
                  className={favorite ? 'text-destructive border-destructive/30' : ''}
                  onClick={() => toggleFavorite(product.id)}
                >
                  <Heart className={`h-5 w-5 ${favorite ? 'fill-destructive' : ''}`} />
                </Button>
              </div>

              {/* Trust Badges */}
              <div className="grid grid-cols-3 gap-4 pt-4">
                <div className="flex flex-col items-center text-center p-4 bg-secondary/50 rounded-lg">
                  <Truck className="h-6 w-6 text-primary mb-2" />
                  <span className="text-xs font-medium">Free Shipping</span>
                  <span className="text-xs text-muted-foreground">Orders $50+</span>
                </div>
                <div className="flex flex-col items-center text-center p-4 bg-secondary/50 rounded-lg">
                  <Shield className="h-6 w-6 text-primary mb-2" />
                  <span className="text-xs font-medium">Secure Payment</span>
                  <span className="text-xs text-muted-foreground">100% Protected</span>
                </div>
                <div className="flex flex-col items-center text-center p-4 bg-secondary/50 rounded-lg">
                  <RefreshCw className="h-6 w-6 text-primary mb-2" />
                  <span className="text-xs font-medium">Easy Returns</span>
                  <span className="text-xs text-muted-foreground">30-day Policy</span>
                </div>
              </div>
            </div>
          </div>

          {/* Tabs Section */}
          <Tabs defaultValue="description" className="mb-16">
            <TabsList className="w-full max-w-md grid grid-cols-3">
              <TabsTrigger value="description">Description</TabsTrigger>
              <TabsTrigger value="reviews">Reviews ({mockReviews.length})</TabsTrigger>
              <TabsTrigger value="shipping">Shipping</TabsTrigger>
            </TabsList>

            <TabsContent value="description" className="mt-6">
              <div className="bg-card border border-border rounded-xl p-6 md:p-8">
                <h3 className="text-xl font-semibold mb-4">Product Description</h3>
                <div className="prose prose-sm max-w-none text-muted-foreground space-y-4">
                  <p>{product.description}</p>
                  <p>
                    Experience premium quality with this exceptional product. Carefully crafted 
                    with attention to detail, it combines functionality with elegant design. 
                    Whether you're looking for everyday reliability or special occasion excellence, 
                    this product delivers on all fronts.
                  </p>
                  <h4 className="text-foreground font-medium mt-6 mb-2">Key Features:</h4>
                  <ul className="list-disc list-inside space-y-2">
                    <li>Premium quality materials for durability</li>
                    <li>Ergonomic design for comfortable use</li>
                    <li>Modern aesthetic that complements any style</li>
                    <li>Easy maintenance and care</li>
                    <li>Backed by our satisfaction guarantee</li>
                  </ul>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="reviews" className="mt-6">
              <div className="bg-card border border-border rounded-xl p-6 md:p-8">
                {/* Reviews Summary */}
                <div className="flex flex-col md:flex-row gap-8 mb-8">
                  <div className="text-center md:text-left">
                    <div className="text-5xl font-bold text-primary mb-2">
                      {product.rating}
                    </div>
                    <div className="flex justify-center md:justify-start mb-2">
                      {renderStars(Math.round(product.rating))}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Based on {product.reviews.toLocaleString()} reviews
                    </p>
                  </div>
                  <Separator orientation="vertical" className="hidden md:block" />
                  <div className="flex-1 space-y-2">
                    {[5, 4, 3, 2, 1].map((star) => (
                      <div key={star} className="flex items-center gap-3">
                        <span className="text-sm w-8">{star} ★</span>
                        <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
                          <div
                            className="h-full bg-warning rounded-full"
                            style={{
                              width: `${star === 5 ? 70 : star === 4 ? 20 : star === 3 ? 7 : 3}%`,
                            }}
                          />
                        </div>
                        <span className="text-sm text-muted-foreground w-10">
                          {star === 5 ? '70%' : star === 4 ? '20%' : star === 3 ? '7%' : '3%'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <Separator className="mb-8" />

                {/* Reviews List */}
                <div className="space-y-6">
                  {mockReviews.map((review) => (
                    <div key={review.id} className="pb-6 border-b border-border last:border-0">
                      <div className="flex items-start gap-4">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback className="bg-primary/10 text-primary">
                            {review.author.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <div>
                              <p className="font-medium">{review.author}</p>
                              <div className="flex items-center gap-2">
                                <div className="flex">
                                  {renderStars(review.rating)}
                                </div>
                                <span className="text-sm text-muted-foreground">
                                  {new Date(review.date).toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                          </div>
                          <h4 className="font-medium mb-1">{review.title}</h4>
                          <p className="text-muted-foreground text-sm">{review.content}</p>
                          <button className="text-sm text-primary mt-2 hover:underline">
                            Helpful ({review.helpful})
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <Button variant="outline" className="w-full mt-6">
                  Load More Reviews
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="shipping" className="mt-6">
              <div className="bg-card border border-border rounded-xl p-6 md:p-8">
                <h3 className="text-xl font-semibold mb-4">Shipping Information</h3>
                <div className="space-y-6 text-muted-foreground">
                  <div>
                    <h4 className="text-foreground font-medium mb-2">Delivery Options</h4>
                    <ul className="space-y-2">
                      <li className="flex items-center justify-between py-2 border-b border-border">
                        <span>Standard Shipping (5-7 business days)</span>
                        <span className="font-medium text-success">FREE</span>
                      </li>
                      <li className="flex items-center justify-between py-2 border-b border-border">
                        <span>Express Shipping (2-3 business days)</span>
                        <span className="font-medium">$9.99</span>
                      </li>
                      <li className="flex items-center justify-between py-2">
                        <span>Next Day Delivery</span>
                        <span className="font-medium">$19.99</span>
                      </li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="text-foreground font-medium mb-2">Return Policy</h4>
                    <p>
                      We offer a 30-day return policy for all items. Products must be unused 
                      and in their original packaging. Contact our customer service team to 
                      initiate a return.
                    </p>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          {/* Related Products */}
          {relatedProducts.length > 0 && (
            <section>
              <h2 className="text-2xl font-bold mb-6">Related Products</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {relatedProducts.map((relatedProduct) => (
                  <ProductCard key={relatedProduct.id} product={relatedProduct} />
                ))}
              </div>
            </section>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ProductDetail;
