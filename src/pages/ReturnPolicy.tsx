import { useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

export default function ReturnPolicy() {
  useEffect(() => {
    document.title = "Return and Refund Policy | RealGadget BD";
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
              <RotateCcw className="h-5 w-5 text-orange-600" />
            </div>
            <h1 className="text-3xl font-bold">Return and Refund Policy</h1>
          </div>

          <div className="prose prose-slate dark:prose-invert max-w-none space-y-6">
            <p className="text-lg text-muted-foreground">
              This policy outlines the process for returns, exchanges, and refunds at RealGadgetBD.
            </p>

            <h2 className="text-xl font-semibold mt-8">Return Eligibility</h2>
            <p className="text-muted-foreground">
              To be eligible for a return, products must be unused and in the
              same condition as received. Please contact our support team within
              the specified return period to initiate a return request.
            </p>

            <h2 className="text-xl font-semibold">Return Process</h2>
            <p className="text-muted-foreground">
              To start a return, please reach out to our customer support team
              through phone, WhatsApp, or email. We will guide you through the
              necessary steps and provide instructions based on your situation.
            </p>

            <h2 className="text-xl font-semibold">Refunds</h2>
            <p className="text-muted-foreground">
              Once your return is received and inspected, we will notify you
              about the approval or rejection of your refund request. Approved
              refunds will be processed according to the original payment method.
            </p>

            <h2 className="text-xl font-semibold">Exchanges</h2>
            <p className="text-muted-foreground">
              If you receive a defective or incorrect product, please contact us
              immediately. We will evaluate the issue and work to resolve it as
              quickly as possible.
            </p>

            <div className="p-4 bg-muted/30 rounded-lg border border-border/50 mt-8">
              <p className="text-sm text-muted-foreground">
                <strong>Note:</strong> This policy is a general guideline. For
                specific questions about returns or refunds, please{" "}
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
