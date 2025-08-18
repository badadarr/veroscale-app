-- Create exec_sql RPC function for Supabase
-- Run this script in Supabase SQL Editor to enable direct SQL execution

CREATE OR REPLACE FUNCTION public.exec_sql(sql text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result json;
BEGIN
    -- Execute the SQL and return result as JSON
    EXECUTE 'SELECT array_to_json(array_agg(row_to_json(t))) FROM (' || sql || ') t' INTO result;
    
    -- If result is null, return empty array
    IF result IS NULL THEN
        result := '[]'::json;
    END IF;
    
    RETURN result;
EXCEPTION
    WHEN OTHERS THEN
        -- Return error information
        RETURN json_build_object(
            'error', true,
            'message', SQLERRM,
            'sqlstate', SQLSTATE
        );
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.exec_sql(text) TO authenticated;

-- Optional: Grant to anon users if needed (not recommended for production)
-- GRANT EXECUTE ON FUNCTION public.exec_sql(text) TO anon;
