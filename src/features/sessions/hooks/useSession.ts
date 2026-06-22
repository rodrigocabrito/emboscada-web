import { useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getSession, getUsers, getCatalogItems } from '../../../firebase/firestore';
import type { Session, User, CatalogItem } from '../../../types';

interface SessionQueryData {
  session: Session;
  users: User[];
  catalogItems: CatalogItem[];
}

export const useSession = (id: string) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery<SessionQueryData | null>({
    queryKey: ['session', id],
    queryFn: async () => {
      const [s, u, catalog] = await Promise.all([getSession(id), getUsers(), getCatalogItems()]);
      if (!s) return null;
      return { session: s, users: u, catalogItems: catalog };
    },
  });

  useEffect(() => {
    if (!isLoading && data === null) {
      navigate('/sessions', { replace: true });
    }
  }, [isLoading, data, navigate]);

  const updateSessionCache = useCallback((updatedFields: Partial<Session>) => {
    queryClient.setQueryData<SessionQueryData | null>(['session', id], (old) =>
      old ? { ...old, session: { ...old.session, ...updatedFields } } : old
    );
  }, [queryClient, id]);

  return {
    session: data?.session ?? null,
    users: data?.users ?? [],
    catalogItems: data?.catalogItems ?? [],
    loading: isLoading,
    error: error?.message ?? '',
    updateSessionCache,
  };
};
