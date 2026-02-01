'use client';

import { useEffect, useState } from 'react';
import { collection, getDocs, addDoc, query, orderBy, limit } from 'firebase/firestore';
import { getDb } from '@/lib/firebase';
import { Tenant } from '@/types/tenant';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';

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

  function StatusBadge({ status }: { status: string }) {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      in_progress: 'bg-blue-100 text-blue-800 border-blue-200',
      completed: 'bg-green-100 text-green-800 border-green-200',
      failed: 'bg-red-100 text-red-800 border-red-200',
    };

    return (
      <span
        className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium border ${
          styles[status as keyof typeof styles] || 'bg-gray-100 text-gray-800'
        }`}
      >
        {status.replace('_', ' ')}
      </span>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Update Deployment</h2>
          <p className="text-gray-500">Deploy platform updates to newspapers via GitHub</p>
        </div>
        <Button
          onClick={() => setShowDeployModal(true)}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
          </svg>
          Deploy Update
        </Button>
      </div>

      {/* Deployment Pipeline Overview */}
      <div className="bg-white rounded-xl border shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Deployment Pipeline</h3>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-900">Source Repository</p>
                <p className="text-xs text-gray-500">carlucci001/wnct-next</p>
              </div>
            </div>

            <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>

            <div className="flex items-center">
              <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-900">Build & Test</p>
                <p className="text-xs text-gray-500">GitHub Actions</p>
              </div>
            </div>

            <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>

            <div className="flex items-center">
              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-900">Deploy</p>
                <p className="text-xs text-gray-500">Vercel Projects</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Available Releases */}
      <div className="bg-white rounded-xl border shadow-sm">
        <div className="px-6 py-4 border-b">
          <h3 className="text-lg font-semibold text-gray-900">Available Releases</h3>
        </div>
        <div className="divide-y">
          {releases.map((release) => (
            <div key={release.tag_name} className="px-6 py-4 flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <span className="px-2.5 py-1 bg-blue-100 text-blue-800 rounded-md text-sm font-medium">
                    {release.tag_name}
                  </span>
                  <p className="font-medium text-gray-900">{release.name}</p>
                </div>
                <p className="text-sm text-gray-500 mt-1 line-clamp-2">{release.body}</p>
                <p className="text-xs text-gray-400 mt-1">
                  Released {new Date(release.published_at).toLocaleDateString()}
                </p>
              </div>
              <div className="flex items-center gap-2 ml-4">
                <a
                  href={release.html_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
                <Button
                  size="sm"
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
      </div>

      {/* Deployment History */}
      <div className="bg-white rounded-xl border shadow-sm">
        <div className="px-6 py-4 border-b">
          <h3 className="text-lg font-semibold text-gray-900">Deployment History</h3>
        </div>
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
                      <span className="font-medium text-gray-900">{log.version}</span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
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
      </div>

      {/* Deploy Modal */}
      {showDeployModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Deploy Update</h3>
              <button
                onClick={() => {
                  setShowDeployModal(false);
                  setSelectedVersion('');
                  setSelectedTenants([]);
                  setDeployNotes('');
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="version">Version</Label>
                <select
                  id="version"
                  value={selectedVersion}
                  onChange={(e) => setSelectedVersion(e.target.value)}
                  className="mt-1 w-full rounded-md border border-gray-300 py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  <div className="space-y-2 max-h-40 overflow-y-auto border rounded-lg p-3">
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

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-start">
                  <svg className="w-5 h-5 text-yellow-600 mt-0.5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <div>
                    <p className="text-sm font-medium text-yellow-800">Deployment Notice</p>
                    <p className="text-sm text-yellow-700 mt-1">
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
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                  disabled={!selectedVersion || (!deployAllTenants && selectedTenants.length === 0) || deploying}
                  onClick={initiateDeployment}
                >
                  {deploying ? 'Initiating...' : 'Start Deployment'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}