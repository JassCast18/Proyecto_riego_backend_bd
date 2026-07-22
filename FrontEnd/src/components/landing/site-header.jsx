import { Leaf } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 md:px-6">
        <a href="/" className="flex items-center gap-2">
          <span className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Leaf className="size-5" />
          </span>
          <span className="flex flex-col leading-none">
            <span className="font-heading text-base font-bold text-foreground">Frutas del Oasis</span>
            <span className="text-xs text-muted-foreground">Monitoreo Adaptativo</span>
          </span>
        </a>

        <nav className="hidden items-center gap-8 md:flex">
          <a href="#solucion" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
            Solución
          </a>
          <a href="#modulos" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
            Módulos
          </a>
          <a href="#tecnologia" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
            Tecnología
          </a>
        </nav>

        <div className="flex items-center gap-2">
          {/* Si usas React Router, cambia estos href por la navegación de react-router-dom */}
          <Button asChild variant="ghost" className="hidden sm:inline-flex">
            <a href="/login">Iniciar sesión</a>
          </Button>
          <Button asChild>
            <a href="/login">Acceder a la plataforma</a>
          </Button>
        </div>
      </div>
    </header>
  )
}