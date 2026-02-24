/**
 * Vercel API Service
 * Handles programmatic deployment of tenant newspaper sites.
 *
 * All tenants deploy from carlucci001/wnct-template (repoId 1148332475).
 * Each tenant's Vercel project has its own env vars injected at build time.
 *
 * ⚠️  WNC TIMES EXCEPTION: Tenant "wnct-times" (project "newspaper-wnct-times")
 * uses Firebase project gen-lang-client-0242565142 with named database "gwnct",
 * NOT the platform's newsroomasios project. Its NEXT_PUBLIC_FIREBASE_* env vars
 * point to this separate project. See ARCHITECTURE.md for full details.
 */

const VERCEL_API_BASE = 'https://api.vercel.com';

// Hardcoded fallback — wnct-template GitHub repoId (immutable, safe to hardcode)
const WNCT_TEMPLATE_REPO_ID = 1148332475;

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
  apiKey: string;
}

interface DeploymentResult {
  success: boolean;
  projectId?: string;
  deploymentId?: string;
  deploymentUrl?: string;
  subdomain?: string;
  error?: string;
}

/** Trim env var values — platform env vars often have trailing \n or \r\n from Vercel CLI import */
function envTrimmed(key: string, fallback = ''): string {
  let val = (process.env[key] || fallback).trim();
  // Strip literal \n sequences that Vercel CLI leaves on env var values
  while (val.endsWith('\\n')) val = val.slice(0, -2);
  while (val.startsWith('\\n')) val = val.slice(2);
  return val;
}

class VercelService {
  private get apiToken(): string {
    return envTrimmed('VERCEL_API_TOKEN');
  }

  private get teamId(): string | undefined {
    const val = envTrimmed('VERCEL_TEAM_ID');
    return val || undefined;
  }

  private get gitRepoUrl(): string {
    return envTrimmed('WNCT_GIT_REPO_URL', 'https://github.com/carlucci001/wnct-template');
  }

  private async fetch(
    endpoint: string,
    method: 'GET' | 'POST' | 'PATCH' | 'DELETE' = 'GET',
    body?: Record<string, unknown> | Array<Record<string, unknown>>
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
   * Create a new Vercel project, or return the existing one if it already exists.
   */
  async createProject(slug: string, gitRepo: string): Promise<VercelProject | null> {
    const projectName = `newspaper-${slug}`;
    try {
      const response = await this.fetch('/v11/projects', 'POST', {
        name: projectName,
        framework: 'nextjs',
        gitRepository: {
          type: 'github',
          repo: gitRepo,
        },
      });

      if (response.ok) {
        const project = await response.json();
        console.log(`[Vercel] Created project ${projectName}: ${project.id}`);

        // Disable git-push auto-deploy — deployments are triggered via rollout API only
        await this.fetch(`/v9/projects/${project.id}`, 'PATCH', {
          gitProviderOptions: { createDeployments: 'disabled' },
        });

        return project;
      }

      // If project already exists (409 or similar), fetch and return it
      const errorBody = await response.json();
      const errorCode = errorBody?.error?.code;
      console.warn(`[Vercel] createProject returned ${response.status}: ${errorCode} — ${JSON.stringify(errorBody)}`);

      if (response.status === 409 || errorCode === 'project_already_exists' || errorCode === 'CONFLICT') {
        console.log(`[Vercel] Project ${projectName} already exists, fetching it`);
        return await this.getProject(projectName);
      }

      return null;
    } catch (error) {
      console.error('[Vercel] Error creating project:', error);
      return null;
    }
  }

  /**
   * Set environment variables for a project (batch).
   * Trimmed values to strip any trailing whitespace/newlines from platform env vars.
   */
  async setEnvVars(
    projectId: string,
    envVars: Record<string, string>
  ): Promise<boolean> {
    try {
      const envArray = Object.entries(envVars).map(([key, value]) => ({
        key,
        value: value.trim(),
        type: 'plain' as const,
        target: ['production', 'preview'],
      }));

      const response = await this.fetch(
        `/v10/projects/${projectId}/env`,
        'POST',
        envArray as unknown as Record<string, unknown>
      );

      if (!response.ok) {
        const error = await response.json();
        console.error('[Vercel] Failed to set env vars:', JSON.stringify(error));
        return false;
      }

      console.log(`[Vercel] Set ${envArray.length} env vars on project ${projectId}`);
      return true;
    } catch (error) {
      console.error('[Vercel] Error setting env vars:', error);
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
        // Domain already added is not a failure
        if (error?.error?.code === 'domain_already_in_use' || error?.error?.code === 'DOMAIN_ALREADY_IN_USE') {
          console.log(`[Vercel] Domain ${domain} already assigned`);
          return { name: domain, configured: true, verified: true };
        }
        console.error('[Vercel] Failed to add domain:', JSON.stringify(error));
        return null;
      }

      return await response.json();
    } catch (error) {
      console.error('[Vercel] Error adding domain:', error);
      return null;
    }
  }

