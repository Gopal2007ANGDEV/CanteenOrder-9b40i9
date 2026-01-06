import { getSupabaseClient } from '@/template';

export const aiService = {
  async estimateWaitTime(
    activeOrders: number,
    itemCount: number
  ): Promise<{ data: string | null; error: string | null }> {
    const supabase = getSupabaseClient();

    try {
      const { data, error } = await supabase.functions.invoke('estimate-wait-time', {
        body: { activeOrders, itemCount },
      });

      if (error) {
        return { data: null, error: error.message };
      }

      return { data: data.estimation, error: null };
    } catch (err) {
      return { data: null, error: String(err) };
    }
  },
};
