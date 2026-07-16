import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  Star, 
  Heart, 
  ShoppingCart,
  Zap,
  Minus, 
  Plus, 
  ChevronLeft,
  ChevronRight,
  Loader2,
  Package,
} from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ProductCard } from '@/components/products/ProductCard';
import { ReviewList } from '@/components/reviews/ReviewList';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';
import { useProduct, useProducts } from '@/hooks/useProducts';
import { useCart } from '@/context/CartContext';
import { useFavorites } from '@/hooks/useFavorites';
import { useReviews } from '@/hooks/useReviews';
import { useCurrency } from '@/hooks/useCurrency';
import { normalizeImageUrl } from '@/lib/image-utils';

// Build gallery from product's actual images only (pipe-separated)
const getGalleryImages = (image: string | null | undefined): string[] => {
  if (!image) return ['/placeholder.svg'];
  const imgs = image.split('|').map(normalizeImageUrl).filter(Boolean);
  return imgs.length > 0 ? imgs : ['/placeholder.svg'];
};

const ProductDetail = () => {
  const { id: rawSlug } = useParams();
  const id = rawSlug || '';
  const { addToCart } = useCart();
  const { toggleFavorite, isFavorite } = useFavorites();
  const navigate = useNavigate();
  const [quantity, setQuantity] = useState(1);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const { formatCurrency } = useCurrency();

  const { data: product, isLoading, isFetching } = useProduct(id || '');
  const { data: allProducts = [] } = useProducts();
  
  const {
    reviews,
    loading: reviewsLoading,
    userReview,
    averageRating,
    ratingDistribution,
    submitReview,
    updateReview,
    deleteReview,
  } = useReviews(id || '');

  // Redirect UUID URLs to slug URLs once product is loaded
  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!isLoading && product && uuidPattern.test(id)) {
    import('@/lib/slug').then(({ slugify }) => {
      navigate(`/products/${slugify(product.name)}`, { replace: true });
    });
  }

  // Show loader while fetching — never show "Not Found" during load
  if (isLoading || isFetching) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </main>
        <Footer />
      </div>
    );
  }

  // Only show Not Found after fetch is truly complete and returned nothing
  if (!product && !isLoading && !isFetching) {
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

  // TypeScript guard — product is guaranteed defined below this line
  if (!product) return null;

  const galleryImages = getGalleryImages(product.image);
  const discount = product.originalPrice && Number(product.originalPrice) > Number(product.price)
    ? Math.round(((Number(product.originalPrice) - Number(product.price)) / Number(product.originalPrice)) * 100)
    : 0;

  const relatedProducts = allProducts
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

  // Convert DB product to cart-compatible format
  const cartProduct = {
    id: product.id,
    name: product.name,
    description: product.description || '',
    price: Number(product.price),
    image: product.image || '/placeholder.svg',
    category: product.category,
    rating: Number(product.rating),
    reviews: product.reviews,
    stock: product.stock,
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 py-8">
        <div className="container">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-xs md:text-sm text-muted-foreground mb-4 md:mb-6 overflow-x-auto whitespace-nowrap pb-2">
            <Link to="/" className="hover:text-foreground shrink-0">Home</Link>
            <span className="shrink-0">/</span>
            <Link to="/products" className="hover:text-foreground shrink-0">Products</Link>
            <span className="shrink-0">/</span>
            <Link to={`/products?category=${product.category}`} className="hover:text-foreground shrink-0">
              {product.category}
            </Link>
            <span className="shrink-0">/</span>
            <span className="text-foreground truncate max-w-[120px] md:max-w-none">{product.name}</span>
          </nav>

          {/* Product Section */}
          <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] xl:grid-cols-[620px_minmax(0,1fr)] gap-6 xl:gap-8 mb-6 lg:mb-10 items-start">
            {/* Image Gallery */}
            <div className="space-y-4 lg:max-w-xl lg:mx-auto">
              <div className="relative aspect-square bg-secondary/50 rounded-2xl overflow-hidden group">
                <img
                  src={galleryImages[selectedImageIndex]}
                  alt={product.name}
                  className="w-full h-full object-contain p-2"
                />
                
                {/* Navigation Arrows - only show when multiple images */}
                {galleryImages.length > 1 && (
                  <>
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
                  </>
                )}

                {/* Discount Badge */}
                {discount > 0 && (
                  <Badge className="absolute top-4 left-4 gradient-primary border-0 text-sm">
                    -{discount}% OFF
                  </Badge>
                )}
              </div>

              {/* Thumbnails - only show when multiple images */}
              {galleryImages.length > 1 && (
                <div className="flex gap-2 md:gap-3 overflow-x-auto pb-2">
                  {galleryImages.map((img, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedImageIndex(index)}
                      className={`w-14 h-14 md:w-20 md:h-20 rounded-lg overflow-hidden border-2 transition-all shrink-0 ${
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
              )}
            </div>

            {/* Product Info */}
            <div className="space-y-6">
              <div>
                <p className="text-sm text-primary font-medium uppercase tracking-wide mb-2">
                  {product.category}
                </p>
                <h1 className="text-xl md:text-3xl lg:text-4xl font-bold mb-3 md:mb-4">{product.name}</h1>
                
                {/* Rating */}
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1">
                    {renderStars(Math.round(Number(product.rating)))}
                  </div>
                  <span className="font-medium">{Number(product.rating).toFixed(1)}</span>
                  <span className="text-muted-foreground">
                    ({product.reviews.toLocaleString()} reviews)
                  </span>
                </div>
              </div>

              {/* Price */}
              <div className="flex items-baseline gap-3">
                <span className="text-2xl md:text-4xl font-bold text-primary">
                  {formatCurrency(Number(product.price))}
                </span>
              </div>



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
              <div className="flex gap-2 md:gap-4">
                <Button
                  variant="secondary"
                  size="default"
                  className="flex-1 gap-1 md:gap-2 text-xs md:text-sm px-2 md:px-4"
                  onClick={() => addToCart(cartProduct as any, quantity)}
                  disabled={product.stock === 0}
                >
                  <ShoppingCart className="h-4 w-4 md:h-5 md:w-5" />
                  <span className="hidden sm:inline">Add to Cart</span>
                  <span className="sm:hidden">Cart</span>
                </Button>
                <Button
                  variant="hero"
                  size="default"
                  className="flex-1 gap-1 md:gap-2 text-xs md:text-sm px-2 md:px-4"
                  onClick={() => {
                    addToCart(cartProduct as any, quantity);
                    navigate('/cart');
                  }}
                  disabled={product.stock === 0}
                >
                  <Zap className="h-4 w-4 md:h-5 md:w-5" />
                  Buy Now
                </Button>
                <Button
                  variant="outline"
                  size="default"
                  className={`px-2 md:px-4 ${favorite ? 'text-destructive border-destructive/30' : ''}`}
                  onClick={() => toggleFavorite(product.id)}
                >
                  <Heart className={`h-4 w-4 md:h-5 md:w-5 ${favorite ? 'fill-destructive' : ''}`} />
                </Button>
              </div>

              {/* Delivery & Return Policy Accordion */}
              <div className="bg-card border border-border rounded-xl overflow-hidden">
                <Accordion type="single" collapsible>
                  <AccordionItem value="delivery">
                    <AccordionTrigger className="px-4 py-3 text-sm font-semibold hover:no-underline">
                      <div className="flex items-center gap-2">
                        <Package className="h-4 w-4 text-primary" />
                        Delivery &amp; Return Policy
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-4 pb-4">
                      <div className="space-y-3 text-sm text-muted-foreground">
                        <div>
                          <h4 className="font-medium text-foreground mb-1">Delivery Options</h4>
                          <ul className="space-y-1.5">
                            <li className="flex justify-between">
                              <span>Inside Dhaka</span>
                              <span className="font-medium text-success">80 BDT</span>
                            </li>
                            <li className="flex justify-between">
                              <span>Outside Dhaka</span>
                              <span className="font-medium text-success">120 BDT</span>
                            </li>
                            {/* <li className="flex justify-between">
                              <span>Cash on Delivery</span>
                              <span className="font-medium text-success">Free</span>
                            </li> */}
                          </ul>
                        </div>
                        <div>
                          <h4 className="font-medium text-foreground mb-1">Return Policy</h4>
                          <p>
                            Products can be returned within 7 days of delivery if unused and 
                            in original packaging. Contact our support team to initiate a return.
                          </p>
                        </div>
                        <div>
                          <h4 className="font-medium text-foreground mb-1">Secure Payment</h4>
                          <p>
                            We accept Cash on Delivery, bKash, and Nagad. Your payment 
                            information is processed securely.
                          </p>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </div>
            </div>
          </div>

          {/* Tabs Section */}
          <Tabs defaultValue="description" className="mb-16">
            <TabsList className="w-full max-w-md grid grid-cols-3">
              <TabsTrigger value="description">Description</TabsTrigger>
              <TabsTrigger value="reviews">
                Reviews ({reviewsLoading ? product.reviews : reviews.length})
              </TabsTrigger>
              <TabsTrigger value="shipping">Shipping</TabsTrigger>
            </TabsList>

            <TabsContent value="description" className="mt-6">
              <div className="bg-card border border-border rounded-xl p-6 md:p-8">
                <h3 className="text-xl font-semibold mb-4">Product Description</h3>
                <div className="text-muted-foreground space-y-1.5 leading-relaxed">
                  {product.description?.split('\n').map((line, i) => {
                    const trimmed = line.trim();
                    if (!trimmed) return <div key={i} className="h-2" />;
                    if (trimmed.startsWith('*') || trimmed.startsWith('•')) {
                      const text = trimmed.replace(/^[*•]\s*/, '');
                      return (
                        <div key={i} className="flex items-start gap-2">
                          <span className="text-primary mt-1 shrink-0">•</span>
                          <span>{text}</span>
                        </div>
                      );
                    }
                    return <p key={i}>{trimmed}</p>;
                  })}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="reviews" className="mt-6">
              <ReviewList
                reviews={reviews}
                averageRating={averageRating}
                totalReviews={reviews.length}
                ratingDistribution={ratingDistribution}
                userReview={userReview}
                onSubmit={submitReview}
                onUpdate={updateReview}
                onDelete={deleteReview}
                loading={reviewsLoading}
              />
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
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
                {relatedProducts.map((relatedProduct) => (
                  <ProductCard key={relatedProduct.id} product={relatedProduct as any} />
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
