-- Clean up contract service arrays to match current constants
-- This ensures all contracts only have valid service names from the defined constants

-- Clean up inclusive_services_in_scope
-- Keep only: 'HR Admin Support', 'Employment Law Support', 'Employee Support',
-- 'Auto Policy Review and Updates', 'Service Analytics'
UPDATE "contracts"
SET inclusive_services_in_scope = ARRAY(
  SELECT service
  FROM unnest(inclusive_services_in_scope) AS service
  WHERE service IN (
    'HR Admin Support',
    'Employment Law Support',
    'Employee Support',
    'Auto Policy Review and Updates',
    'Service Analytics'
  )
);

-- Clean up inclusive_services_out_of_scope
-- Keep only: 'Case Management', 'On Site Support', 'External Audit Reviews'
UPDATE "contracts"
SET inclusive_services_out_of_scope = ARRAY(
  SELECT service
  FROM unnest(inclusive_services_out_of_scope) AS service
  WHERE service IN (
    'Case Management',
    'On Site Support',
    'External Audit Reviews'
  )
);
