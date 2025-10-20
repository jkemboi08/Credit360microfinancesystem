// Tenant Middleware
// Handles tenant detection and context switching

import { NextRequest, NextResponse } from 'next/server';
import { tenantManager } from '../lib/tenantManager';

// Tenant context interface
export interface TenantContext {
  tenant: {
    id: string;
    name: string;
    subdomain: string;
    database_name: string;
    status: string;
    plan: string;
  };
  user?: {
    id: string;
    email: string;
    role: string;
    first_name?: string;
    last_name?: string;
  };
}

// Extract subdomain from request
function extractSubdomain(request: NextRequest): string | null {
  const host = request.headers.get('host');
  if (!host) return null;

  // Handle localhost development
  if (host.includes('localhost') || host.includes('127.0.0.1')) {
    // For development, check for subdomain in URL
    const url = new URL(request.url);
    const pathname = url.pathname;
    
    // Check if path starts with /tenant/[subdomain]
    const tenantMatch = pathname.match(/^\/tenant\/([^\/]+)/);
    if (tenantMatch) {
      return tenantMatch[1];
    }
    
    // Check for subdomain in query params
    const subdomain = url.searchParams.get('tenant');
    if (subdomain) {
      return subdomain;
    }
    
    return null;
  }

  // Handle production subdomains
  const parts = host.split('.');
  if (parts.length >= 3) {
    return parts[0];
  }

  return null;
}

// Tenant middleware function
export async function tenantMiddleware(request: NextRequest): Promise<NextResponse | null> {
  try {
    // Extract subdomain
    const subdomain = extractSubdomain(request);
    
    if (!subdomain) {
      // No subdomain found, continue to main app
      return null;
    }

    // Get tenant by subdomain
    const tenant = await tenantManager.getTenantBySubdomain(subdomain);
    
    if (!tenant) {
      // Tenant not found
      return NextResponse.json(
        { 
          error: 'Tenant not found',
          message: `The subdomain '${subdomain}' is not associated with any tenant.`,
          code: 'TENANT_NOT_FOUND'
        },
        { status: 404 }
      );
    }

    if (tenant.status !== 'ACTIVE') {
      // Tenant is not active
      return NextResponse.json(
        { 
          error: 'Tenant not active',
          message: `The tenant '${tenant.name}' is currently ${tenant.status.toLowerCase()}.`,
          code: 'TENANT_INACTIVE'
        },
        { status: 403 }
      );
    }

    // Set tenant context in headers for the application to use
    const response = NextResponse.next();
    response.headers.set('x-tenant-id', tenant.id);
    response.headers.set('x-tenant-name', tenant.name);
    response.headers.set('x-tenant-subdomain', tenant.subdomain);
    response.headers.set('x-tenant-plan', tenant.plan);
    
    return response;
    
  } catch (error) {
    console.error('Error in tenant middleware:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: 'An error occurred while processing the tenant request.',
        code: 'TENANT_MIDDLEWARE_ERROR'
      },
      { status: 500 }
    );
  }
}

// Get tenant context from request
export function getTenantContext(request: NextRequest): TenantContext | null {
  const tenantId = request.headers.get('x-tenant-id');
  const tenantName = request.headers.get('x-tenant-name');
  const tenantSubdomain = request.headers.get('x-tenant-subdomain');
  const tenantPlan = request.headers.get('x-tenant-plan');

  if (!tenantId || !tenantName || !tenantSubdomain) {
    return null;
  }

  return {
    tenant: {
      id: tenantId,
      name: tenantName,
      subdomain: tenantSubdomain,
      database_name: `credit_management_${tenantSubdomain}`,
      status: 'ACTIVE',
      plan: tenantPlan || 'BASIC'
    }
  };
}

// Check if request is for tenant-specific route
export function isTenantRoute(request: NextRequest): boolean {
  const pathname = request.nextUrl.pathname;
  
  // Check for tenant-specific routes
  const tenantRoutes = [
    '/dashboard',
    '/clients',
    '/loans',
    '/groups',
    '/staff',
    '/reports',
    '/settings'
  ];
  
  return tenantRoutes.some(route => pathname.startsWith(route));
}

// Get tenant from URL path (for development)
export function getTenantFromPath(pathname: string): string | null {
  const tenantMatch = pathname.match(/^\/tenant\/([^\/]+)/);
  return tenantMatch ? tenantMatch[1] : null;
}

// Validate tenant access
export async function validateTenantAccess(
  tenantId: string, 
  userEmail: string
): Promise<{ hasAccess: boolean; user?: any; error?: string }> {
  try {
    // Set tenant context
    const tenant = await tenantManager.getTenantById(tenantId);
    if (!tenant) {
      return { hasAccess: false, error: 'Tenant not found' };
    }

    // Check user access
    const hasAccess = await tenantManager.checkUserAccess(userEmail);
    if (!hasAccess) {
      return { hasAccess: false, error: 'User does not have access to this tenant' };
    }

    // Get user details
    const users = await tenantManager.getTenantUsers();
    const user = users.find(u => u.email === userEmail);

    return { hasAccess: true, user };
    
  } catch (error) {
    console.error('Error validating tenant access:', error);
    return { hasAccess: false, error: 'Internal server error' };
  }
}

// Tenant-aware API wrapper
export function withTenantContext<T extends any[]>(
  handler: (context: TenantContext, ...args: T) => Promise<Response>
) {
  return async (request: NextRequest, ...args: T): Promise<Response> => {
    const context = getTenantContext(request);
    
    if (!context) {
      return NextResponse.json(
        { error: 'No tenant context found' },
        { status: 400 }
      );
    }

    return handler(context, ...args);
  };
}

// Tenant-aware Supabase client
export function getTenantSupabaseClient(tenantContext: TenantContext) {
  return tenantManager.getTenantClient();
}

// Export middleware for Next.js
export default tenantMiddleware;







