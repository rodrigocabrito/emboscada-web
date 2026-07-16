import { useCallback } from 'react';
import { useQueries, useQuery, useQueryClient } from '@tanstack/react-query';
import { getSessionsForMonth, getUsers } from '../../../firebase/firestore';
import type { Session } from '../../../types';

// Month-scoped session loading: the calendar only ever shows a day or a week,
// so we fetch (and cache) whole months on demand instead of the entire
// collection. `months` = the "YYYY-MM" strings covering the visible range.
export const useSessions = (months: string[]) => {
  const queryClient = useQueryClient();

  const { sessions, loading } = useQueries({
    queries: months.map((ym) => ({
      queryKey: ['sessions', ym],
      queryFn: () => getSessionsForMonth(ym),
      staleTime: 60_000,
    })),
    combine: (results) => ({
      sessions: results.flatMap((r) => (r.data ?? []) as Session[]),
      loading: results.some((r) => r.isLoading),
    }),
  });

  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: getUsers,
    staleTime: 5 * 60_000,
  });

  // Invalidates every cached month (['sessions', <ym>] keys share the prefix)
  const refetchSessions = useCallback(
    () => queryClient.invalidateQueries({ queryKey: ['sessions'] }),
    [queryClient]
  );

  return { sessions, users, loading, refetchSessions };
};
