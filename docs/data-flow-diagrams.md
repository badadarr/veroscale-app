# Data Flow Diagram (DFD) Sistem Manajemen Berat

## Context Diagram (DFD Level 0)

Context Diagram menunjukkan sistem sebagai satu proses tunggal dengan entitas utama:
- Operator: Memasukkan data berat
- Manager: Menyetujui catatan berat
- IoT Devices: Memberikan pengukuran otomatis

[Lihat Context Diagram](./dfd-level-0.puml)

## DFD Level 1

DFD Level 1 memecah sistem menjadi tiga proses utama:

1. **Weight Recording**: Pencatatan data berat
2. **Weight Approval**: Persetujuan catatan berat
3. **Report Generation**: Pembuatan laporan

[Lihat DFD Level 1](./dfd-level-1.puml)

## DFD Level 2 - Weight Recording Process

Proses pencatatan berat terdiri dari:

1. **Capture Weight**: Mendapatkan data berat
2. **Save Record**: Menyimpan catatan

[Lihat DFD Level 2 - Weight Recording](./dfd-level-2-weight-recording.puml)

## DFD Level 2 - Weight Approval Process

Proses persetujuan berat terdiri dari:

1. **View Records**: Melihat catatan yang menunggu persetujuan
2. **Approve/Reject**: Membuat keputusan persetujuan

[Lihat DFD Level 2 - Weight Approval](./dfd-level-2-weight-approval.puml)