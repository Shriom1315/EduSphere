import { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
export const useRealtime = (table: string, schoolId?: string) => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [channel, setChannel] = useState<RealtimeChannel | null>(null);

  useEffect(() => {
    if (!schoolId) return;

    const fetchInitialData = async () => {
      try {
        const q = query(collection(db, table), where('schoolId', '==', schoolId));
        const querySnapshot = await getDocs(q);
        const initialData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        setData(initialData || []);
      } catch (error) {
        console.error(`Error fetching ${table}:`, error);
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();

    // Set up real-time subscription
    const realtimeChannel = supabase
      .channel(`${table}_changes`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: table,
          filter: `school_id=eq.${schoolId}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setData((prev) => [...prev, payload.new]);
          } else if (payload.eventType === 'UPDATE') {
            setData((prev) =>
              prev.map((item) =>
                item.id === payload.new.id ? payload.new : item
              )
            );
          } else if (payload.eventType === 'DELETE') {
            setData((prev) =>
              prev.filter((item) => item.id !== payload.old.id)
            );
          }
        }
      )
      .subscribe();

    setChannel(realtimeChannel);

    return () => {
      if (realtimeChannel) {
        supabase.removeChannel(realtimeChannel);
      }
    };
  }, [table, schoolId]);

  return { data, loading, channel };
};