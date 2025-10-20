import { useState, useEffect, useCallback } from 'react';
import { supabase, handleSupabaseError } from '../lib/supabaseClient';
import type { Database } from '../lib/supabaseClient';

// Generic hook for fetching data from Supabase
export function useSupabaseQuery<T = any>(
  table: keyof Database['public']['Tables'],
  query?: {
    select?: string;
    filter?: { column: string; operator: string; value: any }[];
    orderBy?: { column: string; ascending?: boolean };
    limit?: number;
  }
) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        let queryBuilder = supabase
          .from(table as string)
          .select(query?.select || '*');

        // Apply filters
        if (query?.filter) {
          query.filter.forEach(({ column, operator, value }) => {
            if (operator === 'in') {
              // Handle 'in' operator correctly with array of values
              const values = typeof value === 'string' ? value.split(',') : value;
              queryBuilder = queryBuilder.in(column, values);
            } else {
              queryBuilder = queryBuilder.filter(column, operator, value);
            }
          });
        }

        // Apply ordering
        if (query?.orderBy) {
          queryBuilder = queryBuilder.order(
            query.orderBy.column,
            { ascending: query.orderBy.ascending ?? true }
          );
        }

        // Apply limit
        if (query?.limit) {
          queryBuilder = queryBuilder.limit(query.limit);
        }

        const { data: result, error: queryError } = await queryBuilder;

        console.log(`Supabase Query Debug - Table: ${table}`, {
          query,
          result,
          queryError,
          resultLength: result?.length || 0
        });

        if (queryError) {
          console.error(`Supabase Query Error - Table: ${table}`, queryError);
          setError(handleSupabaseError(queryError));
          // Set empty data instead of leaving it undefined
          setData([]);
        } else {
          setData(result as T[] || []);
        }
      } catch (err) {
        setError(handleSupabaseError(err));
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [table, JSON.stringify(query)]);

  const refetch = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      let queryBuilder = supabase
        .from(table as string)
        .select(query?.select || '*');

      // Apply filters
      if (query?.filter) {
        query.filter.forEach(({ column, operator, value }) => {
          if (operator === 'in') {
            // Handle 'in' operator correctly with array of values
            const values = typeof value === 'string' ? value.split(',') : value;
            queryBuilder = queryBuilder.in(column, values);
          } else {
            queryBuilder = queryBuilder.filter(column, operator, value);
          }
        });
      }

      // Apply ordering
      if (query?.orderBy) {
        queryBuilder = queryBuilder.order(
          query.orderBy.column,
          { ascending: query.orderBy.ascending ?? true }
        );
      }

      // Apply limit
      if (query?.limit) {
        queryBuilder = queryBuilder.limit(query.limit);
      }

      const { data: result, error: queryError } = await queryBuilder;

      console.log(`Supabase Query Debug - Table: ${table}`, {
        query,
        result,
        queryError,
        resultLength: result?.length || 0
      });

      if (queryError) {
        console.error(`Supabase Query Error - Table: ${table}`, queryError);
        setError(handleSupabaseError(queryError));
        // Set empty data instead of leaving it undefined
        setData([]);
      } else {
        setData((result as T[]) || []);
      }
    } catch (err) {
      setError(handleSupabaseError(err));
    } finally {
      setLoading(false);
    }
  }, [table, JSON.stringify(query)]);

  return { data, loading, error, refetch };
}

// Hook for inserting data
export function useSupabaseInsert<T = any>(table: keyof Database['public']['Tables']) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const insert = async (data: T) => {
    try {
      setLoading(true);
      setError(null);

      // For debugging: log the data being inserted
      console.log('Inserting data:', data);

      const { data: result, error: insertError } = await supabase
        .from(table as string)
        .insert(data)
        .select()
        .single();

      if (insertError) {
        console.error('Insert error details:', {
          message: insertError.message,
          details: insertError.details,
          hint: insertError.hint,
          code: insertError.code
        });
        setError(handleSupabaseError(insertError));
        return null;
      }

      return result;
    } catch (err) {
      console.error('Insert exception:', err);
      setError(handleSupabaseError(err));
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { insert, loading, error };
}

// Hook for updating data
export function useSupabaseUpdate<T = any>(table: keyof Database['public']['Tables']) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const update = async (id: number | string, data: Partial<T>) => {
    try {
      setLoading(true);
      setError(null);

      // For debugging: log the data being updated
      console.log(`Updating ${table} with id ${id}:`, data);

      const { data: result, error: updateError } = await supabase
        .from(table as string)
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (updateError) {
        console.error('Update error details:', {
          message: updateError.message,
          details: updateError.details,
          hint: updateError.hint,
          code: updateError.code,
          table,
          id,
          data
        });
        setError(handleSupabaseError(updateError));
        return null;
      }

      console.log(`Successfully updated ${table}:`, result);
      return result;
    } catch (err) {
      console.error('Update exception:', err);
      setError(handleSupabaseError(err));
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { update, loading, error };
}

// Hook for deleting data
export function useSupabaseDelete(table: keyof Database['public']['Tables']) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const deleteRecord = async (id: number | string) => {
    try {
      setLoading(true);
      setError(null);

      const { error: deleteError } = await supabase
        .from(table as string)
        .delete()
        .eq('id', id);

      if (deleteError) {
        setError(handleSupabaseError(deleteError));
        return false;
      }

      return true;
    } catch (err) {
      setError(handleSupabaseError(err));
      return false;
    } finally {
      setLoading(false);
    }
  };

  return { deleteRecord, loading, error };
}

// Hook for real-time subscriptions
export function useSupabaseSubscription(
  table: keyof Database['public']['Tables'],
  callback: (payload: any) => void
) {
  useEffect(() => {
    const subscription = supabase
      .channel(`${table}_changes`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: table as string,
        },
        callback
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [table, callback]);
}