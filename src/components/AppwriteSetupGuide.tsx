import { AlertTriangle, BookOpen, Terminal } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export function AppwriteSetupGuide() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-teal-50 p-4 py-12">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center gap-3 mb-8">
          <AlertTriangle className="h-8 w-8 text-orange-600" />
          <h1 className="text-3xl font-bold">Appwrite Setup Required</h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Missing Database Collections</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Your Appwrite project doesn't have the required collections yet. Follow these steps to set it up:
            </p>

            <div className="space-y-4 bg-slate-50 p-4 rounded-lg">
              <div>
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <span className="bg-orange-600 text-white rounded-full h-6 w-6 flex items-center justify-center text-sm">1</span>
                  Get Your Appwrite Credentials
                </h3>
                <ul className="text-sm text-muted-foreground ml-8 space-y-1">
                  <li>• Go to <a href="https://cloud.appwrite.io" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">cloud.appwrite.io</a></li>
                  <li>• Create or select your project</li>
                  <li>• Navigate to Settings → API endpoint and copy it</li>
                  <li>• Navigate to Settings → API Keys → Create new API key with database permissions</li>
                  <li>• Add Project ID and Database ID from project overview</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <span className="bg-orange-600 text-white rounded-full h-6 w-6 flex items-center justify-center text-sm">2</span>
                  Update Your .env File
                </h3>
                <div className="ml-8 bg-slate-800 text-slate-100 p-3 rounded font-mono text-xs space-y-1 overflow-x-auto">
                  <div>VITE_APPWRITE_ENDPOINT=your-endpoint</div>
                  <div>VITE_APPWRITE_PROJECT_ID=your-project-id</div>
                  <div>VITE_APPWRITE_DATABASE_ID=your-database-id</div>
                  <div>VITE_ADMIN_EMAILS=your-admin-email@example.com</div>
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <span className="bg-orange-600 text-white rounded-full h-6 w-6 flex items-center justify-center text-sm">3</span>
                  Run the Setup Script
                </h3>
                <div className="ml-8 bg-slate-800 text-slate-100 p-3 rounded font-mono text-xs flex items-center gap-2">
                  <Terminal className="h-4 w-4 flex-shrink-0" />
                  <code>node scripts/setup-appwrite.js</code>
                </div>
                <p className="text-sm text-muted-foreground ml-8 mt-2">
                  This will create all the required collections and indexes in your Appwrite database.
                </p>
              </div>

              <div>
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <span className="bg-orange-600 text-white rounded-full h-6 w-6 flex items-center justify-center text-sm">4</span>
                  Refresh Your Browser
                </h3>
                <p className="text-sm text-muted-foreground ml-8">
                  After running the setup script, refresh this page to load the data.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Need Help?
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>
              Check the <code className="bg-slate-100 px-2 py-1 rounded">APPWRITE_MIGRATION.md</code> file for detailed migration instructions.
            </p>
            <p>
              View the <code className="bg-slate-100 px-2 py-1 rounded">.env.example</code> file for environment variable reference.
            </p>
          </CardContent>
        </Card>

        <div className="flex gap-2">
          <Button onClick={() => window.location.reload()}>Refresh Page</Button>
          <Button variant="outline" onClick={() => window.location.href = '/'}>
            Back to Store
          </Button>
        </div>
      </div>
    </div>
  );
}
