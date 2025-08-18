# Panduan Migrasi MySQL ke Supabase

## STATUS MIGRASI: ✅ SELESAI

**Semua API endpoint telah berhasil dimigrasi ke Supabase!**

Berikut file yang telah dimigrasi:
- ✅ `pages/api/issues/[id].ts`
- ✅ `pages/api/weights/[id].ts`
- ✅ `pages/api/weights/index.ts`
- ✅ `pages/api/weights/batch.ts`
- ✅ `pages/api/samples/[id].ts`
- ✅ `pages/api/samples/index.ts`
- ✅ `pages/api/materials/[id].ts`
- ✅ `pages/api/users/index.ts`
- ✅ `pages/api/profile/index.ts`
- ✅ `pages/api/settings/index.ts`
- ✅ `pages/api/auth/login.ts`
- ✅ `pages/api/reports/configurations/[id].ts`

**Semua conditional logic `useSupabase` telah dihapus dan semua endpoint menggunakan format SQL melalui db-adapter.**

---

Berikut langkah-langkah untuk migrasi seluruh API dari MySQL ke Supabase:

## Langkah 1: Memperbarui Imports

Ganti:
```typescript
import { executeQuery } from "@/lib/db";
// atau
import { executeQuery } from "../../lib/db";
```

Menjadi:
```typescript
import { executeQuery } from "@/lib/db-adapter";
// atau
import { executeQuery } from "../../lib/db-adapter";
```

## Langkah 2: Menghapus Pengecekan `useSupabase`

Hapus semua kode seperti ini:

```typescript
const useSupabase = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

if (useSupabase) {
  // Kode Supabase
} else {
  // Kode MySQL
}
```

Dan simpan hanya bagian kode Supabase.

## Langkah 3: Mengubah Format Query

### 3.1 Format SELECT

Ganti:
```typescript
// MySQL
const records = await executeQuery<any[]>({
  query: `SELECT * FROM table WHERE id = ?`,
  values: [id],
});
```

Menjadi:
```typescript
// Supabase
const record = await executeQuery<any>({
  table: "table",
  action: "select",
  columns: "*",
  filters: { id },
  single: true
});
```

### 3.2 Format INSERT

Ganti:
```typescript
// MySQL
await executeQuery({
  query: "INSERT INTO table (field1, field2) VALUES (?, ?)",
  values: [value1, value2],
});
```

Menjadi:
```typescript
// Supabase
await executeQuery({
  table: "table",
  action: "insert",
  data: { field1: value1, field2: value2 },
  returning: "*"
});
```

### 3.3 Format UPDATE

Ganti:
```typescript
// MySQL
await executeQuery({
  query: "UPDATE table SET field1 = ?, field2 = ? WHERE id = ?",
  values: [value1, value2, id],
});
```

Menjadi:
```typescript
// Supabase
await executeQuery({
  table: "table",
  action: "update",
  data: { field1: value1, field2: value2 },
  filters: { id },
  returning: "*"
});
```

### 3.4 Format DELETE

Ganti:
```typescript
// MySQL
await executeQuery({
  query: "DELETE FROM table WHERE id = ?",
  values: [id],
});
```

Menjadi:
```typescript
// Supabase
await executeQuery({
  table: "table",
  action: "delete",
  filters: { id }
});
```

## Langkah 4: Menangani Relasi dan Join

Ganti:
```typescript
// MySQL
const records = await executeQuery<any[]>({
  query: `
    SELECT t1.*, t2.name as related_name
    FROM table1 t1
    JOIN table2 t2 ON t1.related_id = t2.id
    WHERE t1.id = ?
  `,
  values: [id],
});
```

Menjadi:
```typescript
// Supabase
const record = await executeQuery<any>({
  table: "table1",
  action: "select",
  columns: "*, table2(name)",  // Atau format yang sesuai dengan relasi Supabase
  filters: { id },
  single: true
});
```

## Langkah 5: Menangani Variabel Skema (Optional)

Hapus prefiks skema `public.` jika ada:

Ganti:
```typescript
table: "public.table_name"
```

Menjadi:
```typescript
table: "table_name"
```

## Langkah 6: Menangani `record_id` dan `id`

Pastikan field yang digunakan untuk identifier konsisten. Jika diperlukan, ganti:

```typescript
filters: { record_id: id }
```

Menjadi:
```typescript
filters: { id }
```

## Catatan Tambahan

1. Periksa hasil pengembalian Supabase, yang mungkin berbeda dari MySQL
2. Perhatikan format tanggal, gunakan `new Date().toISOString()` untuk input tanggal
3. Untuk beberapa kasus khusus mungkin memerlukan penyesuaian tambahan

## Contoh File yang Sudah Diperbarui

Lihat file `pages/api/issues/[id].ts` untuk contoh file yang sudah sepenuhnya menggunakan Supabase.
