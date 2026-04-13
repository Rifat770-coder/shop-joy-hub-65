import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { HeroSection } from '@/components/home/HeroSection';
import { PopularProducts } from '@/components/home/PopularProducts';
import { FeaturedProducts } from '@/components/home/FeaturedProducts';
import { PromoBanner } from '@/components/home/PromoBanner';
import { useIsFlashSaleActive } from '@/hooks/useFlashSale';
import { useProducts } from '@/hooks/useProducts';

const Index = () => {
  const isFlashSaleActive = useIsFlashSaleActive();
  // Prefetch all products in background — so /products page loads instantly from cache
  useProducts();

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <HeroSection />
        <PopularProducts />
        <FeaturedProducts />
        {isFlashSaleActive && <PromoBanner />}
      </main>
      <Footer />
    </div>
  );
};

export default Index;
