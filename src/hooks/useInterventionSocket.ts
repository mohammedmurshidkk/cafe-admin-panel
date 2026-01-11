import { useEffect, useRef, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { io, Socket } from 'socket.io-client';
import { RootState } from '@/store/store';
import { cakePricingApi } from '@/store/api/cakePricingApi';
import { toast } from 'sonner';

const API_URL = import.meta.env.VITE_API_URL || '';

interface UseInterventionSocketOptions {
    enabled?: boolean;
}

export const useInterventionSocket = (options: UseInterventionSocketOptions = {}) => {
    const { enabled = true } = options;
    const dispatch = useDispatch();
    const token = useSelector((state: RootState) => state.auth.token);
    const businessId = useSelector((state: RootState) => state.auth.user?.business_id);
    const socketRef = useRef<Socket | null>(null);

    useEffect(() => {
        if (!token || !enabled) return;

        socketRef.current = io(API_URL, {
            auth: { token },
            transports: ['websocket'],
        });

        socketRef.current.on('connect', () => {
            console.log('Intervention socket connected');
            if (businessId) {
                socketRef.current?.emit('join_business', { businessId });
            }
        });

        socketRef.current.on('disconnect', () => {
            console.log('Intervention socket disconnected');
        });

        // Listen for intervention created
        socketRef.current.on('intervention_created', (data: any) => {
            dispatch(cakePricingApi.util.invalidateTags(['CakeQuotes', 'CakePricing']));
            // Also invalidate the new Interventions API
            dispatch({ type: 'api/invalidateTags', payload: ['Interventions'] });
            toast.info('New Intervention Required', {
                description: `New ${data.type?.replace('_', ' ') || 'request'} received`,
            });
        });

        // Listen for intervention updated
        socketRef.current.on('intervention_updated', () => {
            dispatch(cakePricingApi.util.invalidateTags(['CakeQuotes', 'CakePricing']));
            dispatch({ type: 'api/invalidateTags', payload: ['Interventions'] });
        });

        // Listen for intervention resolved
        // Listen for intervention resolved
        socketRef.current.on('intervention_resolved', (data: any) => {
            dispatch(cakePricingApi.util.invalidateTags(['CakeQuotes', 'CakePricing']));
            dispatch({ type: 'api/invalidateTags', payload: ['Interventions'] });
            if (data?.session_id) {
                dispatch({ type: 'api/invalidateTags', payload: [{ type: 'Messages', id: data.session_id }] });
            }
        });

        return () => {
            socketRef.current?.disconnect();
        };
    }, [token, businessId, enabled, dispatch]);

    return {
        socket: socketRef.current,
        isConnected: socketRef.current?.connected ?? false,
    };
};
