import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';
import { friendshipService } from '@/services/friendship';
import type { Friendship } from '@/types/friendship';

export function usePendingFriendRequests() {
    const { userId } = useAuth();
    const [pendingRequests, setPendingRequests] = useState<Friendship[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const loadPendingRequests = async () => {
        if (!userId) {
            setPendingRequests([]);
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            setError(null);
            
            const result = await friendshipService.getFriends('pending');
            const allFriendships = result?.friendships || [];
            const pending = allFriendships.filter((f: Friendship) =>
                f.status === 'pending' && f.addresseeId === userId
            );

            setPendingRequests(pending as Friendship[]);
        } catch (err) {
            console.error('Error loading pending requests:', err);
            setError(err instanceof Error ? err.message : 'Failed to load pending requests');
            setPendingRequests([]);
        } finally {
            setLoading(false);
        }
    };

    const handleFriendshipUpdate = () => {
        loadPendingRequests();
    };

    useEffect(() => {
        loadPendingRequests();
    }, [userId]);

    return {
        pendingRequests,
        loading,
        error,
        handleFriendshipUpdate,
        refresh: loadPendingRequests
    };
}