  /**
   * Trigger a new deployment. Always includes repoId (required by v13 API).
   */
  async triggerDeployment(projectName: string, repoId?: number): Promise<VercelDeployment | null> {
    try {
      const body: Record<string, unknown> = {
        name: projectName,
        project: projectName,
        target: 'production',
        gitSource: {
          type: 'github',
          org: 'carlucci001',
          repo: 'wnct-template',
          ref: 'master',
          repoId: repoId || WNCT_TEMPLATE_REPO_ID,
        },
      };

      const response = await this.fetch('/v13/deployments', 'POST', body);

      if (!response.ok) {
        const error = await response.json();
        console.error('[Vercel] Failed to trigger deployment:', JSON.stringify(error));
        return null;
      }

      return await response.json();
    } catch (error) {
      console.error('[Vercel] Error triggering deployment:', error);
      return null;
    }
  }

  /**
   * Get deployment status
   */
  async getDeploymentStatus(deploymentId: string): Promise<VercelDeployment | null> {
    try {
      const response = await this.fetch(`/v13/deployments/${deploymentId}`);
      if (!response.ok) return null;
      return await response.json();
    } catch (error) {
      console.error('[Vercel] Error getting deployment status:', error);
      return null;
    }
  }

  /**
   * Full deployment flow for a new tenant
   */
  async deployTenant(options: DeployTenantOptions): Promise<DeploymentResult> {
    const { tenantId, slug, businessName, serviceArea, apiKey } = options;

    console.log(`[Vercel] Starting deployment for tenant: ${slug}`);
    console.log(`[Vercel] API token present: ${!!this.apiToken}, Team ID: ${this.teamId || 'NOT SET'}`);

    // Pre-flight: validate token works
    try {
      const whoami = await this.fetch('/v2/user');
      if (!whoami.ok) {
        const err = await whoami.json();
        console.error('[Vercel] Token validation failed:', JSON.stringify(err));
        return { success: false, error: `Vercel API token invalid: ${err?.error?.message || whoami.status}` };
      }
      console.log('[Vercel] Token validated OK');
    } catch (e) {
      return { success: false, error: `Vercel API unreachable: ${e}` };
    }

    // Step 1: Create project (or get existing)
    const gitRepo = this.gitRepoUrl.replace('https://github.com/', '').trim();
    const project = await this.createProject(slug, gitRepo);

    if (!project) {
      return { success: false, error: 'Failed to create Vercel project — check VERCEL_API_TOKEN and GitHub integration' };
    }

    console.log(`[Vercel] Project ready: ${project.id} (${project.name})`);

    // Step 2: Set environment variables (trimmed)
    const envVars: Record<string, string> = {
      TENANT_ID: tenantId,
      TENANT_SLUG: slug,
      NEXT_PUBLIC_TENANT_ID: tenantId,
      NEXT_PUBLIC_FIREBASE_API_KEY: envTrimmed('NEXT_PUBLIC_FIREBASE_API_KEY'),
      NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: envTrimmed('NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN'),
      NEXT_PUBLIC_FIREBASE_PROJECT_ID: envTrimmed('NEXT_PUBLIC_FIREBASE_PROJECT_ID'),
      NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: envTrimmed('NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET'),
      NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: envTrimmed('NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID'),
      NEXT_PUBLIC_FIREBASE_APP_ID: envTrimmed('NEXT_PUBLIC_FIREBASE_APP_ID'),
      GEMINI_API_KEY: envTrimmed('GEMINI_API_KEY'),
      OPENAI_API_KEY: envTrimmed('OPENAI_API_KEY'),
      PERPLEXITY_API_KEY: envTrimmed('PERPLEXITY_API_KEY'),
      PEXELS_API_KEY: envTrimmed('PEXELS_API_KEY'),
      ELEVENLABS_API_KEY: envTrimmed('ELEVENLABS_API_KEY'),
      NVIDIA_API_KEY: envTrimmed('NVIDIA_API_KEY'),
      GOOGLE_PLACES_API_KEY: envTrimmed('GOOGLE_PLACES_API_KEY'),
      NEXT_PUBLIC_SITE_NAME: businessName,
      NEXT_PUBLIC_SERVICE_AREA_CITY: serviceArea.city,
      NEXT_PUBLIC_SERVICE_AREA_STATE: serviceArea.state,
      PLATFORM_API_URL: 'https://www.newsroomaios.com',
      TENANT_API_KEY: apiKey,
      NEXT_PUBLIC_TENANT_API_KEY: apiKey,
      PLATFORM_SECRET: envTrimmed('PLATFORM_SECRET'),
      SCHEDULED_RUNNER_API_KEY: apiKey,
      STRIPE_SECRET_KEY: envTrimmed('STRIPE_SECRET_KEY'),
      NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: envTrimmed('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY'),
      FIREBASE_SERVICE_ACCOUNT: envTrimmed('FIREBASE_SERVICE_ACCOUNT'),
      NEXT_PUBLIC_PLATFORM_ADMIN_EMAIL: envTrimmed('NEXT_PUBLIC_PLATFORM_ADMIN_EMAIL'),
    };

    const envSet = await this.setEnvVars(project.id, envVars);
    if (!envSet) {
      console.warn('[Vercel] Warning: Failed to set some env vars — continuing anyway');
    }

    // Step 3: Assign subdomain
    const subdomain = `${slug}.newsroomaios.com`;
    await this.addDomain(project.id, subdomain);

    // Step 4: Trigger deployment (always use hardcoded repoId as fallback)
    const repoId = project.link?.repoId || WNCT_TEMPLATE_REPO_ID;
    const deployment = await this.triggerDeployment(`newspaper-${slug}`, repoId);

    if (!deployment) {
      return {
        success: false,
        projectId: project.id,
        error: 'Project created but deployment trigger failed — check Vercel logs',
      };
    }

    console.log(`[Vercel] Deployment triggered: ${deployment.id} → ${subdomain}`);

    return {
      success: true,
      projectId: project.id,
      deploymentId: deployment.id,
      deploymentUrl: deployment.url,
      subdomain,
    };
  }

