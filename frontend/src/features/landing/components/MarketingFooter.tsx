import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Wordmark } from '../../../components/ui/Wordmark.tsx'
import { MarketingContainer } from './MarketingContainer.tsx'

interface MarketingFooterProps {
  supportEmail: string
  year: number
  onSignIn: () => void
}

const linkClasses = 'rounded-xs text-body text-secondary transition-colors duration-fast ease-out hover:text-primary'

function FooterColumn({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div>
      <h3 className="text-meta font-semibold uppercase tracking-[0.04em] text-strong">{title}</h3>
      <ul className="mt-4 space-y-3">{children}</ul>
    </div>
  )
}

function FooterLink({ to, children }: { to: string; children: ReactNode }) {
  return (
    <li>
      {to.startsWith('#') ? (
        <a href={to} className={linkClasses}>
          {children}
        </a>
      ) : (
        <Link to={to} className={linkClasses}>
          {children}
        </Link>
      )}
    </li>
  )
}

export function MarketingFooter({ supportEmail, year, onSignIn }: MarketingFooterProps) {
  return (
    <footer className="mt-24 border-t pb-12 pt-16 md:mt-32">
      <MarketingContainer className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <Wordmark />
          <p className="mt-4 max-w-[16rem] text-body text-secondary">Placement prep, priced for students</p>
          <a href={`mailto:${supportEmail}`} className={`mt-3 inline-block ${linkClasses}`}>
            {supportEmail}
          </a>
          <p className="mt-6 text-meta text-muted">© {year} Semicolan</p>
        </div>
        <FooterColumn title="Product">
          <FooterLink to="/problems">Problems</FooterLink>
          <FooterLink to="/mock-tests">Mock tests</FooterLink>
          <FooterLink to="/leaderboard">Leaderboard</FooterLink>
          <FooterLink to="#pricing">Pricing</FooterLink>
        </FooterColumn>
        <FooterColumn title="Legal">
          <FooterLink to="/legal/terms">Terms</FooterLink>
          <FooterLink to="/legal/privacy">Privacy</FooterLink>
          <FooterLink to="/legal/refund-policy">Refund policy</FooterLink>
        </FooterColumn>
        <FooterColumn title="Account">
          <li>
            <button type="button" onClick={onSignIn} className={linkClasses}>
              Sign in
            </button>
          </li>
          <FooterLink to="#pricing">Pricing</FooterLink>
        </FooterColumn>
      </MarketingContainer>
    </footer>
  )
}
