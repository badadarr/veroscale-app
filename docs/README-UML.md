# Dokumentasi UML Sistem Manajemen Berat

## Pendahuluan

Dokumentasi ini berisi kumpulan diagram UML (Unified Modeling Language) yang menggambarkan berbagai aspek dari Sistem Manajemen Berat. Diagram-diagram ini dirancang untuk memberikan pemahaman komprehensif tentang struktur, perilaku, dan arsitektur sistem.

## Daftar Diagram

Dokumentasi ini mencakup berbagai jenis diagram UML:

1. **Context Diagram dan DFD**
   - Menggambarkan sistem secara keseluruhan dan aliran data dalam sistem

2. **Entity Relationship Diagram (ERD)**
   - Menggambarkan struktur database dan hubungan antar entitas

3. **Class Diagram**
   - Menggambarkan struktur objek sistem dengan atribut dan metode

4. **Sequence Diagram**
   - Menggambarkan interaksi antar objek dalam urutan waktu

5. **State Diagram**
   - Menggambarkan berbagai keadaan yang dapat dialami oleh objek

6. **Activity Diagram**
   - Menggambarkan alur kerja proses bisnis utama

7. **Use Case Diagram**
   - Menggambarkan fungsionalitas sistem dari perspektif pengguna

8. **Component Diagram**
   - Menggambarkan komponen sistem dan hubungannya

9. **Deployment Diagram**
   - Menggambarkan konfigurasi fisik perangkat keras dan perangkat lunak

## Cara Menggunakan Dokumentasi

Untuk melihat diagram-diagram ini dalam format visual:

1. **Menggunakan PlantUML Extension di VS Code**
   - Instal ekstensi PlantUML di Visual Studio Code
   - Buka file .puml dan gunakan fitur preview

2. **Menggunakan PlantUML Web Server**
   - Kunjungi [PlantUML Web Server](http://www.plantuml.com/plantuml/uml/)
   - Salin konten file .puml dan tempel di editor online

3. **Menggunakan Command Line**
   - Instal PlantUML JAR
   - Jalankan perintah: `java -jar plantuml.jar filename.puml`

## Indeks Diagram

Lihat [uml-diagrams.md](./uml-diagrams.md) untuk daftar lengkap dan tautan ke semua diagram yang tersedia.

## Pembaruan Dokumentasi

Dokumentasi UML ini harus diperbarui setiap kali ada perubahan signifikan pada struktur atau perilaku sistem. Pastikan untuk memperbarui diagram yang relevan dan file indeks ketika melakukan perubahan.

## Konvensi Penamaan

Semua file diagram mengikuti konvensi penamaan berikut:
- `[jenis-diagram]-[subjek].puml`

Contoh:
- `activity-diagram-weight-recording.puml`
- `sequence-diagram-weight-approval.puml`
- `state-diagram-delivery.puml`