  /**
   * Get all domains assigned to a project
   */
  async getProjectDomains(projectId: string): Promise<VercelDomain[]> {
    try {
      const response = await this.fetch(`/v9/projects/${projectId}/domains`);
      if (!response.ok) return [];
      const data = await response.json();
      return data.domains || [];
    } catch {
      return [];
    }
  }

  /**
   * Get a project by name
   */
  async getProject(projectName: string): Promise<VercelProject | null> {
    try {
      const response = await this.fetch(`/v9/projects/${projectName}`);
      if (!response.ok) return null;
      return await response.json();
    } catch {
      return null;
    }
  }

  /**
   * Ensure required env vars exist on a project. Adds any that are missing.
   * Returns the list of keys that were backfilled.
   */
  async ensureEnvVars(
    projectId: string,
    requiredVars: Record<string, string>
  ): Promise<string[]> {
    const envResponse = await this.fetch(`/v9/projects/${projectId}/env`);
    if (!envResponse.ok) return [];
    const envData = await envResponse.json();
    const existingKeys = new Set((envData.envs || []).map((e: { key: string }) => e.key));

    const missing: Record<string, string> = {};
    for (const [key, value] of Object.entries(requiredVars)) {
      if (!existingKeys.has(key) && value) {
        missing[key] = value;
      }
    }

    if (Object.keys(missing).length === 0) return [];

    const backfilledKeys = Object.keys(missing);
    console.log(`[Vercel] Backfilling ${backfilledKeys.length} missing env vars: ${backfilledKeys.join(', ')}`);
    await this.setEnvVars(projectId, missing);
    return backfilledKeys;
  }

  /**
   * Upsert a single environment variable on a Vercel project.
   * Updates the value if the key exists, creates it if not.
   */
  async upsertEnvVar(projectId: string, key: string, value: string): Promise<boolean> {
    try {
      // Get existing env vars to check if key exists
      const envResponse = await this.fetch(`/v9/projects/${projectId}/env`);
      if (!envResponse.ok) return false;
      const envData = await envResponse.json();
      const existing = (envData.envs || []).find((e: { key: string; id: string }) => e.key === key);

      if (existing) {
        // Update existing env var
        const patchRes = await this.fetch(`/v9/projects/${projectId}/env/${existing.id}`, 'PATCH', {
          value: value.trim(),
          target: ['production', 'preview'],
        } as unknown as Record<string, unknown>);
        if (!patchRes.ok) {
          console.error(`[Vercel] Failed to update env var ${key}:`, await patchRes.text());
          return false;
        }
      } else {
        // Create new env var
        const postRes = await this.fetch(`/v10/projects/${projectId}/env`, 'POST', [{
          key,
          value: value.trim(),
          type: 'plain',
          target: ['production', 'preview'],
        }] as unknown as Record<string, unknown>);
        if (!postRes.ok) {
          console.error(`[Vercel] Failed to create env var ${key}:`, await postRes.text());
          return false;
        }
      }

      console.log(`[Vercel] Upserted env var ${key}=${value} on project ${projectId}`);
      return true;
    } catch (error) {
      console.error(`[Vercel] Error upserting env var ${key}:`, error);
      return false;
    }
  }

