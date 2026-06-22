import { useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getSessions, getUsers } from '../../../firebase/firestore';

export const useSessions = () => {
  const queryClient = useQueryClient();

  const { data: sessions = [], isLoading } = useQuery({
    queryKey: ['sessions'],
    queryFn: getSessions,
    staleTime: 60_000,
  });

  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: getUsers,
    staleTime: 5 * 60_000,
  });

  const refetchSessions = useCallback(
    () => queryClient.refetchQueries({ queryKey: ['sessions'] }),
    [queryClient]
  );

  return { sessions, users, loading: isLoading, refetchSessions };
};
