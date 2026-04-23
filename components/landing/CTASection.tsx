import Link from 'next/link';
import { Button } from '@/components/ui/button';

export function CTASection() {
  return (
    <section className="bg-teal-dark px-4 py-16 text-white md:px-8">
      <div className="mx-auto max-w-4xl text-center">
        <h2 className="text-3xl font-semibold">Ready to close the gap?</h2>
        <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
          <Link href="/auth/signup?role=health-worker">
            <Button className="w-full bg-white text-teal-dark hover:bg-teal-100 sm:w-auto">Register as Health Worker</Button>
          </Link>
          <Link href="/auth/signup?role=donor">
            <Button variant="outline" className="w-full border-white text-white hover:bg-white/20 sm:w-auto">
              Register as Donor / NGO
            </Button>
          </Link>
        </div>
        <p className="mt-8 text-sm text-white/80">VITE Health - Built on XION - GIA 2026</p>
      </div>
    </section>
  );
}





