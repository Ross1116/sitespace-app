'use client';

import { useAuth } from '@/app/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, ReactNode, useState } from 'react';

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
  const { isAuthenticated, user } = useAuth();
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);
  
  useEffect(() => {
    const checkAuth = () => {
      // Redirect to login if not authenticated
      if (!isAuthenticated) {
        router.push('/login');
        return;
      }
      
      // Role-based authorization check
      if (requiredRoles.length > 0 && user) {
        const userRole = user.role?.toLowerCase().trim();
        
        if (!userRole) {
          router.push('/unauthorized');
          return;
        }
        
        const hasRequiredRole = requiredRoles.some(
          role => role.toLowerCase().trim() === userRole
        );
        
        if (!hasRequiredRole) {
          router.push('/unauthorized');
          return;
        }
      }
      
      setIsChecking(false);
    };
    
    checkAuth();
  }, [isAuthenticated, user, router, requiredRoles]);
  
  // Show loading state while checking
  if (isChecking || !isAuthenticated) {
    return loadingComponent || (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600"></div>
      </div>
    );
  }
  
  // Don't render if role check is required but user doesn't have the role
  if (requiredRoles.length > 0 && user) {
    const userRole = user.role?.toLowerCase().trim();
    const hasRequiredRole = requiredRoles.some(
      role => role.toLowerCase().trim() === userRole
    );
    
    if (!hasRequiredRole) {
      return null;
    }
  }
  
  return <>{children}</>;
}