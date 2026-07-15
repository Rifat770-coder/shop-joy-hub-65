import { useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

export default function WarrantyPolicy() {
  useEffect(() => {
    document.title = "Warranty Policy | RealGadget BD";
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
              <ShieldCheck className="h-5 w-5 text-orange-600" />
            </div>
            <h1 className="text-3xl font-bold">Warranty Policy</h1>
          </div>

          <div className="prose prose-slate dark:prose-invert max-w-none space-y-6">
            <p className="text-lg text-muted-foreground">
              This page provides information about product warranty coverage at RealGadgetBD.
            </p>

            <h2 className="text-xl font-semibold mt-8">Warranty Coverage</h2>
            <p className="text-muted-foreground">
              Warranty coverage varies by product and brand. Specific warranty
              information is displayed on each product page. Please review the
              warranty details before making a purchase.
            </p>

            <h2 className="text-xl font-semibold">What Is Covered</h2>
            <p className="text-muted-foreground">
              Warranties typically cover manufacturing defects and functional
              issues that arise during normal use within the specified warranty
              period. Coverage details are provided with each product.
            </p>

            <h2 className="text-xl font-semibold">What Is Not Covered</h2>
            <p className="text-muted-foreground">
              Damage caused by accidents, misuse, unauthorized modifications,
              normal wear and tear, or issues arising from improper usage are
              generally not covered under warranty.
            </p>

            <h2 className="text-xl font-semibold">How to Claim Warranty</h2>
            <p className="text-muted-foreground">
              To make a warranty claim, please contact our support team with
              your order details and a description of the issue. We will assess
              the situation and guide you through the next steps.
            </p>

            <div className="p-4 bg-muted/30 rounded-lg border border-border/50 mt-8">
              <p className="text-sm text-muted-foreground">
                <strong>Note:</strong> Warranty terms may differ between
                products. Always check the product page for specific warranty
                information. For questions,{" "}
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
