# Weight Management System - Entity Relationship Diagram

```mermaid
erDiagram
    ROLES {
        int id PK
        varchar name UK
    }
    
    USERS {
        int id PK
        varchar name
        varchar email UK
        varchar password
        int role_id FK
        timestamp created_at
        timestamp updated_at
    }
    
    REF_ITEMS {
        int id PK
        varchar name UK
        decimal weight
    }
    
    WEIGHT_RECORDS {
        int record_id PK
        int user_id FK
        int item_id FK
        decimal total_weight
        timestamp timestamp
        varchar status
        int approved_by FK
        timestamp approved_at
        varchar batch_number
        varchar source
        varchar destination
        text notes
        varchar unit
    }
    
    SESSIONS {
        int session_id PK
        int user_id FK
        timestamp start_time
        timestamp end_time
        varchar status
    }
    
    SAMPLES_ITEM {
        int id PK
        varchar category
        varchar item
        decimal sample_weight
        timestamp created_at
        timestamp updated_at
    }
    
    SUPPLIERS {
        int id PK
        varchar name
        varchar contact_person
        varchar email
        varchar phone
        text address
        varchar status
        timestamp created_at
        timestamp updated_at
    }
    
    SUPPLIER_DELIVERIES {
        int id PK
        int supplier_id FK
        int marketing_user_id FK
        varchar item_name
        decimal expected_quantity
        decimal expected_weight
        date scheduled_date
        varchar delivery_status
        date actual_delivery_date
        text notes
        timestamp created_at
        timestamp updated_at
    }
    
    REPORT_CONFIGURATIONS {
        int id PK
        varchar name UK
        text description
        varchar type
        jsonb fields
        jsonb schedule
        jsonb recipients
        timestamp created_at
        timestamp updated_at
        int created_by FK
    }
    
    SYSTEM_SETTINGS {
        int id PK
        varchar key UK
        text value
        varchar category
        text description
        timestamp created_at
        timestamp updated_at
    }
    
    ROLES ||--o{ USERS : "has"
    USERS ||--o{ WEIGHT_RECORDS : "records"
    USERS ||--o{ SESSIONS : "has"
    USERS ||--o{ WEIGHT_RECORDS : "approves"
    USERS ||--o{ SUPPLIER_DELIVERIES : "manages"
    USERS ||--o{ REPORT_CONFIGURATIONS : "creates"
    REF_ITEMS ||--o{ WEIGHT_RECORDS : "measured as"
    SUPPLIERS ||--o{ SUPPLIER_DELIVERIES : "provides"
```

## Entity Descriptions

1. **ROLES**: Defines user roles in the system (admin, manager, operator, marketing)
2. **USERS**: Stores user information and their assigned roles
3. **REF_ITEMS**: Reference items with their standard weights
4. **WEIGHT_RECORDS**: Records of weight measurements with approval workflow
5. **SESSIONS**: User login sessions tracking
6. **SAMPLES_ITEM**: Sample items categorized by material type with their sample weights
7. **SUPPLIERS**: Information about material suppliers
8. **SUPPLIER_DELIVERIES**: Scheduled and actual deliveries from suppliers
9. **REPORT_CONFIGURATIONS**: Configurations for generating various reports
10. **SYSTEM_SETTINGS**: System-wide configuration settings

## Key Business Processes

1. **Weight Recording**: Operators record weights of materials using reference items or samples
2. **Approval Workflow**: Managers approve or reject weight records
3. **Supplier Management**: Managing suppliers and their deliveries
4. **Batch Processing**: Grouping weight records into batches
5. **Reporting**: Generating reports based on configured templates
6. **User Session Management**: Tracking user login sessions