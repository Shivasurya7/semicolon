import { X } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Drawer } from '../../../components/patterns/Drawer.tsx'
import { IconButton } from '../../../components/ui/IconButton.tsx'
import { Wordmark } from '../../../components/ui/Wordmark.tsx'
import { iconProps } from '../../../components/ui/icon.ts'
import { navLinks, productModules } from '../landing.content.ts'

interface MobileNavDrawerProps {
  open: boolean
  onClose: () => void
}

const rowClasses =
  'flex h-11 items-center gap-3 rounded-md px-2 text-body text-primary transition-colors duration-fast ease-out hover:bg-raised'

export function MobileNavDrawer({ open, onClose }: MobileNavDrawerProps) {
  return (
    <Drawer open={open} onClose={onClose} label="Menu">
      <div className="flex items-center justify-between">
        <Wordmark />
        <IconButton icon={X} label="Close menu" iconSize={20} onClick={onClose} />
      </div>
      <nav aria-label="Mobile" className="mt-6 flex flex-col gap-6">
        <div>
          <p className="px-2 text-eyebrow font-medium uppercase text-muted">Products</p>
          <ul className="mt-2">
            {productModules.map(({ name, icon: Icon, to }) => (
              <li key={to}>
                <Link to={to} onClick={onClose} className={rowClasses}>
                  <Icon {...iconProps} size={20} className="text-accent-icon" />
                  {name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <ul className="border-t border-subtle pt-4">
          {navLinks.map(({ label, href, isRoute }) => (
            <li key={href}>
              {isRoute ? (
                <Link to={href} onClick={onClose} className={rowClasses}>
                  {label}
                </Link>
              ) : (
                <a href={href} onClick={onClose} className={rowClasses}>
                  {label}
                </a>
              )}
            </li>
          ))}
        </ul>
      </nav>
    </Drawer>
  )
}
