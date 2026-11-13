import { Link } from 'react-router-dom'
import { iconProps } from '../../../components/ui/icon.ts'
import { moduleChips } from '../landing.content.ts'

export function ModuleChips() {
  return (
    <nav aria-label="Modules">
      <ul className="flex flex-wrap justify-center gap-2">
        {moduleChips.map(({ label, icon: Icon, to }) => (
          <li key={label}>
            <Link
              to={to}
              className="inline-flex h-9 items-center gap-1.5 rounded-md border bg-base px-2 text-body text-primary transition-colors duration-fast ease-out hover:bg-raised"
            >
              <Icon {...iconProps} size={16} className="text-muted" />
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  )
}
