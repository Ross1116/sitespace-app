import { MoveRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

function Hero() {
  return (
    <div className="w-full py-12 md:py-16 lg:py-27">
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
              <p className="text-base sm:text-lg md:text-xl leading-relaxed tracking-tight text-muted-foreground max-w-md text-left">
                Managing a small business today is already tough. Avoid further
                complications by ditching outdated, tedious trade methods. Our
                goal is to streamline SMB trade, making it easier and faster
                than ever.
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
                <Button size="lg" className="gap-2 w-full sm:w-auto cursor-pointer">
                  Sign up <MoveRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          </div>
          <div className="bg-muted rounded-md aspect-square w-full"></div>
        </div>
      </div>
    </div>
  );
}

export { Hero };
