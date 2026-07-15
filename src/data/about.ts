import {
  ShieldCheck,
  BadgeCheck,
  PackageCheck,
  Truck,
  Headphones,
  HeartHandshake,
  Target,
  Lightbulb,
  Eye,
  type LucideIcon,
} from "lucide-react";

// ============================================================
// About Page — Central Data & Configuration
// ============================================================
// All text, stats, and content is defined here so the admin can
// easily update it from a single location.
// ============================================================

export interface AboutConfig {
  hero: {
    badge: string;
    title: string;
    description: string;
    primaryCta: { label: string; href: string };
    secondaryCta: { label: string; href: string };
  };
  brandStory: {
    title: string;
    paragraphs: string[];
    imageAlt: string;
  };
  trustStats: TrustStat[];
  whyChooseUs: TrustCard[];
  mission: {
    title: string;
    items: string[];
  };
  vision: {
    title: string;
    items: string[];
  };
  coreValues: CoreValue[];
  trustProcess: TrustStep[];
  shoppingConfidence: {
    title: string;
    description: string;
    policies: PolicyLink[];
  };
  support: {
    title: string;
    description: string;
    buttons: SupportButton[];
  };
  finalCta: {
    title: string;
    description: string;
    primaryCta: { label: string; href: string };
    secondaryCta: { label: string; href: string };
  };
  seo: {
    title: string;
    description: string;
    canonical: string;
    ogTitle: string;
    ogDescription: string;
    ogImage: string;
  };
}

// ============================================================
// Types
// ============================================================

export interface TrustStat {
  label: string;
  value: string;
  suffix?: string;
}

export interface TrustCard {
  icon: LucideIcon;
  title: string;
  description: string;
}

export interface CoreValue {
  icon: LucideIcon;
  title: string;
  description: string;
}

export interface TrustStep {
  step: number;
  title: string;
  description: string;
}

export interface PolicyLink {
  title: string;
  description: string;
  href: string;
}

export interface SupportButton {
  label: string;
  href: string;
  variant: "primary" | "secondary";
  icon?: LucideIcon;
}

// ============================================================
// Default Configuration
// ============================================================

