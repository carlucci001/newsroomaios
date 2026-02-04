'use client';

import { useEffect, useState } from 'react';
import { collection, getDocs, addDoc, query, orderBy, limit } from 'firebase/firestore';
import { getDb } from '@/lib/firebase';
import { Tenant } from '@/types/tenant';
import { PageContainer } from '@/components/layouts/PageContainer';
import { PageHeader } from '@/components/layouts/PageHeader';
import { StatCard } from '@/components/ui/stat-card';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Upload,
  Github,
  Filter,
  Server,
  Activity,
  AlertTriangle,
  ExternalLink,
  Calendar,
} from 'lucide-react';

interface UpdateLog {
  id: string;
  version: string;
  description: string;
  targetTenants: string[]; // 'all' or specific tenant IDs
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  initiatedBy: string;
  initiatedAt: Date;
  completedAt?: Date;
  results?: {
    tenantId: string;
    success: boolean;
    message?: string;
  }[];
}

interface GitHubRelease {
  tag_name: string;
  name: string;
  published_at: string;
  body: string;
  html_url: string;
}

function StatusBadge({ status }: { status: string }) {
  const config = {
    pending: { variant: 'warning' as const, label: 'Pending' },
    in_progress: { variant: 'primary' as const, label: 'In Progress' },
    completed: { variant: 'success' as const, label: 'Completed' },
    failed: { variant: 'danger' as const, label: 'Failed' },
  };

  const { variant, label } = config[status as keyof typeof config] || { variant: 'default' as const, label: status };
  return <Badge variant={variant}>{label}</Badge>;
}

