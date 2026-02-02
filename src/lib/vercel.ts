/**
 * Vercel API Service
 * Handles programmatic deployment of tenant newspaper sites
 */

const VERCEL_API_BASE = 'https://api.vercel.com';

interface VercelProject {
  id: string;
  name: string;
  accountId: string;
  link?: {
    type: string;
    repo: string;
    repoId: number;
    org: string;
    gitCredentialId: string;
    productionBranch: string;
  };
}

interface VercelDeployment {
  id: string;
  url: string;
  state: string;
  readyState: string;
  alias?: string[];
}

interface VercelDomain {
  name: string;
  configured: boolean;
  verified: boolean;
}

interface DeployTenantOptions {
  tenantId: string;
  slug: string;
  businessName: string;
  serviceArea: {
    city: string;
    state: string;
  };
  ownerEmail: string;
  categories: Array<{ id: string; name: string; color: string }>;
}

interface DeploymentResult {
  success: boolean;
  projectId?: string;
  deploymentId?: string;
  deploymentUrl?: string;
  subdomain?: string;
  error?: string;
}

class VercelService {
  private apiToken: string;
  private teamId?: string;
  private gitRepoUrl: string;

  constructor() {
    this.apiToken = process.env.VERCEL_API_TOKEN || '';
    this.teamId = process.env.VERCEL_TEAM_ID;
    this.gitRepoUrl = process.env.WNCT_GIT_REPO_URL || 'https://github.com/your-org/wnct-next';
  }

  private async fetch(
    endpoint: string,
    method: 'GET' | 'POST' | 'PATCH' | 'DELETE' = 'GET',
    body?: Record<string, unknown>
  ): Promise<Response> {
    const url = new URL(endpoint, VERCEL_API_BASE);
    if (this.teamId) {
      url.searchParams.set('teamId', this.teamId);
    }

    const response = await fetch(url.toString(), {
      method,
      headers: {
        Authorization: `Bearer ${this.apiToken}`,
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    return response;
  }

  /**
   * Create a new Vercel project for a tenant
   */
  async createProject(slug: string, gitRepo: string): Promise<VercelProject | null> {
    try {
      const response = await this.fetch('/v10/projects', 'POST', {
        name: `newspaper-${slug}`,
        framework: 'nextjs',
        gitRepository: {
          type: 'github',
          repo: gitRepo,
        },
        buildCommand: 'npm run build',
        outputDirectory: '.next',
        installCommand: 'npm install',
        devCommand: 'npm run dev',
        rootDirectory: null,
      });

      if (!response.ok) {
        const error = await response.json();
        console.error('Failed to create Vercel project:', error);
        return null;
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating Vercel project:', error);
      return null;
    }
  }

  /**
   * Set environment variables for a project
   */
  async setEnvVars(
    projectId: string,
    envVars: Record<string, string>
  ): Promise<boolean> {
    try {
      const envArray = Object.entries(envVars).map(([key, value]) => ({
        key,
        value,
        type: 'encrypted',
        target: ['production', 'preview', 'development'],
      }));

      const response = await this.fetch(
        `/v10/projects/${projectId}/env`,
        'POST',
        envArray as unknown as Record<string, unknown>
      );

      if (!response.ok) {
        const error = await response.json();
        console.error('Failed to set env vars:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error setting env vars:', error);
      return false;
    }
  }

  /**
   * Add a domain/subdomain to a project
   */
  async addDomain(projectId: string, domain: string): Promise<VercelDomain | null> {
    try {
      const response = await this.fetch(
        `/v10/projects/${projectId}/domains`,
        'POST',
        { name: domain }
      );

      if (!response.ok) {
        const error = await response.json();
        console.error('Failed to add domain:', error);
        return null;
      }

      return await response.json();
    } catch (error) {
      console.error('Error adding domain:', error);
      return null;
    }
  }

  /**
   * Trigger a new deployment
   */
  async triggerDeployment(projectId: string): Promise<VercelDeployment | null> {
    try {
      const response = await this.fetch('/v13/deployments', 'POST', {
        name: projectId,
        target: 'production',
        gitSource: {
          type: 'github',
          ref: 'main',
        },
      });

      if (!response.ok) {
        const error = await response.json();
        console.error('Failed to trigger deployment:', error);
        return null;
      }

      return await response.json();
    } catch (error) {
      console.error('Error triggering deployment:', error);
      return null;
    }
  }

  /**
   * Get deployment status
   */
  async getDeploymentStatus(deploymentId: string): Promise<VercelDeployment | null> {
    try {
      const response = await this.fetch(`/v13/deployments/${deploymentId}`);

      if (!response.ok) {
        return null;
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting deployment status:', error);
      return null;
    }
  }

  /**
   * Full deployment flow for a new tenant
   */
  async deployTenant(options: DeployTenantOptions): Promise<DeploymentResult> {
    const { tenantId, slug, businessName, serviceArea, ownerEmail, categories } = options;

    console.log(`[Vercel] Starting deployment for tenant: ${slug}`);

    // Step 1: Create project
    const gitRepo = this.gitRepoUrl.replace('https://github.com/', '');
    const project = await this.createProject(slug, gitRepo);

    if (!project) {
      return { success: false, error: 'Failed to create Vercel project' };
    }

    console.log(`[Vercel] Created project: ${project.id}`);

    // Step 2: Set environment variables for tenant
    const envVars: Record<string, string> = {
      // Tenant identification
      TENANT_ID: tenantId,
      TENANT_SLUG: slug,

      // Firebase (same as main platform)
      NEXT_PUBLIC_FIREBASE_API_KEY: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || '',
      NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || '',
      NEXT_PUBLIC_FIREBASE_PROJECT_ID: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || '',
      NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || '',
      NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
      NEXT_PUBLIC_FIREBASE_APP_ID: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '',

      // Tenant-specific config
      NEXT_PUBLIC_SITE_NAME: businessName,
      NEXT_PUBLIC_SERVICE_AREA_CITY: serviceArea.city,
      NEXT_PUBLIC_SERVICE_AREA_STATE: serviceArea.state,

      // Platform connection
      PLATFORM_SECRET: process.env.PLATFORM_SECRET || '',
      PLATFORM_API_URL: process.env.NEXT_PUBLIC_BASE_URL || 'https://newsroomaios.com',
    };

    const envSet = await this.setEnvVars(project.id, envVars);
    if (!envSet) {
      console.warn('[Vercel] Warning: Failed to set some env vars');
    }

    // Step 3: Assign subdomain
    const subdomain = `${slug}.newsroomaios.com`;
    const domain = await this.addDomain(project.id, subdomain);

    if (!domain) {
      console.warn(`[Vercel] Warning: Failed to assign subdomain ${subdomain}`);
    }

    // Step 4: Trigger initial deployment
    const deployment = await this.triggerDeployment(project.id);

    if (!deployment) {
      return {
        success: false,
        projectId: project.id,
        error: 'Failed to trigger deployment',
      };
    }

    console.log(`[Vercel] Deployment triggered: ${deployment.id}`);

    return {
      success: true,
      projectId: project.id,
      deploymentId: deployment.id,
      deploymentUrl: deployment.url,
      subdomain,
    };
  }

  /**
   * Check if Vercel API is configured
   */
  isConfigured(): boolean {
    return !!this.apiToken;
  }
}

export const vercelService = new VercelService();
export type { DeployTenantOptions, DeploymentResult };