export const aboutConfig: AboutConfig = {
  hero: {
    badge: "About RealGadgetBD",
    title: "Technology You Can Trust, Service You Can Rely On.",
    description:
      "RealGadgetBD is built to make gadget shopping in Bangladesh simpler, safer, and more dependable. We carefully select useful technology products and support our customers from product discovery to after-sales assistance.",
    primaryCta: { label: "Explore Our Products", href: "/products" },
    secondaryCta: { label: "Contact Our Team", href: "/contact" },
  },

  brandStory: {
    title: "More Than a Gadget Store",
    paragraphs: [
      "RealGadgetBD was created with a simple belief: buying technology should not feel uncertain. Customers deserve accurate product information, fair pricing, reliable delivery, and support they can reach when they need help.",
      "We know the challenges of shopping for gadgets online in Bangladesh — concerns about product authenticity, unclear specifications, hidden conditions, and difficult return processes. These frustrations inspired us to build a different kind of store.",
      "At RealGadgetBD, we focus on honesty and clarity in everything we do. From how we present product details to how we handle orders and support, our goal is to make your experience straightforward and worry-free.",
      "We are not the biggest store, and we do not claim to be perfect. But we are committed to continuous improvement, listening to our customers, and providing a dependable place for technology shopping in Bangladesh.",
    ],
    imageAlt: "RealGadgetBD workspace with gadgets and accessories",
  },

  trustStats: [
    { label: "Products Available", value: "100+" },
    { label: "Orders Delivered", value: "500+" },
    { label: "Happy Customers", value: "450+" },
    { label: "Support", value: "7 Days", suffix: "a week" },
  ],

  whyChooseUs: [
    {
      icon: BadgeCheck,
      title: "Authentic Product Commitment",
      description:
        "We aim to source genuine, quality-checked products and clearly communicate the condition and specifications of every item.",
    },
    {
      icon: Eye,
      title: "Transparent Product Information",
      description:
        "Customers should know what they are buying. We display clear specifications, pricing, stock status, warranty information, and important conditions.",
    },
    {
      icon: ShieldCheck,
      title: "Secure and Flexible Payment",
      description:
        "We support Cash on Delivery, bKash, and Nagad so you can choose the option that works best for you.",
    },
    {
      icon: Truck,
      title: "Reliable Delivery",
      description:
        "Orders are processed carefully and delivered through our trusted delivery partners across supported locations in Bangladesh.",
    },
    {
      icon: Headphones,
      title: "Easy Customer Support",
      description:
        "Reach us through phone, WhatsApp, Messenger, or email. We are here to help before and after your purchase.",
    },
    {
      icon: HeartHandshake,
      title: "After-Sales Assistance",
      description:
        "We remain available after product delivery for warranty guidance, product-related questions, and eligible issue resolution.",
    },
  ],

  mission: {
    title: "Our Mission",
    items: [
      "Provide a reliable selection of technology products",
      "Present honest and accurate product information",
      "Maintain fair and transparent pricing",
      "Offer a convenient and smooth shopping experience",
      "Deliver responsive and helpful customer support",
      "Build long-term trust with every order",
    ],
  },

  vision: {
    title: "Our Vision",
    items: [
      "To become one of Bangladesh's most dependable technology shopping destinations",
      "Build lasting customer relationships through trust and consistency",
      "Continuously improve the quality of products and services we offer",
      "Make technology accessible and approachable for everyone",
      "Set a standard for honest and transparent e-commerce in Bangladesh",
    ],
  },

  coreValues: [
    {
      icon: Eye,
      title: "Honesty",
      description:
        "We communicate product details, pricing, availability, and policies as clearly as possible.",
    },
    {
      icon: BadgeCheck,
      title: "Quality",
      description:
        "We focus on products that provide practical value, reliable performance, and a better customer experience.",
    },
    {
      icon: HeartHandshake,
      title: "Customer First",
      description:
        "We listen to customer questions, concerns, and feedback before and after an order.",
    },
    {
      icon: Lightbulb,
      title: "Continuous Improvement",
      description:
        "We continuously improve our product selection, website experience, delivery process, and support system.",
    },
  ],

  trustProcess: [
    {
      step: 1,
      title: "Careful Product Selection",
      description:
        "Products are selected based on usefulness, demand, quality, and customer value.",
    },
    {
      step: 2,
      title: "Clear Product Presentation",
      description:
        "Specifications, images, price, warranty details, and available options are clearly shown.",
    },
    {
      step: 3,
      title: "Order Confirmation",
      description:
        "The customer receives proper confirmation through our order system and supported communication channels.",
    },
    {
      step: 4,
      title: "Careful Packaging and Delivery",
      description:
        "The order is prepared and handed over to the appropriate delivery service with care.",
    },
    {
      step: 5,
      title: "Post-Purchase Support",
      description:
        "Customers can contact support for eligible warranty questions, usage guidance, or order-related issues.",
    },
  ],

  shoppingConfidence: {
    title: "Shop with Greater Confidence",
    description:
      "Trust comes from clear policies and accessible support. Review our policies to understand how we protect your interests.",
    policies: [
      {
        title: "Shipping Policy",
        description: "Learn about our delivery areas, timeframes, and shipping costs.",
        href: "/shipping-policy",
      },
      {
        title: "Return and Refund Policy",
        description: "Understand our process for returns, exchanges, and eligible refunds.",
        href: "/return-policy",
      },
      {
        title: "Warranty Policy",
        description: "Details about product warranty coverage and how to claim support.",
        href: "/warranty-policy",
      },
      {
        title: "Privacy Policy",
        description: "How we handle and protect your personal information.",
        href: "/privacy-policy",
      },
    ],
  },

  support: {
    title: "We're Here Before and After Your Purchase",
    description:
      "Have a question about a product, order, or need help with something else? Our support team is ready to assist you.",
    buttons: [
      {
        label: "Chat on WhatsApp",
        href: "https://wa.me/8801234567890?text=Hello%20RealGadgetBD%2C%20I%20need%20help%20regarding%20a%20product%20or%20order.",
        variant: "primary",
      },
      {
        label: "Contact Support",
        href: "/contact",
        variant: "secondary",
      },
    ],
  },

  finalCta: {
    title: "Ready to Find Your Next Gadget?",
    description:
      "Explore carefully selected gadgets, accessories, and technology products backed by clear information and dependable support.",
    primaryCta: { label: "Shop Now", href: "/products" },
    secondaryCta: { label: "Talk to Our Team", href: "/contact" },
  },

  seo: {
    title: "About RealGadgetBD | Trusted Gadget Store in Bangladesh",
    description:
      "Learn about RealGadgetBD, our commitment to reliable gadgets, transparent shopping, dependable delivery, and customer-focused support across Bangladesh.",
    canonical: "https://realgadgetbd.com/about",
    ogTitle: "About RealGadgetBD | Trusted Gadget Store in Bangladesh",
    ogDescription:
      "Learn about RealGadgetBD, our commitment to reliable gadgets, transparent shopping, dependable delivery, and customer-focused support across Bangladesh.",
    ogImage: "/2.png",
  },
};

// ============================================================
// Support Hours
// ============================================================
export const SUPPORT_HOURS = "Saturday – Thursday, 10:00 AM – 8:00 PM";

// ============================================================
// Helper: Extract clean WhatsApp number from store phone
// ============================================================
export function getWhatsAppNumber(phone: string): string {
  // Remove all non-digit characters
  const digits = phone.replace(/[^0-9]/g, "");
  // If starts with 0, remove leading zero (international format)
  return digits.startsWith("0") && digits.length > 10
    ? digits.slice(1)
    : digits || "8801234567890"; // fallback placeholder
}
