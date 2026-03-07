import { useCallback, useRef, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import datingService from '../../../../services/dating/datingService';
import { DATING_LAYOUT } from '../../../../constants/dating/theme';
import type { DiscoveryCard } from '../../../../types';

const QUERY_KEY = ['dating', 'discovery'] as const;
const { pageSize, prefetchThreshold } = DATING_LAYOUT.discovery.feed;

export function useDiscoveryFeed() {
  const queryClient = useQueryClient();
  const [cards, setCards] = useState<DiscoveryCard[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const pageRef = useRef(1);
  const hasMoreRef = useRef(true);

  const { isLoading } = useQuery({
    queryKey: [...QUERY_KEY, 1],
    queryFn: async () => {
      const res = await datingService.getDiscovery({
        page: '1',
        limit: String(pageSize),
      });
      const newCards = res.data ?? [];
      setCards(newCards);
      setCurrentIdx(0);
      hasMoreRef.current = 1 < (res.pagination?.totalPages ?? 1);
      return res;
    },
    staleTime: 1000 * 60 * 5,
  });

  const loadMore = useCallback(async () => {
    if (!hasMoreRef.current) return;
    pageRef.current += 1;
    const res = await datingService.getDiscovery({
      page: String(pageRef.current),
      limit: String(pageSize),
    });
    const newCards = res.data ?? [];
    setCards((prev) => [...prev, ...newCards]);
    hasMoreRef.current = pageRef.current < (res.pagination?.totalPages ?? 1);
  }, []);

  const swipeMutation = useMutation({
    mutationFn: (params: { targetUserId: string; action: 'LIKE' | 'UNLIKE' }) =>
      datingService.swipe(params),
    onSettled: () => {
      const nextIdx = currentIdx + 1;
      if (nextIdx >= cards.length - prefetchThreshold && hasMoreRef.current) {
        loadMore();
      }
      setCurrentIdx(nextIdx);
    },
  });

  const refresh = useCallback(() => {
    pageRef.current = 1;
    queryClient.invalidateQueries({ queryKey: QUERY_KEY });
  }, [queryClient]);

  const currentCard = cards[currentIdx] ?? null;
  const isEmpty = !isLoading && !currentCard;

  return {
    currentCard,
    isLoading,
    isEmpty,
    swipe: swipeMutation.mutateAsync,
    isSwiping: swipeMutation.isPending,
    isMatched: swipeMutation.data?.matched ?? false,
    resetMatch: () => swipeMutation.reset(),
    refresh,
  };
}
