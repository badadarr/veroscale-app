# Entity Relationship Diagram - Weight Management System

## Entities and Relationships

### roles
- **id**: SERIAL (PK)
- **name**: VARCHAR(50) UNIQUE

### users
- **id**: SERIAL (PK)
- **name**: VARCHAR(100)
- **email**: VARCHAR(100) UNIQUE
- **password**: VARCHAR(255)
- **role_id**: INTEGER (FK to roles.id)
- **created_at**: TIMESTAMP
- **updated_at**: TIMESTAMP

### ref_items
- **id**: SERIAL (PK)
- **name**: VARCHAR(100) UNIQUE
- **weight**: DECIMAL(10,2)

### weight_records
- **record_id**: SERIAL (PK)
- **user_id**: INTEGER (FK to users.id)
- **item_id**: INTEGER (FK to ref_items.id)
- **total_weight**: DECIMAL(10,2)
- **timestamp**: TIMESTAMP
- **status**: VARCHAR(10) ['pending', 'approved', 'rejected']
- **approved_by**: INTEGER (FK to users.id)
- **approved_at**: TIMESTAMP
- **batch_number**: VARCHAR(100)
- **source**: VARCHAR(255)
- **destination**: VARCHAR(255)
- **notes**: TEXT
- **unit**: VARCHAR(10) default 'kg'

### sessions
- **session_id**: SERIAL (PK)
- **user_id**: INTEGER (FK to users.id)
- **start_time**: TIMESTAMP
- **end_time**: TIMESTAMP
- **status**: VARCHAR(10) ['active', 'inactive']

### samples_item
- **id**: SERIAL (PK)
- **category**: VARCHAR(100)
- **item**: VARCHAR(100)
- **sample_weight**: DECIMAL(10,2)
- **created_at**: TIMESTAMP
- **updated_at**: TIMESTAMP
- UNIQUE constraint on (category, item)

### suppliers
- **id**: SERIAL (PK)
- **name**: VARCHAR(100)
- **contact_person**: VARCHAR(100)
- **email**: VARCHAR(100)
- **phone**: VARCHAR(20)
- **address**: TEXT
- **status**: VARCHAR(20) ['active', 'inactive']
- **created_at**: TIMESTAMP
- **updated_at**: TIMESTAMP

### supplier_deliveries
- **id**: SERIAL (PK)
- **supplier_id**: INTEGER (FK to suppliers.id)
- **marketing_user_id**: INTEGER (FK to users.id)
- **item_name**: VARCHAR(200)
- **expected_quantity**: DECIMAL(10,2)
- **expected_weight**: DECIMAL(10,2)
- **scheduled_date**: DATE
- **delivery_status**: VARCHAR(20) ['scheduled', 'in_transit', 'delivered', 'delayed', 'cancelled']
- **actual_delivery_date**: DATE
- **notes**: TEXT
- **created_at**: TIMESTAMP
- **updated_at**: TIMESTAMP

### report_configurations
- **id**: SERIAL (PK)
- **name**: VARCHAR(100) UNIQUE
- **description**: TEXT
- **type**: VARCHAR(20) ['daily', 'weekly', 'monthly', 'quarterly', 'custom']
- **fields**: JSONB
- **schedule**: JSONB
- **recipients**: JSONB
- **created_at**: TIMESTAMP
- **updated_at**: TIMESTAMP
- **created_by**: INTEGER (FK to users.id)

### system_settings
- **id**: SERIAL (PK)
- **key**: VARCHAR(100) UNIQUE
- **value**: TEXT
- **category**: VARCHAR(50)
- **description**: TEXT
- **created_at**: TIMESTAMP
- **updated_at**: TIMESTAMP

## Relationships

1. **roles** (1) → **users** (many): A role can be assigned to many users
2. **users** (1) → **weight_records** (many): A user can record many weight measurements
3. **users** (1) → **sessions** (many): A user can have many login sessions
4. **users** (1) → **weight_records** (many): A user can approve many weight records
5. **users** (1) → **supplier_deliveries** (many): A marketing user manages many supplier deliveries
6. **users** (1) → **report_configurations** (many): A user can create many report configurations
7. **ref_items** (1) → **weight_records** (many): An item can have many weight measurements
8. **suppliers** (1) → **supplier_deliveries** (many): A supplier can provide many deliveries