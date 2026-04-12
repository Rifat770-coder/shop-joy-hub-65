import { useState, useEffect } from 'react';
import { databases, DATABASE_ID, COLLECTIONS } from '@/integrations/appwrite/config';
import { useAuth } from '@/context/AuthContext';
import { Query } from 'appwrite';
import { normalizeUserRole } from '@/lib/normalize';
import { ExtendedAppRole } from '@/integrations/appwrite/types';

export interface UserPermissions {
  isAdmin: boolean;
  isVendor: boolean;
  role: ExtendedAppRole;
  vendorId?: string;
}

export function useUserPermissions(): UserPermissions & { loading: boolean } {
  const { user, loading: authLoading } = useAuth();
  const [permissions, setPermissions] = useState<UserPermissions>({
    isAdmin: false,
    isVendor: false,
    role: 'user'
  });
  const [loading, setLoading] = useState(true);

  const adminEmails = (import.meta.env.VITE_ADMIN_EMAILS || '')
    .split(',')
    .map((email: string) => email.trim().toLowerCase())
    .filter(Boolean);

  useEffect(() => {
    const checkPermissions = async () => {
      if (!user) {
        setPermissions({
          isAdmin: false,
          isVendor: false,
          role: 'user'
        });
        setLoading(false);
        return;
      }

      const isBootstrapAdmin = adminEmails.includes(user.email.toLowerCase());

      try {
        // Check user role in Appwrite user_roles
        const roleResponse = await databases.listDocuments(
          DATABASE_ID,
          COLLECTIONS.USER_ROLES,
          [Query.equal('userId', user.$id)]
        );

        const userRole = roleResponse.documents[0]
          ? normalizeUserRole(roleResponse.documents[0])
          : null;

        const role = (userRole?.role as ExtendedAppRole) || 'user';
        const isAdmin = role === 'admin' || isBootstrapAdmin;
        const isVendor = role === 'vendor';
        let vendorId: string | undefined;

        // Check for vendor association if vendor
        if (isVendor) {
          try {
            const vendorResponse = await databases.listDocuments(
              DATABASE_ID,
              'vendors',
              [Query.equal('userId', user.$id), Query.equal('isActive', true)]
            );
            if (vendorResponse.documents.length > 0) {
              vendorId = vendorResponse.documents[0].$id;
            }
          } catch (error) {
            console.warn('Could not check vendor association:', error);
          }
        }

        setPermissions({
          isAdmin,
          isVendor,
          role,
          vendorId
        });
      } catch (err) {
        console.error('Error checking user permissions:', err);

        // Fallback to bootstrap admin or basic user
        setPermissions({
          isAdmin: isBootstrapAdmin,
          isVendor: false,
          role: isBootstrapAdmin ? 'admin' : 'user'
        });
      } finally {
        setLoading(false);
      }
    };

    if (!authLoading) {
      checkPermissions();
    }
  }, [user, authLoading]);

  return { ...permissions, loading };
}

// Legacy hook for backward compatibility
export function useIsAdmin() {
  const { isAdmin, loading } = useUserPermissions();
  return { isAdmin, loading };
}