  /**
   * Redeploy an existing tenant project with latest template code.
   * If tenantConfig is provided, audits and backfills missing env vars first.
   * If version is provided, upserts NEXT_PUBLIC_PLATFORM_VERSION env var.
   *
   * ⚠️  WNC TIMES: This backfills env vars from the PLATFORM's Firebase config.
   * WNC Times (wnct-times) uses a DIFFERENT Firebase project and named database (gwnct).
   * ensureEnvVars() only adds MISSING vars, so it won't overwrite WNC Times' correct
   * Firebase config. But if those vars are ever deleted, the backfill would inject wrong
   * values. See ARCHITECTURE.md "WNC Times — Special Architecture" for details.
   */
  async redeployTenant(
    slug: string,
    tenantConfig?: { tenantId: string; apiKey: string; businessName: string; serviceArea?: { city: string; state: string } },
    version?: string
  ): Promise<{ success: boolean; deploymentId?: string; error?: string; backfilledEnvVars?: string[] }> {
    const projectName = `newspaper-${slug}`;

    const project = await this.getProject(projectName);
    if (!project) {
      return { success: false, error: `Project ${projectName} not found on Vercel` };
    }

    // Audit and backfill missing env vars if tenant config provided
    let backfilledEnvVars: string[] = [];
    if (tenantConfig) {
      const requiredVars: Record<string, string> = {
        TENANT_ID: tenantConfig.tenantId,
        TENANT_SLUG: slug,
        NEXT_PUBLIC_TENANT_ID: tenantConfig.tenantId,
        TENANT_API_KEY: tenantConfig.apiKey,
        NEXT_PUBLIC_TENANT_API_KEY: tenantConfig.apiKey,
        SCHEDULED_RUNNER_API_KEY: tenantConfig.apiKey,
        PLATFORM_API_URL: 'https://www.newsroomaios.com',
        PLATFORM_SECRET: envTrimmed('PLATFORM_SECRET'),
        NEXT_PUBLIC_SITE_NAME: tenantConfig.businessName,
        NEXT_PUBLIC_FIREBASE_API_KEY: envTrimmed('NEXT_PUBLIC_FIREBASE_API_KEY'),
        NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: envTrimmed('NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN'),
        NEXT_PUBLIC_FIREBASE_PROJECT_ID: envTrimmed('NEXT_PUBLIC_FIREBASE_PROJECT_ID'),
        NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: envTrimmed('NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET'),
        NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: envTrimmed('NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID'),
        NEXT_PUBLIC_FIREBASE_APP_ID: envTrimmed('NEXT_PUBLIC_FIREBASE_APP_ID'),
        GEMINI_API_KEY: envTrimmed('GEMINI_API_KEY'),
        OPENAI_API_KEY: envTrimmed('OPENAI_API_KEY'),
        PERPLEXITY_API_KEY: envTrimmed('PERPLEXITY_API_KEY'),
        PEXELS_API_KEY: envTrimmed('PEXELS_API_KEY'),
        ELEVENLABS_API_KEY: envTrimmed('ELEVENLABS_API_KEY'),
        GOOGLE_PLACES_API_KEY: envTrimmed('GOOGLE_PLACES_API_KEY'),
        NEXT_PUBLIC_PLATFORM_ADMIN_EMAIL: envTrimmed('NEXT_PUBLIC_PLATFORM_ADMIN_EMAIL'),
      };
      if (tenantConfig.serviceArea) {
        requiredVars.NEXT_PUBLIC_SERVICE_AREA_CITY = tenantConfig.serviceArea.city;
        requiredVars.NEXT_PUBLIC_SERVICE_AREA_STATE = tenantConfig.serviceArea.state;
      }
      backfilledEnvVars = await this.ensureEnvVars(project.id, requiredVars);
    }

    // Stamp platform version on the project (upsert — always updates to latest)
    if (version) {
      await this.upsertEnvVar(project.id, 'NEXT_PUBLIC_PLATFORM_VERSION', version);
    }

    const repoId = project.link?.repoId || WNCT_TEMPLATE_REPO_ID;
    const deployment = await this.triggerDeployment(projectName, repoId);

    if (!deployment) {
      return { success: false, error: `Failed to trigger deployment for ${projectName}` };
    }

    return { success: true, deploymentId: deployment.id, backfilledEnvVars };
  }

  isConfigured(): boolean {
    return !!this.apiToken;
  }
}

export const vercelService = new VercelService();
export type { DeployTenantOptions, DeploymentResult };
