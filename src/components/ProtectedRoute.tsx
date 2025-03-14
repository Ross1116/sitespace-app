'use client';

import { useAuth } from '@/app/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, ReactNode } from 'react';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRoles?: string[];
}

export default function ProtectedRoute({ 
  children, 
  requiredRoles = [] 
}: ProtectedRouteProps) {
  const { isAuthenticated, user } = useAuth();
  const router = useRouter();
  
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    
    // Role-based authorization check
    if (requiredRoles.length > 0 && user) {
      const userRoles = user.roles.split(',');
      const hasRequiredRole = requiredRoles.some(role => 
        userRoles.includes(role.trim())
      );
      
      if (!hasRequiredRole) {
        router.push('/unauthorized');
      }
    }
  }, [isAuthenticated, user, router, requiredRoles]);
  
  if (!isAuthenticated) {
    return null;
  }
  
  return <>{children}</>;
}