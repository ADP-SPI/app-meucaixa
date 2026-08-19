// Mock para funcionar sem Supabase
export const supabase = {
  from: (table: string) => ({
    insert: async (data: any) => {
      const existing = JSON.parse(localStorage.getItem(table) || '[]');
      existing.push({ ...data, id: Date.now(), created_at: new Date() });
      localStorage.setItem(table, JSON.stringify(existing));
      return { data: [data], error: null };
    },
    select: async (cols: string) => ({
      order: (field: string, options: any) => ({
        data: JSON.parse(localStorage.getItem(table) || '[]'),
        error: null
      })
    })
  })
};
