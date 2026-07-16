import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import { getSessionsPage, getSessionsCount } from '../../../firebase/firestore';
import type { SessionFilters } from '../../../types';
import type { DocumentSnapshot } from 'firebase/firestore';

export const useSessionsPage = (serverFilters: SessionFilters, pageSize = 30, enabled = true) => {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
  } = useInfiniteQuery({
    queryKey: ['sessions-page', serverFilters],
    queryFn: ({ pageParam }: { pageParam: DocumentSnapshot | null }) =>
      getSessionsPage(pageSize, pageParam, serverFilters),
    getNextPageParam: (lastPage) => lastPage.hasMore ? lastPage.lastDoc : undefined,
    initialPageParam: null as DocumentSnapshot | null,
    enabled,
  });

  const { data: totalCount = null } = useQuery({
    queryKey: ['sessions-count', serverFilters],
    queryFn: () => getSessionsCount(serverFilters),
    enabled,
  });

  const sessions = data?.pages.flatMap((p) => p.sessions) ?? [];

  return {
    sessions,
    hasMore: hasNextPage ?? false,
    totalCount,
    loading: isLoading,
    loadingMore: isFetchingNextPage,
    loadMore: fetchNextPage,
  };
};
