import { ScanLine, MapPin, ClipboardCheck, Search, AlertTriangle } from 'lucide-react'

/**
 * Shelf Scanning — coming soon. Once a sample is accepted at a lab or hub it has
 * to live somewhere physical (a rack, fridge or freezer shelf). This page will
 * let staff scan a shelf/location QR + the sample QR to record and manage
 * exactly where every sample is stored. For now it's an explainer of what's
 * coming.
 */
export default function ShelfScanning() {
  const features = [
    {
      icon: MapPin,
      title: 'Assign a storage location',
      body: 'Scan a shelf, rack, fridge or freezer QR, then scan each sample to record exactly where it lives. No more hunting through boxes.',
    },
    {
      icon: Search,
      title: 'Find any sample instantly',
      body: "Look up a sample and see its precise shelf position — which fridge, which rack, which slot — so anyone can retrieve it in seconds.",
    },
    {
      icon: ClipboardCheck,
      title: 'Inventory & stock counts',
      body: 'Scan a shelf to list everything that should be on it, then count what is physically there to confirm the shelf is complete.',
    },
    {
      icon: AlertTriangle,
      title: 'Catch what is missing or misplaced',
      body: 'Reconcile expected vs. actual contents — instantly flag samples that are missing, expired, or sitting on the wrong shelf.',
    },
  ]

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border bg-white p-6 dark:border-ink-700 dark:bg-ink-900 sm:p-8">
        <div className="flex items-start gap-4">
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-brand-600 text-white">
            <ScanLine size={24} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-extrabold tracking-tight">Shelf Scanning</h2>
              <span className="rounded bg-amber-500/15 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-amber-600 dark:text-amber-400">
                Coming soon
              </span>
            </div>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-500 dark:text-slate-400">
              Once a sample is accepted at a lab or hub, it needs a physical home — a
              rack, fridge or freezer shelf. Shelf Scanning will let your team manage
              exactly what is stored where, using the same QR workflow already used to
              accept and track samples in transit.
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {features.map((f) => {
          const Icon = f.icon
          return (
            <div
              key={f.title}
              className="rounded-2xl border bg-white p-5 dark:border-ink-700 dark:bg-ink-900"
            >
              <div className="mb-3 grid h-10 w-10 place-items-center rounded-lg bg-brand/10 text-brand-600 dark:text-brand-400">
                <Icon size={20} />
              </div>
              <div className="font-semibold">{f.title}</div>
              <p className="mt-1 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
                {f.body}
              </p>
            </div>
          )
        })}
      </div>

      <p className="text-center text-xs text-slate-400">
        This feature is in development and not yet available.
      </p>
    </div>
  )
}
