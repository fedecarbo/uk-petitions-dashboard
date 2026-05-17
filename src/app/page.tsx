import { PetitionSearch } from "@/components/petition-search";

export default function HomePage() {
  return (
    <main className="grid min-h-dvh place-items-center px-6">
      <div className="flex w-full max-w-2xl flex-col items-center gap-10 md:gap-14">
        <p className="text-xs font-medium text-muted-foreground md:text-sm">
          UK Petitions · Live Dashboard
        </p>
        <PetitionSearch />
      </div>
    </main>
  );
}