export default function UpdatesPage() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [updateLogs, setUpdateLogs] = useState<UpdateLog[]>([]);
  const [releases, setReleases] = useState<GitHubRelease[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDeployModal, setShowDeployModal] = useState(false);
  const [selectedVersion, setSelectedVersion] = useState('');
  const [selectedTenants, setSelectedTenants] = useState<string[]>([]);
  const [deployAllTenants, setDeployAllTenants] = useState(true);
  const [deployNotes, setDeployNotes] = useState('');
  const [deploying, setDeploying] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      const db = getDb();

      // Fetch tenants
      const tenantsSnap = await getDocs(collection(db, 'tenants'));
      const tenantsData = tenantsSnap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Tenant[];
      setTenants(tenantsData.filter((t) => t.status === 'active'));

      // Fetch update logs
      try {
        const logsQuery = query(collection(db, 'updateLogs'), orderBy('initiatedAt', 'desc'), limit(20));
        const logsSnap = await getDocs(logsQuery);
        const logsData = logsSnap.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as UpdateLog[];
        setUpdateLogs(logsData);
      } catch (e) {
        // Collection might not exist yet
      }

      // Fetch GitHub releases (mock data for now - would need API integration)
      setReleases([
        {
          tag_name: 'v1.2.0',
          name: 'Version 1.2.0 - Performance Improvements',
          published_at: new Date().toISOString(),
          body: '- Improved article generation speed\n- Fixed image loading issues\n- Added new category templates',
          html_url: 'https://github.com/carlucci001/wnct-next/releases/tag/v1.2.0',
        },
        {
          tag_name: 'v1.1.0',
          name: 'Version 1.1.0 - AI Enhancements',
          published_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          body: '- Enhanced AI journalist capabilities\n- Better SEO optimization\n- Improved fact-checking accuracy',
          html_url: 'https://github.com/carlucci001/wnct-next/releases/tag/v1.1.0',
        },
        {
          tag_name: 'v1.0.0',
          name: 'Version 1.0.0 - Initial Release',
          published_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          body: '- Core newspaper functionality\n- AI article generation\n- Admin dashboard',
          html_url: 'https://github.com/carlucci001/wnct-next/releases/tag/v1.0.0',
        },
      ]);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  }

  async function initiateDeployment() {
    if (!selectedVersion) return;

    setDeploying(true);
    try {
      const db = getDb();
      const targetTenants = deployAllTenants ? ['all'] : selectedTenants;

      // Create update log entry
      await addDoc(collection(db, 'updateLogs'), {
        version: selectedVersion,
        description: deployNotes || `Deploying ${selectedVersion}`,
        targetTenants,
        status: 'pending',
        initiatedBy: 'admin', // Would use actual user ID
        initiatedAt: new Date(),
      });

      // In a real implementation, this would trigger a GitHub Actions workflow
      // or a Cloud Function to deploy updates to each tenant's Vercel project

      await fetchData();
      setShowDeployModal(false);
      setSelectedVersion('');
      setSelectedTenants([]);
      setDeployNotes('');
    } catch (error) {
      console.error('Failed to initiate deployment:', error);
    } finally {
      setDeploying(false);
    }
  }

  const stats = {
    totalDeployments: updateLogs.length,
    pendingDeployments: updateLogs.filter((l) => l.status === 'pending').length,
    activeTenants: tenants.length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-600"></div>
      </div>
    );
  }

  return (
    <PageContainer maxWidth="2xl">
      <PageHeader
        title="Update Deployment"
        subtitle="Deploy platform updates to newspapers via GitHub"
        action={
          <Button variant="primary" onClick={() => setShowDeployModal(true)}>
            <Upload className="w-4 h-4" />
            Deploy Update
          </Button>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          label="Total Deployments"
          value={stats.totalDeployments}
          icon={<Activity className="w-6 h-6" />}
          color="brand"
        />
        <StatCard
          label="Pending"
          value={stats.pendingDeployments}
          icon={<AlertTriangle className="w-6 h-6" />}
          color="warning"
        />
        <StatCard
          label="Active Tenants"
          value={stats.activeTenants}
          icon={<Server className="w-6 h-6" />}
          color="success"
        />
      </div>

      {/* Deployment Pipeline Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Deployment Pipeline</CardTitle>
          <CardDescription>Automated deployment workflow</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-brand-100 flex items-center justify-center">
                <Github className="w-6 h-6 text-brand-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Source Repository</p>
                <p className="text-xs text-gray-500">carlucci001/wnct-next</p>
              </div>
            </div>

            <div className="hidden sm:block">
              <div className="w-8 h-0.5 bg-gray-300"></div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-warning-100 flex items-center justify-center">
                <Filter className="w-6 h-6 text-warning-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Build & Test</p>
                <p className="text-xs text-gray-500">GitHub Actions</p>
              </div>
            </div>

            <div className="hidden sm:block">
              <div className="w-8 h-0.5 bg-gray-300"></div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-success-100 flex items-center justify-center">
                <Server className="w-6 h-6 text-success-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Deploy</p>
                <p className="text-xs text-gray-500">Vercel Projects</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Available Releases */}
      <Card>
        <CardHeader>
          <CardTitle>Available Releases</CardTitle>
          <CardDescription>Ready to deploy versions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {releases.map((release) => (
              <div key={release.tag_name} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <Badge variant="primary">{release.tag_name}</Badge>
                    <p className="font-medium text-gray-900">{release.name}</p>
                  </div>
                  <p className="text-sm text-gray-600 line-clamp-2 whitespace-pre-line">{release.body}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <p className="text-xs text-gray-500">
                      Released {new Date(release.published_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 ml-4">
                  <a
                    href={release.html_url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button variant="ghost" size="sm">
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                  </a>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setSelectedVersion(release.tag_name);
                      setShowDeployModal(true);
                    }}
                  >
                    Deploy
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Deployment History */}
      <Card>
        <CardHeader>
          <CardTitle>Deployment History</CardTitle>
          <CardDescription>Recent deployment activity</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                    Version
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                    Description
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                    Targets
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {updateLogs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                      No deployments yet. Deploy your first update to get started.
                    </td>
                  </tr>
                ) : (
                  updateLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <Badge variant="primary">{log.version}</Badge>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate">
                        {log.description}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {log.targetTenants.includes('all')
                          ? 'All tenants'
                          : `${log.targetTenants.length} tenant(s)`}
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={log.status} />
                      </td>
                      <td className="px-6 py-4 text-sm text-right text-gray-500">
                        {log.initiatedAt instanceof Date
                          ? log.initiatedAt.toLocaleString()
                          : new Date((log.initiatedAt as any)?.seconds * 1000 || Date.now()).toLocaleString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Deploy Modal */}
      {showDeployModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <Card className="w-full max-w-lg mx-4">
            <CardHeader>
              <CardTitle>Deploy Update</CardTitle>
              <CardDescription>Select version and target tenants</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="version">Version</Label>
                <select
                  id="version"
                  value={selectedVersion}
                  onChange={(e) => setSelectedVersion(e.target.value)}
                  className="mt-1 w-full rounded-md border border-gray-300 py-2 px-3 focus:outline-none focus:ring-2 focus:ring-brand-500"
                >
                  <option value="">Select a version...</option>
                  {releases.map((release) => (
                    <option key={release.tag_name} value={release.tag_name}>
                      {release.tag_name} - {release.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <div className="flex items-center space-x-2 mb-3">
                  <Checkbox
                    id="deployAll"
                    checked={deployAllTenants}
                    onCheckedChange={(checked) => setDeployAllTenants(checked as boolean)}
                  />
                  <Label htmlFor="deployAll">Deploy to all active tenants</Label>
                </div>

                {!deployAllTenants && (
                  <div className="space-y-2 max-h-40 overflow-y-auto border rounded-lg p-3 bg-gray-50">
                    {tenants.map((tenant) => (
                      <div key={tenant.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={tenant.id}
                          checked={selectedTenants.includes(tenant.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedTenants([...selectedTenants, tenant.id]);
                            } else {
                              setSelectedTenants(selectedTenants.filter((id) => id !== tenant.id));
                            }
                          }}
                        />
                        <Label htmlFor={tenant.id} className="text-sm">
                          {tenant.businessName}
                        </Label>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <Label htmlFor="notes">Deployment Notes (Optional)</Label>
                <Input
                  id="notes"
                  placeholder="Add any notes about this deployment..."
                  value={deployNotes}
                  onChange={(e) => setDeployNotes(e.target.value)}
                  className="mt-1"
                />
              </div>

              <div className="bg-warning-50 border border-warning-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-warning-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-warning-900">Deployment Notice</p>
                    <p className="text-sm text-warning-800 mt-1">
                      This will trigger a rebuild and redeploy of all selected tenant sites. The process typically completes within 5-10 minutes.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setShowDeployModal(false);
                    setSelectedVersion('');
                    setSelectedTenants([]);
                    setDeployNotes('');
                  }}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  className="flex-1"
                  disabled={!selectedVersion || (!deployAllTenants && selectedTenants.length === 0) || deploying}
                  onClick={initiateDeployment}
                >
                  {deploying ? 'Initiating...' : 'Start Deployment'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </PageContainer>
  );
}
