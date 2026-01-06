import { getSupabaseClient } from '@/template';

export interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
}

export interface Order {
  id: string;
  token_number: number;
  user_id: string;
  items: OrderItem[];
  total_amount: number;
  status: 'queued' | 'preparing' | 'ready' | 'completed';
  time_slot: string;
  estimated_wait_time?: string;
  order_type: 'INSTANT' | 'SCHEDULED';
  pickup_time?: string;
  payment_method: 'ONLINE' | 'OFFLINE';
  payment_status: 'PAID' | 'PAY_ON_PICKUP';
  created_at: string;
}

export interface Receipt {
  id: string;
  receipt_id: string;
  order_id: string;
  user_id: string;
  token_number: number;
  items: OrderItem[];
  total_amount: number;
  payment_method: string;
  payment_status: string;
  created_at: string;
}

export const orderService = {
  async createOrder(
    userId: string,
    items: OrderItem[],
    totalAmount: number,
    timeSlot: string,
    orderType: 'INSTANT' | 'SCHEDULED',
    pickupTime: string | null,
    paymentMethod: 'ONLINE' | 'OFFLINE',
    paymentStatus: 'PAID' | 'PAY_ON_PICKUP',
    estimatedWaitTime?: string
  ): Promise<{ data: Order | null; error: string | null }> {
    const supabase = getSupabaseClient();

    const { data: tokenData, error: tokenError } = await supabase
      .rpc('get_next_token_number');

    if (tokenError) {
      return { data: null, error: tokenError.message };
    }

    const { data, error } = await supabase
      .from('orders')
      .insert([
        {
          token_number: tokenData,
          user_id: userId,
          items,
          total_amount: totalAmount,
          time_slot: timeSlot,
          estimated_wait_time: estimatedWaitTime,
          order_type: orderType,
          pickup_time: pickupTime,
          payment_method: paymentMethod,
          payment_status: paymentStatus,
          status: 'queued',
        },
      ])
      .select()
      .single();

    if (error) {
      return { data: null, error: error.message };
    }

    return { data, error: null };
  },

  async getUserOrders(userId: string): Promise<{ data: Order[] | null; error: string | null }> {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      return { data: null, error: error.message };
    }

    return { data, error: null };
  },

  async getAllOrders(): Promise<{ data: Order[] | null; error: string | null }> {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .neq('status', 'completed')
      .order('created_at', { ascending: true });

    if (error) {
      return { data: null, error: error.message };
    }

    return { data, error: null };
  },

  async updateOrderStatus(
    orderId: string,
    status: Order['status']
  ): Promise<{ error: string | null }> {
    const supabase = getSupabaseClient();
    const { error } = await supabase
      .from('orders')
      .update({ status })
      .eq('id', orderId);

    if (error) {
      return { error: error.message };
    }

    return { error: null };
  },

  subscribeToOrders(callback: (orders: Order[]) => void) {
    const supabase = getSupabaseClient();
    const channelName = `orders_changes_${Math.random().toString(36).substr(2, 9)}`;
    
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
        },
        () => {
          orderService.getAllOrders().then(({ data }) => {
            if (data) callback(data);
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },

  subscribeToUserOrders(userId: string, callback: (orders: Order[]) => void) {
    const supabase = getSupabaseClient();
    const channelName = `user_orders_${userId}_${Math.random().toString(36).substr(2, 9)}`;
    
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
          filter: `user_id=eq.${userId}`,
        },
        () => {
          orderService.getUserOrders(userId).then(({ data }) => {
            if (data) callback(data);
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },

  async createReceipt(
    orderId: string,
    userId: string,
    tokenNumber: number,
    items: OrderItem[],
    totalAmount: number,
    paymentMethod: string,
    paymentStatus: string
  ): Promise<{ data: Receipt | null; error: string | null }> {
    const supabase = getSupabaseClient();

    try {
      const receiptId = `RCP${Date.now()}${Math.floor(Math.random() * 1000)}`;

      const { data, error } = await supabase
        .from('receipts')
        .insert({
          receipt_id: receiptId,
          order_id: orderId,
          user_id: userId,
          token_number: tokenNumber,
          items,
          total_amount: totalAmount,
          payment_method: paymentMethod,
          payment_status: paymentStatus,
        })
        .select()
        .single();

      if (error) {
        return { data: null, error: error.message };
      }

      return { data, error: null };
    } catch (err) {
      return { data: null, error: String(err) };
    }
  },

  async getReceipt(
    orderId: string
  ): Promise<{ data: Receipt | null; error: string | null }> {
    const supabase = getSupabaseClient();

    try {
      const { data, error } = await supabase
        .from('receipts')
        .select('*')
        .eq('order_id', orderId)
        .single();

      if (error) {
        return { data: null, error: error.message };
      }

      return { data, error: null };
    } catch (err) {
      return { data: null, error: String(err) };
    }
  },
};
