# Block Diagram Sistem Manajemen Berat

Block diagram adalah representasi visual dari sistem yang menunjukkan komponen utama dan hubungan antar komponen. Dokumen ini berisi beberapa block diagram untuk Sistem Manajemen Berat.

## Block Diagram Lengkap

Block diagram lengkap menunjukkan struktur sistem dengan detail komponen di setiap layer:

- Frontend Layer (User Interface)
- API Layer
- Service Layer (Business Logic)
- Data Layer
- External Systems

[Lihat Block Diagram Lengkap](./block-diagram.puml)

## Block Diagram Sederhana

Block diagram sederhana menunjukkan komponen utama sistem tanpa detail internal:

- User Interface
- Backend Services
- Database
- External Devices

[Lihat Block Diagram Sederhana](./block-diagram-simple.puml)

## Block Diagram Aliran Data

Block diagram aliran data menunjukkan bagaimana data mengalir melalui sistem:

- Data Sources (Manual Entry, IoT Scales, RFID Scanners)
- Processing (Data Validation, Weight Calculation, Approval Workflow)
- Storage (Weight Records, User Data)
- Output (Reports, Dashboards, Notifications)

[Lihat Block Diagram Aliran Data](./block-diagram-data-flow.puml)

## Block Diagram Deployment

Block diagram deployment menunjukkan bagaimana sistem di-deploy ke infrastruktur:

- Client Side (Web Browser dengan Next.js Frontend)
- Server Side (Vercel dengan API Routes dan Serverless Functions, Supabase dengan PostgreSQL dan Auth Services)
- IoT Environment (Weight Scales, RFID Readers)

[Lihat Block Diagram Deployment](./block-diagram-deployment.puml)
