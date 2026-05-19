import Link from "next/link";
import {
  PETITION_SEARCH_INPUT_ID,
  PetitionSearch,
} from "@/components/petition-search";
import { ThemeToggle } from "@/components/theme-toggle";

const EXAMPLE_ID = "751472";

export default function HomePage() {
  return (
    <main className="flex min-h-dvh flex-col p-6 md:p-8 lg:p-10 xl:p-12">
      <header className="flex shrink-0 items-center justify-end">
        <ThemeToggle />
      </header>

      <div className="flex flex-1 flex-col justify-center py-12 md:py-16 lg:py-20">
        <div className="flex w-full max-w-5xl flex-col gap-10 md:gap-14 lg:gap-16 xl:max-w-6xl 2xl:max-w-7xl">
          <h1 className="text-balance text-4xl font-bold leading-[1.05] tracking-tight md:text-5xl lg:text-6xl xl:text-7xl 2xl:text-8xl">
            Watch any UK petition, live.
          </h1>

          <div className="flex flex-col gap-4 md:gap-5 lg:gap-6">
            <label
              htmlFor={PETITION_SEARCH_INPUT_ID}
              className="block cursor-text"
            >
              <PetitionSearch />
            </label>
            <p className="text-base text-muted-foreground md:text-lg">
              Try{" "}
              <Link
                href={`/p/${EXAMPLE_ID}`}
                className="font-medium text-primary underline-offset-4 hover:underline"
              >
                petition #{EXAMPLE_ID}
              </Link>
            </p>
          </div>
        </div>
      </div>

      <footer className="flex shrink-0 items-center justify-center text-sm text-muted-foreground md:text-base">
        Built by{" "}
        <a
          href="https://unboxed.co"
          target="_blank"
          rel="noreferrer noopener"
          className="ml-1 font-medium text-foreground underline-offset-4 hover:underline"
        >
          Unboxed
        </a>
      </footer>
    </main>
  );
}
