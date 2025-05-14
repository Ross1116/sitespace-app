import FeatureGrid from "@/components/landing/FeatureGrid";
import Hero from "@/components/landing/Hero";
import ProductDemo from "@/components/landing/ProductDemo";
// import { Feature } from "@/components/ui/hero/feature";
// import { Testimonials } from "@/components/ui/testimonials";
// import { testimonials } from "@/lib/data";
import { TopNav } from "@/components/TopNav";


export default function HomePage() {
  return (
    <div>
      <div>
        <TopNav />
      </div>
      <div className="block min-h-screen bg-white dark:bg-slate-950 transition-colors duration-300">
        <Hero />
      </div>
      <div>
        <FeatureGrid />
      </div>
      <div>
        <ProductDemo />
      </div>
      {/* <div className="container mx-auto">
        <Feature />
      </div>
      <div className="container pb-20 mx-auto">
        <Testimonials testimonials={testimonials} />
      </div> */}
    </div>
  );
}
