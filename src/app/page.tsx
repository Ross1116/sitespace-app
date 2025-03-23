import { Hero } from "@/components/ui/hero/hero";
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
      <div className="block max-h-dvh">
        <Hero />
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
