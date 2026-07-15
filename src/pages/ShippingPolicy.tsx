import { useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

export default function ShippingPolicy() {
  useEffect(() => {
    document.title = "Shipping Policy | RealGadget BD";
  }, []);


  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 py-12 md:py-16">
        <div className="container max-w-3xl">
          <Button variant="ghost" asChild className="mb-6 gap-2">
            <Link to="/about">
              <ArrowLeft className="h-4 w-4" />
              Back to About
            </Link>
          </Button>

          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-100 to-teal-100 flex items-center justify-center">
              <Truck className="h-5 w-5 text-orange-600" />
            </div>
            <h1 className="text-3xl font-bold">Shipping Policy</h1>
          </div>

          <div className="prose prose-slate dark:prose-invert max-w-none space-y-6">
            <p className="text-lg text-muted-foreground">
              This page explains how RealGadgetBD handles product shipping and delivery.
            </p>

            <h2 className="text-xl font-semibold mt-8">Delivery Areas</h2>
            <p className="text-muted-foreground">
              We currently deliver to all districts across Bangladesh. Delivery
              timelines may vary based on your location.
            </p>

            <h2 className="text-xl font-semibold">Processing Time</h2>
            <p className="text-muted-foreground">
              Orders are typically processed within 1–2 business days after
              confirmation. During busy periods, processing may take slightly
              longer. You will be notified of any significant delays.
            </p>

            <h2 className="text-xl font-semibold">Shipping Charges</h2>
            <p className="text-muted-foreground">
              Shipping costs are calculated at checkout based on your delivery
              location and the selected shipping method.
            </p>

            <h2 className="text-xl font-semibold">Order Tracking</h2>
            <p className="text-muted-foreground">
              Once your order is shipped, you will receive tracking information
              through your preferred contact method. You can also track your
              order on our{" "}
              <Link to="/track-order" className="text-primary hover:underline">
                Track Order
              </Link>{" "}
              page.
            </p>

            <div className="p-4 bg-muted/30 rounded-lg border border-border/50 mt-8">
              <p className="text-sm text-muted-foreground">
                <strong>Note:</strong> This policy is a summary. For specific
                questions about shipping, please{" "}
                <Link to="/contact" className="text-primary hover:underline">
                  contact our support team
                </Link>
                .
              </p>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
