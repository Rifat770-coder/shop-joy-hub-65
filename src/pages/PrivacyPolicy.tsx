import { useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, LockKeyhole } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

export default function PrivacyPolicy() {
  useEffect(() => {
    document.title = "Privacy Policy | RealGadget BD";
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
              <LockKeyhole className="h-5 w-5 text-orange-600" />
            </div>
            <h1 className="text-3xl font-bold">Privacy Policy</h1>
          </div>

          <div className="prose prose-slate dark:prose-invert max-w-none space-y-6">
            <p className="text-lg text-muted-foreground">
              This policy describes how RealGadgetBD collects, uses, and
              protects your personal information.
            </p>

            <h2 className="text-xl font-semibold mt-8">Information We Collect</h2>
            <p className="text-muted-foreground">
              We collect information you provide when making a purchase, creating
              an account, or contacting our support team. This may include your
              name, email address, phone number, shipping address, and payment
              information.
            </p>

            <h2 className="text-xl font-semibold">How We Use Your Information</h2>
            <p className="text-muted-foreground">
              Your information is used to process orders, deliver products,
              provide customer support, and improve our services. We do not sell
              or share your personal information with third parties for their
              marketing purposes.
            </p>

            <h2 className="text-xl font-semibold">Data Protection</h2>
            <p className="text-muted-foreground">
              We take reasonable precautions to protect your information.
              However, no method of electronic storage or transmission is 100%
              secure. We strive to use commercially acceptable means to protect
              your personal data.
            </p>

            <h2 className="text-xl font-semibold">Your Rights</h2>
            <p className="text-muted-foreground">
              You have the right to access, update, or request deletion of your
              personal information. Please contact us if you have any questions
              or concerns about your data.
            </p>

            <div className="p-4 bg-muted/30 rounded-lg border border-border/50 mt-8">
              <p className="text-sm text-muted-foreground">
                <strong>Note:</strong> This policy is a summary. For detailed
                questions about privacy, please{" "}
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
