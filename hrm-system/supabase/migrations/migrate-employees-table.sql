-- Migrate employees table to use designation_id and department_id
-- Add new columns
alter table employees
add column designation_id uuid references designations(id) on delete set null,
add column department_id uuid references departments(id) on delete set null;

-- Drop old text columns (after verifying data is migrated)
-- alter table employees drop column designation;
-- alter table employees drop column department;

select 'Employees table updated with designation_id and department_id columns!' as status;
