import { ArrowRight, BarChart3, Command, MessageSquare, Sparkles, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

const capabilities = [
  {
    icon: MessageSquare,
    title: 'Intelligent Interface',
    description:
      'Conversational flows, AI-powered interactions, and contextual responses — the chatbot primitive, ready to compose.',
    accent: false,
  },
  {
    icon: BarChart3,
    title: 'Data at a Glance',
    description:
      'Dashboards that distil complexity. Rich visualizations, live metrics, and actionable insight surfaces built on this grid.',
    accent: true,
  },
  {
    icon: Zap,
    title: 'Built to Ship',
    description:
      'Production-ready components, type-safe APIs, and a CI pipeline that keeps you green on every push.',
    accent: false,
  },
]

const swatches = [
  { cls: 'bg-background border border-border', label: 'Background' },
  { cls: 'bg-card', label: 'Surface' },
  { cls: 'bg-muted', label: 'Muted' },
  { cls: 'bg-primary', label: 'Accent' },
  { cls: 'bg-foreground', label: 'Text' },
]

const chartBars = [
  { id: 'jan', h: 4 },
  { id: 'feb', h: 7 },
  { id: 'mar', h: 5 },
  { id: 'apr', h: 9 },
  { id: 'may', h: 6 },
  { id: 'jun', h: 8 },
  { id: 'jul', h: 7 },
  { id: 'aug', h: 10 },
  { id: 'sep', h: 8 },
  { id: 'oct', h: 11 },
  { id: 'nov', h: 9 },
  { id: 'dec', h: 12 },
]

const dotGrid = Array.from({ length: 25 }, (_, i) => ({
  id: `dot-${String(i)}`,
  highlighted: i % 7 === 0 || i % 11 === 0,
}))

function BentoGrid() {
  return (
    <div className="bento-reveal grid grid-cols-2 gap-3" style={{ animationDelay: '420ms' }}>
      {/* Chat tile */}
      <div className="bg-primary col-span-1 space-y-3 rounded-xl p-4">
        <div className="flex items-center gap-2">
          <div className="bg-primary-foreground/20 size-5 rounded-full" />
          <span className="text-primary-foreground/80 text-xs font-medium">Assistant</span>
        </div>
        <div className="space-y-2">
          <div className="bg-primary-foreground/15 text-primary-foreground rounded-lg px-3 py-2 text-xs leading-relaxed">
            How can I help you today?
          </div>
          <div className="bg-primary-foreground/25 text-primary-foreground ml-4 rounded-lg px-3 py-2 text-xs">
            Let's build something great.
          </div>
        </div>
      </div>

      {/* Stats tile */}
      <div className="border-border bg-card col-span-1 space-y-2 rounded-xl border p-4">
        <span className="text-muted-foreground text-xs font-medium tracking-wider uppercase">
          Revenue
        </span>
        <div className="font-heading text-2xl font-semibold tracking-tight">$48.2k</div>
        <div className="flex items-center gap-1 text-xs" style={{ color: 'oklch(0.72 0.17 145)' }}>
          <span>↑</span>
          <span>+12.4% this month</span>
        </div>
        <div className="mt-2 flex items-end gap-0.5">
          {chartBars.map((bar) => (
            <div
              key={bar.id}
              className="bg-primary/35 flex-1 rounded-sm"
              style={{ height: bar.h * 2.5 }}
            />
          ))}
        </div>
      </div>

      {/* Code tile */}
      <div className="border-border bg-muted col-span-1 rounded-xl border p-4">
        <div className="text-muted-foreground space-y-1.5 font-mono text-xs">
          <div>
            <span className="text-primary">const</span> app ={' '}
            <span className="text-primary">build</span>()
          </div>
          <div className="pl-2">
            <span className="text-foreground/60">design</span>:{' '}
            <span className="text-foreground/40">"system"</span>,
          </div>
          <div className="pl-2">
            <span className="text-foreground/60">scale</span>:{' '}
            <span className="text-foreground/40">∞</span>
          </div>
          <div className="text-foreground/30 mt-2">// ship with confidence</div>
        </div>
      </div>

      {/* Dot grid tile */}
      <div className="border-border/50 bg-card col-span-1 flex items-center justify-center rounded-xl border p-4">
        <div className="grid grid-cols-5 gap-1.5">
          {dotGrid.map((dot) => (
            <div
              key={dot.id}
              className="size-2 rounded-full"
              style={{
                backgroundColor: dot.highlighted
                  ? 'oklch(0.62 0.19 28 / 0.75)'
                  : 'oklch(0.87 0.018 72)',
              }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <div className="bg-background text-foreground relative min-h-screen overflow-x-hidden">
      {/* Navigation */}
      <header className="border-border/30 bg-background/70 fixed inset-x-0 top-0 z-50 border-b backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-4 md:px-6 lg:px-8">
          <div className="flex h-14 items-center justify-between">
            <div className="flex items-center gap-2">
              <Command className="text-primary size-4" />
              <span className="font-heading text-base font-semibold tracking-tight">
                Legion Security
              </span>
            </div>
            <nav className="text-muted-foreground hidden items-center gap-8 text-sm md:flex">
              <a
                href="http://localhost:8000/docs"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-foreground transition-colors duration-150"
              >
                Docs
              </a>
            </nav>
            <Button size="sm">
              Get started
              <ArrowRight className="ml-1 size-3" />
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="mesh-bg relative flex items-start pt-14 lg:min-h-screen lg:items-center">
        <div className="mx-auto w-full max-w-7xl px-4 py-10 md:px-6 md:py-16 lg:px-8 lg:py-20">
          <div className="grid grid-cols-12 items-center gap-6 lg:gap-10">
            {/* Left: content */}
            <div className="col-span-12 space-y-6 lg:col-span-7 lg:space-y-8">
              <div
                className="hero-reveal border-border/60 bg-muted/50 inline-flex items-center gap-2 rounded-full border px-3 py-1"
                style={{ animationDelay: '60ms' }}
              >
                <Sparkles className="text-primary size-3" />
                <span className="text-muted-foreground text-sm font-medium">
                  Design Foundation · v1.0
                </span>
              </div>

              <h1
                className="hero-reveal font-heading text-[clamp(2.8rem,7vw,5.5rem)] leading-[0.94] font-semibold tracking-tight"
                style={{ animationDelay: '160ms' }}
              >
                Something
                <br />
                <em className="text-primary italic">remarkable</em>
                <br />
                starts here.
              </h1>

              <p
                className="hero-reveal text-muted-foreground max-w-md text-base leading-relaxed md:text-lg"
                style={{ animationDelay: '280ms' }}
              >
                A production-ready design system built for products that matter. Composable
                components, deliberate typography, and a grid that scales.
              </p>

              <div className="hero-reveal flex flex-wrap gap-3" style={{ animationDelay: '380ms' }}>
                <Button size="lg">
                  Explore the system
                  <ArrowRight className="ml-1.5 size-4" />
                </Button>
                <Button variant="outline" size="lg">
                  View components
                </Button>
              </div>
            </div>

            {/* Right: bento preview */}
            <div className="col-span-12 lg:col-span-5">
              <BentoGrid />
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <div className="border-border/40 flex size-5 items-center justify-center rounded-full border">
            <div className="bg-muted-foreground/40 size-1.5 rounded-full" />
          </div>
        </div>
      </section>

      {/* Capabilities */}
      <section className="border-border/40 border-t py-20 lg:py-28">
        <div className="mx-auto max-w-7xl px-4 md:px-6 lg:px-8">
          <div className="grid grid-cols-12 gap-6">
            <div className="col-span-12 mb-8">
              <p className="text-primary mb-3 text-base font-medium tracking-widest uppercase">
                Capabilities
              </p>
              <h2 className="font-heading text-[clamp(1.8rem,4vw,3rem)] leading-tight font-semibold tracking-tight">
                Designed for any direction.
              </h2>
            </div>

            {capabilities.map((cap) => {
              const Icon = cap.icon
              return (
                <Card
                  key={cap.title}
                  className={`col-span-12 transition-all duration-300 hover:-translate-y-1 md:col-span-6 lg:col-span-4 ${
                    cap.accent
                      ? 'bg-primary text-primary-foreground ring-primary/20'
                      : 'hover:ring-primary/20'
                  }`}
                >
                  <CardHeader>
                    <div
                      className={`mb-2 flex size-8 items-center justify-center rounded-lg ${
                        cap.accent ? 'bg-primary-foreground/20' : 'bg-primary/15'
                      }`}
                    >
                      <Icon
                        className={`size-4 ${cap.accent ? 'text-primary-foreground' : 'text-primary'}`}
                      />
                    </div>
                    <CardTitle className={cap.accent ? 'text-primary-foreground' : ''}>
                      {cap.title}
                    </CardTitle>
                    <CardDescription className={cap.accent ? 'text-primary-foreground/70' : ''}>
                      {cap.description}
                    </CardDescription>
                  </CardHeader>
                </Card>
              )
            })}
          </div>
        </div>
      </section>

      {/* Design Language */}
      <section className="border-border/40 border-t py-20 lg:py-28">
        <div className="mx-auto max-w-7xl px-4 md:px-6 lg:px-8">
          <div className="grid grid-cols-12 gap-6 lg:gap-10">
            <div className="col-span-12 mb-8">
              <p className="text-primary mb-3 text-base font-medium tracking-widest uppercase">
                Design Language
              </p>
              <h2 className="font-heading text-[clamp(1.8rem,4vw,3rem)] leading-tight font-semibold tracking-tight">
                The system, at a glance.
              </h2>
            </div>

            {/* Typography */}
            <Card className="col-span-12 lg:col-span-7">
              <CardHeader>
                <CardTitle>Typography</CardTitle>
                <CardDescription>Fraunces display · Figtree body</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-5 pt-2">
                  <div>
                    <span className="text-muted-foreground mb-1 block text-xs">
                      Display / 5xl · opsz 144
                    </span>
                    <p
                      className="font-heading text-5xl leading-none font-semibold tracking-tight"
                      style={{ fontVariationSettings: '"opsz" 144' }}
                    >
                      Aa
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground mb-1 block text-xs">Heading / 2xl</span>
                    <p className="font-heading text-2xl font-semibold">The quick brown fox.</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground mb-1 block text-xs">Body / base</span>
                    <p className="text-muted-foreground text-base leading-relaxed">
                      Thoughtful typography creates hierarchy, guides attention, and signals quality
                      before a single feature is understood.
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground mb-1 block text-xs">Caption / xs</span>
                    <p className="text-muted-foreground text-xs tracking-widest uppercase">
                      Last updated · May 2026
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Palette + Components */}
            <div className="col-span-12 space-y-4 lg:col-span-5">
              <Card>
                <CardHeader>
                  <CardTitle>Palette</CardTitle>
                  <CardDescription>Warm dark · amber accent</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-5 gap-2 pt-2">
                    {swatches.map((s) => (
                      <div key={s.label} className="space-y-1.5">
                        <div className={`h-10 w-full rounded-md ${s.cls}`} />
                        <p className="text-muted-foreground text-center text-[10px] leading-tight">
                          {s.label}
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Components</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 pt-2">
                    <div className="flex flex-wrap gap-2">
                      <Button>Primary</Button>
                      <Button variant="outline">Outline</Button>
                      <Button variant="ghost">Ghost</Button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button size="sm">Small</Button>
                      <Button size="lg">Large</Button>
                      <Button variant="outline" size="icon">
                        <Sparkles className="size-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-border/40 border-t py-10">
        <div className="mx-auto max-w-7xl px-4 md:px-6 lg:px-8">
          <div className="text-muted-foreground flex flex-col items-center justify-between gap-4 text-sm md:flex-row">
            <div className="flex items-center gap-2">
              <Command className="text-primary size-3.5" />
              <span className="font-heading text-foreground font-medium">Legion Security</span>
            </div>
            <p>A design foundation for remarkable products.</p>
            <p>© 2026</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
