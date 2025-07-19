# Diagram UML Sistem Manajemen Berat (Weight Management System)

Dokumen ini berisi kumpulan diagram UML yang menggambarkan struktur dan perilaku Sistem Manajemen Berat.

## Data Flow Diagram (DFD)

Diagram aliran data yang menggambarkan sistem manajemen berat.

- [DFD Level 0](./dfd-level-0.puml) - Diagram konteks sistem
- [DFD Level 1](./dfd-level-1.puml) - Proses utama sistem
- [DFD Level 2 - Weight Recording](./dfd-level-2-weight-recording.puml) - Proses pencatatan berat
- [DFD Level 2 - Weight Approval](./dfd-level-2-weight-approval.puml) - Proses persetujuan berat

## Diagram Entity Relationship (ERD)

Diagram ERD menggambarkan struktur database sistem dan hubungan antar entitas.

- [ERD (PlantUML)](./erd-diagram.puml) - Format PlantUML untuk ERD
- [ERD (Markdown)](./erd-diagram.md) - Deskripsi ERD dalam format Markdown
- [ERD (Mermaid)](./erd-diagram-mermaid.md) - ERD dalam format Mermaid

## Diagram Kelas (Class Diagram)

Diagram kelas menggambarkan struktur sistem dengan kelas-kelasnya, atribut, metode, dan hubungan antar kelas.

- [Class Diagram](./class-diagram.puml) - Diagram kelas lengkap dengan metode dan hubungan

## Diagram Sequence

Diagram sequence menggambarkan interaksi antar objek dalam urutan waktu.

- [Weight Recording Sequence](./sequence-diagram-weight-recording.puml) - Urutan interaksi untuk proses pencatatan berat
- [Weight Approval Sequence](./sequence-diagram-weight-approval.puml) - Urutan interaksi untuk proses persetujuan berat

## Diagram State

Diagram state menggambarkan berbagai keadaan yang dapat dialami oleh objek selama siklus hidupnya.

- [Weight Record State](./state-diagram-weight-record.puml) - Diagram state untuk siklus hidup catatan berat
- [Delivery State](./state-diagram-delivery.puml) - Diagram state untuk siklus hidup pengiriman dari pemasok

## Diagram Aktivitas (Activity Diagram)

Diagram aktivitas menggambarkan alur kerja proses bisnis utama dalam sistem.

- [Weight Recording Process](./activity-diagram-weight-recording.puml) - Proses pencatatan dan persetujuan berat
- [Supplier Delivery Process](./activity-diagram-supplier-delivery.puml) - Proses manajemen pengiriman dari pemasok

## Diagram Use Case

Diagram use case menggambarkan fungsionalitas sistem dari perspektif pengguna.

- [Use Case Diagram](./use-case-diagram.puml) - Diagram use case untuk semua aktor sistem

## Diagram Komponen (Component Diagram)

Diagram komponen menggambarkan arsitektur sistem dan hubungan antar komponen.

- [Component Diagram](./component-diagram.puml) - Diagram komponen sistem

## Diagram Deployment

Diagram deployment menggambarkan konfigurasi fisik perangkat keras dan perangkat lunak dalam sistem.

- [Deployment Diagram](./deployment-diagram.puml) - Diagram deployment untuk infrastruktur sistem

## Cara Melihat Diagram

Untuk melihat diagram-diagram ini dalam format visual:

1. Gunakan ekstensi PlantUML di editor kode seperti Visual Studio Code
2. Gunakan layanan online seperti [PlantUML Web Server](http://www.plantuml.com/plantuml/uml/)
3. Instal PlantUML secara lokal dan render diagram menggunakan command line

## Ringkasan Sistem

Sistem Manajemen Berat adalah aplikasi yang memungkinkan:

1. Pencatatan berat item dengan berbagai metode (manual, IoT, RFID)
2. Alur kerja persetujuan untuk catatan berat
3. Manajemen pemasok dan pengiriman
4. Pemrosesan batch untuk catatan berat
5. Pembuatan laporan kustom
6. Integrasi dengan perangkat IoT dan pemindai RFID

Sistem ini menggunakan database PostgreSQL (Supabase) dan diimplementasikan dengan Next.js untuk frontend dan backend API.