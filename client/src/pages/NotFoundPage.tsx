import { Link } from 'react-router-dom';
import { ArrowLeft, Home } from 'lucide-react';
import { SEOHead } from '@/components/common/SEOHead';
import { Container } from '@/components/layout/Container';
import { Button } from '@/components/ui/Button';

export function NotFoundPage() {
  return (
    <>
      <SEOHead
        title="Page Not Found"
        description="The page you're looking for doesn't exist or has been moved."
        noIndex
      />

      <Container>
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center py-16">
          <div className="text-8xl font-extrabold text-neutral-200 mb-4 select-none">404</div>
          <h1 className="text-2xl font-bold text-neutral-900 mb-2">Page not found</h1>
          <p className="text-neutral-500 mb-8 max-w-md">
            The page you're looking for doesn't exist or has been moved. Let's get you back on track.
          </p>
          <div className="flex items-center gap-3">
            <Link to="/">
              <Button variant="primary" icon={<Home className="h-4 w-4" />}>
                Go Home
              </Button>
            </Link>
            <Button
              variant="secondary"
              icon={<ArrowLeft className="h-4 w-4" />}
              onClick={() => window.history.back()}
            >
              Go Back
            </Button>
          </div>
        </div>
      </Container>
    </>
  );
}
