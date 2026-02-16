import FeatureGrid from "@/components/landing/FeatureGrid";
import Hero from "@/components/landing/Hero";
import ProductDemo from "@/components/landing/ProductDemo";
import { ValuePropIllustration } from "@/components/landing/ValueSection";
import { siteContent } from "@/lib/landingData";
import TestimonialCard from "@/components/landing/TestimonialCard";
import PricingCard from "@/components/landing/PricingCard";
import { TopNav } from "@/components/TopNav";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import Footer from "@/components/landing/Footer";

export default function HomePage() {
  const { valueProp, testimonials, pricing, finalCta } = siteContent;

  return (
    <div className="bg-slate-50 min-h-screen overflow-x-hidden font-sans text-slate-900">
      <TopNav />

      {/* Hero Section */}
      <Hero />

      {/* Features Grid */}
      <FeatureGrid />

      {/* Product Demo */}
      <ProductDemo />

      {/* Solutions / Value Prop Section */}
      <section
        className="py-24 bg-white border-y border-slate-100"
        id="solutions"
      >
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="order-2 lg:order-1 relative">
              <div className="absolute -inset-4 bg-gradient-to-r from-slate-100 to-slate-50 rounded-[2rem] -z-10 transform -rotate-2" />
              <ValuePropIllustration />
            </div>

            <div className="order-1 lg:order-2">
              <Badge className="mb-6 bg-slate-100 text-slate-800 hover:bg-slate-200 border-none px-3 py-1 text-sm font-medium">
                {valueProp.badge}
              </Badge>
              <h2 className="text-4xl font-bold text-slate-900 mb-6 tracking-tight">
                {valueProp.heading}
              </h2>
              <p className="text-lg text-slate-600 mb-10 leading-relaxed">
                {valueProp.subheading}
              </p>

              <div className="space-y-8">
                {valueProp.points.map((point, index) => (
                  <div key={index} className="flex items-start group">
                    <div className="flex-shrink-0 mt-1">
                      <div className="h-8 w-8 rounded-lg bg-[var(--navy)] flex items-center justify-center text-white shadow-lg shadow-slate-900/10 group-hover:scale-110 transition-transform">
                        <CheckCircle2 size={16} />
                      </div>
                    </div>
                    <div className="ml-5">
                      <h3 className="text-lg font-bold text-slate-900 mb-1">
                        {point.title}
                      </h3>
                      <p className="text-slate-600">{point.description}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-12">
                <Button
                  size="lg"
                  className="bg-[var(--navy)] hover:bg-[var(--navy-hover)] text-white h-12 px-8 text-base font-bold shadow-xl shadow-slate-900/10"
                >
                  {valueProp.cta} <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 bg-slate-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <Badge className="mb-4 bg-white text-slate-800 border border-slate-200 shadow-sm">
              {testimonials.badge}
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
              {testimonials.heading}
            </h2>
            <p className="text-lg text-slate-600">{testimonials.subheading}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.items.map((testimonial, index) => (
              <TestimonialCard key={index} {...testimonial} />
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section
        className="py-24 bg-white border-t border-slate-100"
        id="pricing"
      >
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <Badge className="mb-4 bg-[var(--navy)] text-white hover:bg-[var(--navy)]">
              {pricing.badge}
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
              {pricing.heading}
            </h2>
            <p className="text-lg text-slate-600">{pricing.subheading}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {pricing.plans.map((plan, index) => (
              <PricingCard key={index} {...plan} />
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 bg-[var(--navy)] relative overflow-hidden">
        {/* Abstract Background Shapes */}
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <svg
            className="h-full w-full"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
          >
            <path d="M0 100 C 20 0 50 0 100 100 Z" fill="white" />
          </svg>
        </div>

        <div className="container relative z-10 mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 tracking-tight">
              {finalCta.heading}
            </h2>
            <p className="text-xl text-slate-300 mb-10 leading-relaxed">
              {finalCta.subheading}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                className="bg-white text-[var(--navy)] hover:bg-slate-100 h-14 px-8 text-lg font-bold shadow-2xl"
              >
                {finalCta.primaryCta} <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-slate-700 text-white hover:bg-white/10 hover:text-white h-14 px-8 text-lg bg-transparent"
              >
                {finalCta.secondaryCta}
              </Button>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
