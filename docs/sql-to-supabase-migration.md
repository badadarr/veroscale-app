# Migrasi dari SQL Queries ke Supabase API

## Latar Belakang

Aplikasi ini awalnya dibangun menggunakan kueri SQL langsung untuk berinteraksi dengan database. Namun, saat berpindah ke Supabase, pendekatan ini perlu diubah karena Supabase tidak mendukung eksekusi kueri SQL langsung melalui JavaScript API-nya. Supabase menggunakan pendekatan API berbasis tabel yang lebih aman dan efisien.

## Masalah yang Diperbaiki

Ketika menggunakan kueri SQL langsung dengan Supabase, error berikut mungkin muncul:

```
Error: Could not find the function public.execute_sql(params, sql_query) in the schema cache
```

Ini terjadi karena fungsi `execute_sql` yang dicoba dipanggil tidak ada di Supabase.

## Solusi

### 1. Gunakan `db-adapter.ts` bukan `db.ts` langsung

File `lib/db-adapter.ts` berisi abstraksi yang dapat bekerja dengan baik untuk MySQL dan Supabase. Ketika mengimpor fungsi-fungsi database, selalu gunakan:

```typescript
import { executeQuery } from '../lib/db-adapter';
```

bukan

```typescript
import { executeQuery } from '../lib/db'; // JANGAN GUNAKAN INI
```

### 2. Format Query yang Benar untuk Supabase

Saat menggunakan `executeQuery`, pastikan menggunakan format yang mendukung Supabase:

#### Sebelum (format SQL):

```typescript
const users = await executeQuery<any[]>({
  query: `SELECT * FROM users WHERE id = ?`,
  values: [userId]
});
```

#### Sesudah (format Supabase):

```typescript
const users = await executeQuery<any[]>({
  table: 'users',
  action: 'select',
  columns: '*',
  filters: { id: userId }
});
```

### 3. Format Update yang Benar untuk Supabase

#### Sebelum (format SQL):

```typescript
await executeQuery({
  query: `UPDATE users SET name = ?, email = ? WHERE id = ?`,
  values: [name, email, userId]
});
```

#### Sesudah (format Supabase):

```typescript
await executeQuery({
  table: 'users',
  action: 'update',
  data: {
    name,
    email
  },
  filters: { id: userId }
});
```

### 4. Format Insert yang Benar untuk Supabase

#### Sebelum (format SQL):

```typescript
await executeQuery({
  query: `INSERT INTO users (name, email, password, role_id) VALUES (?, ?, ?, ?)`,
  values: [name, email, hashedPassword, roleId]
});
```

#### Sesudah (format Supabase):

```typescript
await executeQuery({
  table: 'users',
  action: 'insert',
  data: {
    name,
    email,
    password: hashedPassword,
    role_id: roleId
  }
});
```

### 5. Format Delete yang Benar untuk Supabase

#### Sebelum (format SQL):

```typescript
await executeQuery({
  query: `DELETE FROM users WHERE id = ?`,
  values: [userId]
});
```

#### Sesudah (format Supabase):

```typescript
await executeQuery({
  table: 'users',
  action: 'delete',
  filters: { id: userId }
});
```

## Limitasi dan Workaround

### Relasi (JOIN)

Untuk query dengan JOIN, gunakan format nested relation dengan Supabase:

```typescript
const records = await executeQuery<any[]>({
  table: 'weight_records',
  action: 'select',
  columns: `
    *,
    ref_items!weight_records_item_id_fkey(name),
    users!weight_records_user_id_fkey(name)
  `,
  filters: { status: 'pending' }
});

// Setelah mendapatkan data, transformasikan ke format yang diharapkan
const processedRecords = records.map(record => ({
  ...record,
  item_name: record.ref_items?.name,
  user_name: record.users?.name
}));
```

### Agregasi (GROUP BY, SUM, COUNT)

Untuk operasi agregasi:

1. Gunakan fungsi agregat dalam string columns:

```typescript
const result = await executeQuery<any[]>({
  table: 'weight_records',
  action: 'select',
  columns: 'count(*)', // atau 'sum(total_weight)'
});
```

2. Jika perlu GROUP BY, ambil semua data dan lakukan agregasi di memori:

```typescript
// Ambil semua data
const items = await executeQuery<any[]>({
  table: 'samples_item',
  action: 'select',
  columns: 'category, sample_weight',
});

// Proses secara manual untuk GROUP BY
const categoryTotals = {};
items.forEach(item => {
  if (item.category) {
    categoryTotals[item.category] = (categoryTotals[item.category] || 0) + 
      parseFloat(item.sample_weight);
  }
});

// Format ulang hasilnya
const result = Object.entries(categoryTotals)
  .map(([category, total_weight]) => ({ category, total_weight }))
  .sort((a, b) => b.total_weight - a.total_weight);
```

## Kesimpulan

Dengan menggunakan pendekatan API berbasis tabel, aplikasi dapat berinteraksi dengan Supabase dengan aman dan efisien. Meskipun beberapa operasi kompleks memerlukan pendekatan yang berbeda dibanding SQL langsung, `db-adapter.ts` menyediakan abstraksi yang memungkinkan kode untuk bekerja baik dengan MySQL maupun Supabase.
