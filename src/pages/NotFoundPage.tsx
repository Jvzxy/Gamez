import { Compass } from 'lucide-react'
import { Link } from 'react-router-dom'
import { EmptyState } from '../components/ui/EmptyState'
import { useDocumentTitle } from '../lib/hooks'

export function NotFoundPage() {
  useDocumentTitle('Page not found')
  return (
    <div className="page">
      <div className="panel">
        <EmptyState
          icon={Compass}
          title="This page doesn't exist"
          action={
            <Link to="/" className="btn btn--primary">
              Back to Home
            </Link>
          }
        >
          The link may be old or mistyped. Head back Home to pick a game or catch a live match.
        </EmptyState>
      </div>
    </div>
  )
}
