import FeatureGrid from "@/components/landing/FeatureGrid";
import Hero from "@/components/landing/Hero";
import ProductDemo from "@/components/landing/ProductDemo";
import { ValuePropIllustration } from "@/components/landing/ValueSection";
import { siteContent } from "@/lib/landingData";
import TestimonialCard from "@/components/landing/TestimonialCard";
import PricingCard from "@/components/landing/PricingCard";
// import { Feature } from "@/components/ui/hero/feature";
// import { Testimonials } from "@/components/ui/testimonials";
// import { testimonials } from "@/lib/data";
import { TopNav } from "@/components/TopNav";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, ChevronRight } from "lucide-react";


export default function HomePage() {
  const { valueProp, testimonials, pricing } = siteContent
  return (
    <div>
      <div>
        <TopNav />
      </div>
      {/* <div className="block min-h-screen bg-white dark:bg-slate-950 transition-colors duration-300"> */}
      <Hero />
      {/* </div> */}
      <FeatureGrid />
      <ProductDemo />
      <section
        className="py-20 bg-white dark:bg-slate-950 overflow-hidden transition-colors duration-300"
        id="solutions"
      >
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="order-2 lg:order-1">
              <ValuePropIllustration />
            </div>
            <div className="order-1 lg:order-2">
              <Badge className="mb-4 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900 border-none">
                {valueProp.badge}
              </Badge>
              <h2 className="text-3xl font-bold text-slate-900 dark:text-white sm:text-4xl mb-6">
                {valueProp.heading}
              </h2>
              <p className="text-xl text-slate-600 dark:text-slate-300 mb-8">{valueProp.subheading}</p>

              <div className="space-y-6">
                {valueProp.points.map((point, index) => (
                  <div key={index} className="flex items-start">
                    <div className="flex-shrink-0 mt-1">
                      <div className="h-6 w-6 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                        <ChevronRight className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      </div>
                    </div>
                    <div className="ml-4">
                      <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{point.title}</h3>
                      <p className="text-slate-600 dark:text-slate-400">{point.description}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-10">
                <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white">
                  {valueProp.cta} <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>
      <section className="py-20 bg-white dark:bg-slate-950 transition-colors duration-300">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <Badge className="mb-4 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900 border-none">
              {testimonials.badge}
            </Badge>
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white sm:text-4xl mb-4">
              {testimonials.heading}
            </h2>
            <p className="text-xl text-slate-600 dark:text-slate-300">{testimonials.subheading}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.items.map((testimonial, index) => (
              <TestimonialCard
                key={index}
                quote={testimonial.quote}
                author={testimonial.author}
                role={testimonial.role}
                company={testimonial.company}
                rating={testimonial.rating}
              />
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-slate-50 dark:bg-slate-900 transition-colors duration-300" id="pricing">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <Badge className="mb-4 bg-navy-100 text-navy-800 dark:bg-navy-900 dark:text-navy-300 hover:bg-navy-100 dark:hover:bg-navy-900 border-none">
              {pricing.badge}
            </Badge>
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white sm:text-4xl mb-4">{pricing.heading}</h2>
            <p className="text-xl text-slate-600 dark:text-slate-300">{pricing.subheading}</p>
          </div>

          {/* Pricing section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {pricing.plans.map((plan, index) => (
              <PricingCard
                key={index}
                title={plan.title}
                price={plan.price}
                description={plan.description}
                features={plan.features}
                buttonText={plan.buttonText}
                popular={plan.popular}
              />
            ))}
          </div>
        </div>
      </section>

      {/* <div className="container mx-auto">
        <Feature />
      </div>
      <div className="container pb-20 mx-auto">
        <Testimonials testimonials={testimonials} />
      </div> */}
    </div>
  );
}
