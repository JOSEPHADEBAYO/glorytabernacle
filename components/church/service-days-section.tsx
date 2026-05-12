import { CalendarDays, Clock3, UsersRound } from 'lucide-react'

interface ServiceItem {
  label: string
  detail?: string
}

interface ServiceColumn {
  title: string
  icon: 'calendar' | 'clock' | 'community'
  items: ServiceItem[]
  kicker?: string
  highlight?: ServiceItem
}

const SERVICE_COLUMNS: ServiceColumn[] = [
  {
    title: 'Sunday Services',
    icon: 'calendar',
    items: [
      { label: '1st Service' },
      { label: '2nd Service', detail: 'Business Service' },
      { label: '1st Sunday', detail: 'Celebration' },
      { label: 'Last Sunday', detail: 'Anointing & Healing' },
    ],
  },
  {
    title: 'Weekly Activities',
    icon: 'calendar',
    kicker: 'Saturdays',
    items: [
      { label: 'Scripts2Streets (S2S)' },
      { label: 'Prayer Walk' },
      { label: 'Physical Exercise' },
    ],
  },
  {
    title: 'Daily',
    icon: 'clock',
    items: [],
    highlight: {
      label: 'Mount up',
      detail: '12:00 am -12:30 am',
    },
  },
  {
    title: 'Community',
    icon: 'community',
    items: [
      {
        label: 'Quarterly Gathering of Worshippers',
        detail: 'Friday Evening',
      },
    ],
  },
]

function ColumnIcon({ icon }: { icon: ServiceColumn['icon'] }) {
  if (icon === 'clock') {
    return <Clock3 className="h-7 w-7 shrink-0" aria-hidden="true" />
  }

  if (icon === 'community') {
    return <UsersRound className="h-7 w-7 shrink-0" aria-hidden="true" />
  }

  return <CalendarDays className="h-7 w-7 shrink-0" aria-hidden="true" />
}

function ServiceText({ item }: { item: ServiceItem }) {
  return (
    <p className="text-lg leading-[1.45] text-black lg:text-[1.35rem]">
      <span className="font-bold" style={{ color: 'rgba(0, 6, 102, 1)' }}>
        {item.label}
      </span>
      {item.detail && (
        <>
          {' '}
          <span className="font-semibold text-black">({item.detail})</span>
        </>
      )}
    </p>
  )
}

function ServiceColumnBlock({ column }: { column: ServiceColumn }) {
  return (
    <div className="min-w-0">
      <div
        className="mb-8 flex items-center gap-3"
        style={{ color: 'rgba(0, 6, 102, 1)' }}
      >
        <ColumnIcon icon={column.icon} />
        <h3 className="font-serif text-3xl font-bold leading-none tracking-normal">
          {column.title}
        </h3>
      </div>

      {column.kicker && (
        <p
          className="mb-8 text-lg font-extrabold uppercase tracking-[0.12em]"
          style={{ color: 'var(--church-green)' }}
        >
          {column.kicker}
        </p>
      )}

      {column.highlight && (
        <div className="rounded-md border border-[#c8d1e0] bg-[#dff2ff] px-4 py-5 shadow-sm">
          <p
            className="text-xl font-extrabold leading-tight lg:text-[1.35rem]"
            style={{ color: 'rgba(0, 6, 102, 1)' }}
          >
            {column.highlight.label}
          </p>
          {column.highlight.detail && (
            <p className="mt-2 text-lg font-medium leading-tight text-black lg:text-[1.35rem]">
              {column.highlight.detail}
            </p>
          )}
        </div>
      )}

      {column.items.length > 0 && (
        <div className="space-y-4 lg:space-y-5">
          {column.items.map((item) => (
            <ServiceText key={`${column.title}-${item.label}`} item={item} />
          ))}
        </div>
      )}
    </div>
  )
}

export function ServiceDaysSection() {
  return (
    <section
      aria-labelledby="service-days-heading"
      className="relative z-10 bg-[#f7fbff] px-[var(--section-padding-x)] py-20 shadow-[0_-10px_30px_rgba(0,6,102,0.06),0_12px_34px_rgba(0,6,102,0.06)] md:py-24"
    >
      <div className="mx-auto max-w-[88rem]">
        <div className="mb-16 text-center md:mb-24">
          <h2
            id="service-days-heading"
            className="font-serif text-4xl font-bold leading-tight tracking-normal md:text-5xl"
            style={{ color: 'rgba(0, 6, 102, 1)' }}
          >
            Our Services &amp; Weekly Gatherings
          </h2>
          <div
            className="mx-auto mt-7 h-1.5 w-24"
            style={{ backgroundColor: 'var(--church-red)' }}
            aria-hidden="true"
          />
        </div>

        <div className="grid grid-cols-1 gap-12 md:grid-cols-2 md:gap-x-14 md:gap-y-16 xl:grid-cols-[1.1fr_1fr_0.95fr_1.1fr] xl:gap-16">
          {SERVICE_COLUMNS.map((column) => (
            <ServiceColumnBlock key={column.title} column={column} />
          ))}
        </div>
      </div>
    </section>
  )
}
