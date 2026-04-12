import { AlertTriangle, Settings, Book } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface PermissionErrorProps {
  title?: string;
  description?: string;
  onRetry?: () => void;
}

export function PermissionError({ 
  title = 'Permission Denied',
  description = 'You do not have permission to access this resource.',
  onRetry,
}: PermissionErrorProps) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-600" />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            {description}
          </p>

          <div className="bg-slate-50 p-4 rounded-lg space-y-2 text-sm">
            <p className="font-semibold">Possible causes:</p>
            <ul className="space-y-1 text-muted-foreground list-disc list-inside">
              <li>Database collections may not be set up yet</li>
              <li>Document permissions may not be configured correctly</li>
              <li>Your admin role may not have the required permissions</li>
              <li>Appwrite session may have expired</li>
            </ul>
          </div>

          <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg space-y-2">
            <p className="font-semibold flex items-center gap-2 text-blue-900">
              <Book className="h-4 w-4" />
              How to fix:
            </p>
            <ol className="space-y-2 text-sm text-blue-800 list-decimal list-inside">
              <li>Run the setup script: <code className="bg-white px-2 py-1 rounded">node scripts/setup-appwrite.js</code></li>
              <li>This will create collections and set up proper permissions</li>
              <li>Then refresh this page to try again</li>
            </ol>
          </div>

          <div className="flex gap-2">
            {onRetry && (
              <Button onClick={onRetry} variant="outline">
                Try Again
              </Button>
            )}
            <Button 
              onClick={() => window.location.href = '/'}
              variant="outline"
            >
              Back to Store
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
