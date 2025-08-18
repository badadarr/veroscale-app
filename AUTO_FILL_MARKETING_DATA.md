# Auto-Fill Marketing Data Feature

## Overview

Fitur baru telah ditambahkan untuk otomatis mengisi data dari marketing ketika operator memilih sample:

### Workflow:

1. **Operator memilih sample** dari dropdown
2. **Target weight otomatis terisi** dengan `sample_weight` dari data marketing
3. **Variance dihitung** jika IoT weight sudah ada
4. **Visual feedback** ditampilkan untuk konfirmasi

### Changes Made:

#### 1. Sample Selection Enhancement

- Dropdown sample sekarang menampilkan "Target: X kg" instead of "Sample: X kg"
- Label menambahkan hint "(target weight will auto-fill)"

#### 2. Auto-Fill Logic

Ketika operator memilih sample:

```javascript
// Auto-fill manager weight dengan sample weight (marketing target)
setManagerWeight(selectedSample.sample_weight);

// Calculate variance jika IoT weight sudah ada
if (iotWeight) {
  const variance = iotWeight - selectedSample.sample_weight;
  const percentage = (variance / selectedSample.sample_weight) * 100;
  // Set variance info...
}

// Show success notification
toast.success(
  `Sample selected! Target weight ${selectedSample.sample_weight} kg auto-filled from marketing data`
);
```

#### 3. UI Improvements

- **Target Weight Field**:

  - Label berubah dari "Manager Weight" ke "Target Weight"
  - Subtitle: "(auto-filled from marketing data)"
  - Field menjadi read-only ketika belum ada sample yang dipilih
  - Visual badge "From Marketing" muncul ketika data terisi otomatis

- **Success Indicators**:
  - Green notification bubble setelah select sample
  - Green check mark dan text konfirmasi
  - Toast notification untuk feedback langsung

#### 4. Visual Flow:

1. **Before Selection**:

   - Target Weight field kosong dan read-only
   - Placeholder: "Will auto-fill when sample is selected"

2. **After Selection**:
   - Target Weight terisi otomatis dengan sample_weight
   - Green badge "From Marketing" muncul
   - Green success message di bawah dropdown
   - Toast notification muncul
   - Jika IoT weight sudah ada, variance langsung dihitung

### Benefits:

1. **Konsistensi Data**: Target weight selalu sesuai dengan spesifikasi marketing
2. **Efisiensi**: Operator tidak perlu input manual target weight
3. **Akurasi**: Mengurangi human error dalam input target weight
4. **Transparansi**: Jelas terlihat bahwa data berasal dari marketing
5. **Real-time Variance**: Variance langsung dihitung ketika target weight terisi

### Data Flow:

```
Marketing Team → Sample Creation (sample_weight) → Operator Selection → Auto-fill Target Weight → IoT Weight Input → Variance Calculation
```

Sekarang operator hanya perlu:

1. Pilih sample ✅ (target weight auto-fill)
2. Input/scan IoT weight ✅
3. Submit ✅

Target weight dari marketing akan otomatis terisi dan variance akan dihitung secara real-time!
