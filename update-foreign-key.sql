-- Drop existing foreign key constraint
ALTER TABLE weight_records 
DROP CONSTRAINT IF EXISTS weight_records_item_id_fkey;

-- Add new foreign key constraint to samples_item
ALTER TABLE weight_records 
ADD CONSTRAINT weight_records_item_id_fkey 
FOREIGN KEY (item_id) REFERENCES samples_item(id) 
ON DELETE CASCADE ON UPDATE CASCADE;