import { AuthGuard } from "@/components/auth/auth-guard";
import { Hero } from "@/components/sections/hero";
import { AccessChat } from "@/components/sections/layer-access-chat";
import { Intelligence } from "@/components/sections/layer-intelligence";
import { TrustLedger } from "@/components/sections/layer-trust-ledger";
import { DataVault } from "@/components/sections/layer-data-vault";
import { FinancialSystem } from "@/components/sections/layer-financial";

export default function Home() {
  return (
    <AuthGuard>
      <main className="relative flex-1">
        <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(90%_60%_at_50%_0%,rgba(0,230,118,.16),rgba(0,0,0,0)_60%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(80%_60%_at_20%_20%,rgba(255,255,255,.06),rgba(0,0,0,0)_55%)]" />
          <div className="agri-noise absolute inset-0 opacity-40" />
        </div>

        <Hero />
        <AccessChat />
        <Intelligence />
        <TrustLedger />
        <DataVault />
        <FinancialSystem />
        <footer className="px-6 pb-16 pt-10">
          <div className="mx-auto max-w-6xl rounded-2xl border border-white/10 bg-white/5 px-6 py-6 backdrop-blur-3xl">
            <p className="text-sm tracking-tight text-white/80">
              Trust is infrastructure. <span className="text-white/60">Not data. Decisions.</span>
            </p>
          </div>
        </footer>
      </main>
    </AuthGuard>
  );
}
