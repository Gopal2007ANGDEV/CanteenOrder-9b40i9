import { getSupabaseClient } from '@/template';

export interface MenuItem {
  id: string;
  name: string;
  price: number;
  image_url: string;
  is_veg: boolean;
  is_available: boolean;
}

export const menuService = {
  async getAvailableMenu(): Promise<{ data: MenuItem[] | null; error: string | null }> {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('menu')
      .select('*')
      .eq('is_available', true)
      .order('name');

    if (error) {
      return { data: null, error: error.message };
    }

    return { data, error: null };
  },

  async getAllMenu(): Promise<{ data: MenuItem[] | null; error: string | null }> {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('menu')
      .select('*')
      .order('name');

    if (error) {
      return { data: null, error: error.message };
    }

    return { data, error: null };
  },

  async addMenuItem(item: Omit<MenuItem, 'id'>): Promise<{ data: MenuItem | null; error: string | null }> {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('menu')
      .insert([item])
      .select()
      .single();

    if (error) {
      return { data: null, error: error.message };
    }

    return { data, error: null };
  },

  async updateMenuItem(id: string, updates: Partial<MenuItem>): Promise<{ error: string | null }> {
    const supabase = getSupabaseClient();
    const { error } = await supabase
      .from('menu')
      .update(updates)
      .eq('id', id);

    if (error) {
      return { error: error.message };
    }

    return { error: null };
  },

  async deleteMenuItem(id: string): Promise<{ error: string | null }> {
    const supabase = getSupabaseClient();
    const { error } = await supabase
      .from('menu')
      .delete()
      .eq('id', id);

    if (error) {
      return { error: error.message };
    }

    return { error: null };
  },
};
