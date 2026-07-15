import { Link } from "react-router-dom";
import {
  Phone,
  Mail,
  MessageCircle,
  MapPin,
  Clock,
  ArrowRight,
  Facebook,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { useSettings } from "@/hooks/useSettings";
import { SUPPORT_HOURS, getWhatsAppNumber } from "@/data/about";

export default function Contact() {
  const { storeSettings } = useSettings();
  const whatsappNumber = getWhatsAppNumber(storeSettings.storePhone);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 py-12 md:py-16">
        <div className="container max-w-4xl">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
              Get in Touch
            </h1>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Have a question about a product, order, or anything else? We're
              here to help.
            </p>
          </div>

          {/* Contact Cards */}
          <div className="grid sm:grid-cols-2 gap-6 mb-8">
            <Card className="border-border/50 hover:border-primary/30 transition-colors">
              <CardContent className="p-6 flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-100 to-orange-200 dark:from-orange-900/30 dark:to-orange-800/30 flex items-center justify-center shrink-0">
                  <Phone className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Phone</h3>
                  <p className="text-sm text-muted-foreground">Call us for immediate assistance</p>
                  <p className="text-sm font-medium mt-1">{storeSettings.storePhone}</p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/50 hover:border-primary/30 transition-colors">
              <CardContent className="p-6 flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-100 to-teal-200 dark:from-teal-900/30 dark:to-teal-800/30 flex items-center justify-center shrink-0">
                  <Mail className="h-5 w-5 text-teal-600 dark:text-teal-400" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Email</h3>
                  <p className="text-sm text-muted-foreground">We respond within 24 hours</p>
                  <p className="text-sm font-medium mt-1">{storeSettings.storeEmail}</p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/50 hover:border-primary/30 transition-colors">
              <CardContent className="p-6 flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-100 to-orange-200 dark:from-orange-900/30 dark:to-orange-800/30 flex items-center justify-center shrink-0">
                  <MessageCircle className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">WhatsApp</h3>
                  <p className="text-sm text-muted-foreground">Quick replies via messaging</p>
                  <Button variant="link" className="h-auto p-0 text-sm font-medium" asChild>
                    <a
                      href={`https://wa.me/${whatsappNumber}?text=${encodeURIComponent("Hello RealGadgetBD, I need help regarding a product or order.")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Chat on WhatsApp <ArrowRight className="h-3 w-3 ml-1" />
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/50 hover:border-primary/30 transition-colors">
              <CardContent className="p-6 flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-100 to-teal-200 dark:from-teal-900/30 dark:to-teal-800/30 flex items-center justify-center shrink-0">
                  <Facebook className="h-5 w-5 text-teal-600 dark:text-teal-400" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Facebook</h3>
                  <p className="text-sm text-muted-foreground">Message us on Facebook</p>
                  <Button variant="link" className="h-auto p-0 text-sm font-medium" asChild>
                    <a
                      href="https://www.facebook.com/Official.RealGadgetBD/"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Visit our page <ArrowRight className="h-3 w-3 ml-1" />
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Support Hours & Address */}
          <Card className="border-border/50 mb-8">
            <CardContent className="p-6 grid sm:grid-cols-2 gap-6">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-100 to-teal-100 dark:from-orange-900/30 dark:to-teal-900/30 flex items-center justify-center shrink-0">
                  <Clock className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Support Hours</h3>
                  <p className="text-sm text-muted-foreground">{SUPPORT_HOURS}</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-100 to-teal-100 dark:from-orange-900/30 dark:to-teal-900/30 flex items-center justify-center shrink-0">
                  <MapPin className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Location</h3>
                  <p className="text-sm text-muted-foreground">{storeSettings.storeAddress}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Back to About */}
          <div className="text-center">
            <Button variant="outline" asChild className="gap-2">
              <Link to="/about">
                <ArrowRight className="h-4 w-4" />
                Learn More About RealGadgetBD
              </Link>
            </Button>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
