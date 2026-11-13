import { useCallback, useEffect, useRef, useState } from 'react'
import { Menu } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button } from '../../../components/ui/Button.tsx'
import { IconButton } from '../../../components/ui/IconButton.tsx'
import { Wordmark } from '../../../components/ui/Wordmark.tsx'
import { navLinks } from '../landing.content.ts'
import { MarketingContainer } from './MarketingContainer.tsx'
import { MobileNavDrawer } from './MobileNavDrawer.tsx'
import { NavSearchTrigger } from './NavSearchTrigger.tsx'
import { ProductsMenu } from './ProductsMenu.tsx'

interface MarketingNavProps {
  onSignIn: () => void
  onOpenSearch: () => void
}

const linkClasses = 'rounded-xs text-[1rem] text-primary transition-colors duration-fast ease-out hover:text-accent'

// Always opaque bg-base; only the bottom border appears once the page has scrolled (Prompt 1 §1).
export function MarketingNav({ onSignIn, onOpenSearch }: MarketingNavProps) {
  const sentinelRef = useRef<HTMLDivElement>(null)
  const [scrolled, setScrolled] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const closeDrawer = useCallback(() => setDrawerOpen(false), [])

  useEffect(() => {
    const sentinel = sentinelRef.current
    if (!sentinel) return
    const observer = new IntersectionObserver(([entry]) => setScrolled(!entry.isIntersecting))
    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [])

  return (
    <>
      <div ref={sentinelRef} aria-hidden="true" className="absolute left-0 top-0 h-px w-px" />
      <header
        data-scrolled={scrolled}
        className="sticky top-0 z-40 h-16 border-b border-transparent bg-base transition-colors duration-fast ease-out data-[scrolled=true]:border-subtle"
      >
        <MarketingContainer>
          <nav aria-label="Main" className="flex h-16 items-center gap-8">
            <Wordmark />
            <ul className="hidden items-center gap-6 md:flex">
              <li>
                <ProductsMenu />
              </li>
              {navLinks.map(({ label, href, isRoute }) => (
                <li key={href}>
                  {isRoute ? (
                    <Link to={href} className={linkClasses}>
                      {label}
                    </Link>
                  ) : (
                    <a href={href} className={linkClasses}>
                      {label}
                    </a>
                  )}
                </li>
              ))}
            </ul>
            <div className="ml-auto flex items-center gap-2 sm:gap-3">
              <NavSearchTrigger onOpenSearch={onOpenSearch} />
              <Button size="pill" onClick={onSignIn}>
                Sign in
              </Button>
              <span className="md:hidden">
                <IconButton
                  icon={Menu}
                  label="Open menu"
                  iconSize={20}
                  aria-expanded={drawerOpen}
                  onClick={() => setDrawerOpen(true)}
                />
              </span>
            </div>
          </nav>
        </MarketingContainer>
      </header>
      <MobileNavDrawer open={drawerOpen} onClose={closeDrawer} />
    </>
  )
}
