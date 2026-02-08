'use client';

import { useAuth } from '@/app/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, ReactNode, useMemo } from 'react';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRoles?: string[]; // Empty array = all authenticated users
  loadingComponent?: ReactNode;
}

export default function ProtectedRoute({
  children,
  requiredRoles = [],
  loadingComponent
}: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const router = useRouter();

  const hasRequiredRole = useMemo(() => {
    if (requiredRoles.length === 0) return true;
    if (!user) return false;
    const userRole = user.role?.toLowerCase().trim();
    if (!userRole) return false;
    return requiredRoles.some(role => role.toLowerCase().trim() === userRole);
  }, [requiredRoles, user]);

  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated) {
      router.replace('/login');
      return;
    }

    if (!hasRequiredRole) {
      router.replace('/unauthorized');
    }
  }, [isAuthenticated, isLoading, hasRequiredRole, router]);

  if (isLoading || !isAuthenticated || !hasRequiredRole) {
    return loadingComponent || (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600" role="status" aria-label="Loading"></div>
      </div>
    );
  }

  return <>{children}</>;
}