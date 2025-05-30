-- Memastikan fungsi exec_sql tersedia untuk menjalankan SQL dinamis
-- Simpan file ini sebagai check-exec-sql.sql

-- Buat fungsi exec_sql jika belum ada
CREATE OR REPLACE FUNCTION exec_sql(sql text) RETURNS SETOF json AS $$
BEGIN
  RETURN QUERY EXECUTE sql;
EXCEPTION WHEN others THEN
  RAISE EXCEPTION 'SQL Error: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
