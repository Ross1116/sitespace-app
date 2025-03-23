import { MoveRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import Image from "next/image";
import crane from "../../../../public/hero-crane.webp";

function Hero() {
  return (
    <div className="w-full pt-24 md:pt-32 min-h-dvh">
      <div className="container px-4 mx-auto">
        <div className="grid grid-cols-1 gap-8 items-center lg:grid-cols-2">
          <div className="flex gap-4 flex-col">
            <div>
              <Badge variant="outline" className="bg-orange-200">
                We&apos;re in demo mode!
              </Badge>
            </div>
            <div className="flex gap-3 md:gap-4 flex-col">
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-7xl max-w-lg tracking-tighter text-left font-regular">
                Schedule all your assets in one go!
              </h1>
              <p className="text-sm sm:text-lg md:text-xl leading-relaxed tracking-tight text-muted-foreground max-w-md text-left">
              Take control of your site assets with seamless scheduling and smart management. 
              Our intuitive solution ensures every resource is optimized, every schedule runs smoothly, 
              and your operations stay on track — effortlessly
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 w-full sm:w-auto">
              <Link href="/login">
                <Button
                  size="lg"
                  className="gap-2 w-full sm:w-auto cursor-pointer"
                  variant="outline"
                >
                  Sign in <MoveRight className="w-4 h-4" />
                </Button>
              </Link>
              <Link href="/register">
                <Button
                  size="lg"
                  className="gap-2 w-full sm:w-auto cursor-pointer"
                >
                  Sign up <MoveRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          </div>
          <div className="bg-amber-50 rounded-xl p-3 shadow-md w-full relative">
            <div className="aspect-[4/3] md:aspect-square w-full overflow-hidden rounded-lg">
              <Image
                src={crane}
                alt="crane image"
                fill
                sizes="(max-width: 768px) 100vw, 500px"
                className="object-cover rounded-md"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export { Hero };