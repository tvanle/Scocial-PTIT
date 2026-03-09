import { useCallback, useEffect, useRef, useState } from 'react';
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
  const cardsLengthRef = useRef(0);
  const currentCardRef = useRef<DiscoveryCard | null>(null);
  const [matchedCard, setMatchedCard] = useState<DiscoveryCard | null>(null);
  const removedUserIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    cardsLengthRef.current = cards.length;
  }, [cards.length]);

  useEffect(() => {
    currentCardRef.current = cards[currentIdx] ?? null;
  }, [cards, currentIdx]);

  const { data: queryData, isLoading, isError, error } = useQuery({
    queryKey: QUERY_KEY,
    queryFn: async () => {
      const res = await datingService.getDiscovery({
        page: '1',
        limit: String(pageSize),
      });
      const newCards = (res.data ?? []).filter(
        (card) => !removedUserIdsRef.current.has(card.userId),
      );
      setCards(newCards);
      setCurrentIdx(0);
      pageRef.current = 1;
      hasMoreRef.current = 1 < (res.pagination?.totalPages ?? 1);
      return res;
    },
    staleTime: 1000 * 60 * 5,
  });

  useEffect(() => {
    if (queryData?.data != null) {
      setCards(
        queryData.data.filter(
          (card) => !removedUserIdsRef.current.has(card.userId),
        ),
      );
      setCurrentIdx(0);
      pageRef.current = 1;
      hasMoreRef.current = 1 < (queryData.pagination?.totalPages ?? 1);
    }
  }, [queryData]);

  const isProfileMissing =
    isError &&
    (error as { response?: { status?: number } })?.response?.status === 404;

  const loadMore = useCallback(async () => {
    if (!hasMoreRef.current) return;
    try {
      pageRef.current += 1;
      const res = await datingService.getDiscovery({
        page: String(pageRef.current),
        limit: String(pageSize),
      });
      const newCards = (res.data ?? []).filter(
        (card) => !removedUserIdsRef.current.has(card.userId),
      );
      setCards((prev) => [...prev, ...newCards]);
      hasMoreRef.current = pageRef.current < (res.pagination?.totalPages ?? 1);
    } catch {
      pageRef.current -= 1;
    }
  }, []);

  const swipeMutation = useMutation({
    mutationFn: (params: { targetUserId: string; action: 'LIKE' | 'UNLIKE' }) =>
      datingService.swipe(params),
    onSuccess: (data: { matched?: boolean | null }) => {
      // Không invalidate discovery feed để tránh refetch reset cards + currentIdx
      if (data?.matched) {
        const matched = currentCardRef.current;
        setMatchedCard(matched);
        if (matched) {
          removedUserIdsRef.current.add(matched.userId);
          setCards((prev) =>
            prev.filter((card) => card.userId !== matched.userId),
          );
        }
      }
    },
    onSettled: () => {
      setCurrentIdx((prev) => {
        const shouldAdvance = !swipeMutation.data?.matched;
        const nextIdx = shouldAdvance ? prev + 1 : prev;
        if (
          nextIdx >= cardsLengthRef.current - prefetchThreshold &&
          hasMoreRef.current
        ) {
          loadMore();
        }
        return nextIdx;
      });
    },
  });

  const refresh = useCallback(() => {
    pageRef.current = 1;
    return queryClient.refetchQueries({ queryKey: QUERY_KEY });
  }, [queryClient]);

  const consumeMatch = useCallback(() => {
    swipeMutation.reset();
    setMatchedCard(null);
  }, [swipeMutation]);

  const currentCard = cards[currentIdx] ?? null;
  const isEmpty = !isLoading && !isError && !currentCard;

  return {
    currentCard,
    isLoading,
    isEmpty,
    isProfileMissing,
    swipe: swipeMutation.mutateAsync,
    isSwiping: swipeMutation.isPending,
    isMatched: (swipeMutation.data?.matched ?? false) && !!matchedCard,
    matchedCard,
    consumeMatch,
    refresh,
  };
}
