import { useState, useEffect } from 'react';
import { databases, DATABASE_ID, COLLECTIONS } from '@/integrations/appwrite/config';
import { useAuth } from '@/context/AuthContext';
import { Query } from 'appwrite';
import { normalizeUserRole } from '@/lib/normalize';

export function useIsAdmin() {
  const { user, loading: authLoading } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  const adminEmails = (import.meta.env.VITE_ADMIN_EMAILS || '')
    .split(',')
    .map((email: string) => email.trim().toLowerCase())
    .filter(Boolean);

  useEffect(() => {
    const checkAdmin = async () => {
      if (!user) {
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      const isBootstrapAdmin = adminEmails.includes(user.email.toLowerCase());

      try {
        // Check user role in Appwrite user_roles using normalized field names
        const response = await databases.listDocuments(
          DATABASE_ID,
          COLLECTIONS.USER_ROLES,
          [Query.equal('userId', user.$id)]
        );

        // Use normalization utility to handle any field name variations
        const userRole = response.documents[0]
          ? normalizeUserRole(response.documents[0])
          : null;

        setIsAdmin(userRole?.role === 'admin' || isBootstrapAdmin);
      } catch (err) {
        console.error('Error checking admin status:', err);

        // If role query fails due permissions/migration state, allow configured bootstrap admins.
        setIsAdmin(isBootstrapAdmin);
      } finally {
        setLoading(false);
      }
    };

    if (!authLoading) {
      checkAdmin();
    }
  }, [user, authLoading, adminEmails]);

  return { isAdmin, loading: loading || authLoading };
}
