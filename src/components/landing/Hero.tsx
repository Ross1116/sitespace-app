import { Badge } from '@/components/ui/badge'
import { siteContent } from '@/lib/landingData'
import { Button } from '../ui/button'
import { ArrowRight } from 'lucide-react'
import Image from 'next/image'
import { HeroIllustration } from '../ui/hero/hero-illustration'
import LogoCarousel from '../ui/hero/logo-carousel'

export default function Hero() {
  const { hero, trustedBy } = siteContent
  return (
    <div>
      <section
        className="pb-12 relative 
             bg-gradient-to-r from-white to-slate-50 
             dark:from-slate-950 dark:to-slate-900 
             pt-24 md:pt-32 lg:pt-40
             
             before:content-[''] 
             before:absolute 
             before:inset-0 
             before:bg-[url('/static/images/floor-plan.png')] 
             before:bg-[50%_auto]
             before:bg-left-center
             before:bg-no-repeat
             before:[mask-image:linear-gradient(to_right,rgba(0,0,0,0.15)_0%,rgba(0,0,0,0.0)_55%)]
        ">
        <div className="container relative z-10 mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 lg:gap-8 items-center">
            <div className="max-w-2xl">
              <Badge className="mb-4 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300 border-none">
                {hero.badge}
              </Badge>
              <h1 className="text-4xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-5xl md:text-6xl mb-6">
                {hero.heading.split("Sitespace").map((part, i, arr) => (
                  <span key={i}>
                    {part}
                    {i < arr.length - 1 && (
                      <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-orange-500">
                        Sitespace
                      </span>
                    )}
                  </span>
                ))}
              </h1>
              <p className="text-xl text-slate-600 dark:text-slate-300 mb-8">{hero.subheading}</p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white">
                  {hero.primaryCta} <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="border-slate-300 text-slate-700 dark:border-slate-700 dark:text-slate-300"
                >
                  {hero.secondaryCta}
                </Button>
              </div>
              <div className="mt-8 flex items-center">
                <div className="flex -space-x-2">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className="inline-block h-8 w-8 rounded-full ring-2 ring-white dark:ring-slate-900 overflow-hidden"
                    >
                      <Image
                        src={`https://placehold.co/32x32.png?text=${i}`}
                        alt="User avatar"
                        width={32}
                        height={32}
                        className="bg-slate-200 dark:bg-slate-700"
                      />
                    </div>
                  ))}
                </div>
                <div className="ml-3">
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    <span className="font-medium text-blue-600 dark:text-blue-400">{hero.socialProof}</span>
                  </p>
                </div>
              </div>
            </div>
            <div className="relative lg:h-[600px] flex items-center justify-center">
              <HeroIllustration />
            </div>
          </div>
        </div>
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-white dark:from-slate-950"></div>
      </section>

      <section className="py-12 bg-gradient-to-b from-white from-0% to-blue-50/70 to-30%">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-center text-xl font-bold text-slate-600 dark:text-slate-400 mb-8">{trustedBy.heading}</h2>
          <LogoCarousel logos={trustedBy.companies} />
        </div>
      </section>
    </div >
  )
}
