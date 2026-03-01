import Extractor from "./extractor";
import { Toaster } from "@/components/ui/toaster";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col">
      <Extractor />
      <section className="border-t px-6 py-8 max-w-2xl mx-auto text-center text-sm text-muted-foreground">
        <h2 className="text-base font-medium text-foreground mb-3">
          Website Content Extractor
        </h2>
        <p className="mb-3">
          Extract titles, headings, text, images, and links from any website.
        </p>
        <ul className="flex flex-wrap justify-center gap-x-4 gap-y-1 text-xs">
          <li>Structured extraction</li>
          <li>Reading time</li>
          <li>Tabbed interface</li>
        </ul>
      </section>
      <Toaster />
    </main>
  );
}
