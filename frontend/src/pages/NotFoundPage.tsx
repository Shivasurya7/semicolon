import { ArrowLeft } from 'lucide-react'
import { Button } from '../components/ui/Button.tsx'
import { Wordmark } from '../components/ui/Wordmark.tsx'

function NotFoundPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-marketing flex-col items-start justify-center gap-6 px-4">
      <Wordmark />
      <h1 className="text-h1-marketing font-bold text-strong">Page not found</h1>
      <p className="max-w-[35rem] text-body-lg text-secondary">This page doesn't exist, or isn't available yet.</p>
      <Button to="/" size="lg" leadingIcon={ArrowLeft}>
        Back to home
      </Button>
    </main>
  )
}

export default NotFoundPage
