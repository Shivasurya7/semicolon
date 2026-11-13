import { Search } from 'lucide-react'
import { IconButton } from '../../../components/ui/IconButton.tsx'
import { Kbd } from '../../../components/ui/Kbd.tsx'
import { iconProps } from '../../../components/ui/icon.ts'

interface NavSearchTriggerProps {
  onOpenSearch: () => void
}

// Problem search (UI_UX_Brief §9.12): looks like an input on wide screens, an icon button below 1024 px.
export function NavSearchTrigger({ onOpenSearch }: NavSearchTriggerProps) {
  return (
    <>
      <button
        type="button"
        aria-haspopup="dialog"
        aria-keyshortcuts="Control+K Meta+K"
        onClick={onOpenSearch}
        className="hidden h-8 w-60 items-center gap-2 rounded-md border border-strong bg-input px-3 text-body text-muted transition-colors duration-fast ease-out hover:bg-raised lg:flex"
      >
        <Search {...iconProps} size={16} />
        <span>Search problems</span>
        <Kbd keyName="K" className="ml-auto" />
      </button>
      <span className="lg:hidden">
        <IconButton
          icon={Search}
          label="Search problems"
          aria-haspopup="dialog"
          aria-keyshortcuts="Control+K Meta+K"
          onClick={onOpenSearch}
        />
      </span>
    </>
  )
}
