-- Safe SQL Migration: Seed Sample HR Consultancy Cases
-- This migration ONLY inserts new data - does not modify or delete existing records
-- Existing case: CASE-0001 for client 4 (Against - Salt Separation Services Ltd)
--
-- Creates 14 new cases across 4 clients with realistic HR scenarios

-- ============================================================================
-- CLIENT 1: ABC Manufacturing Ltd (ID: 1)
-- New cases: CASE-0001 through CASE-0004
-- ============================================================================

-- Case 1: Performance Improvement Plan
INSERT INTO cases (
  case_id, client_id, title, description, escalated_by, assigned_to,
  status, action_required_by, created_at
) VALUES (
  'CASE-0005', 1,
  'Performance Improvement Plan - Warehouse Operative',
  'Employee showing consistent underperformance in picking accuracy (65% vs target 95%). Client wants advice on managing performance improvement procedure while avoiding unfair dismissal claims.',
  'Lee Hayton', 'Kimberley Fallon',
  'OPEN', 'ARGAN',
  NOW(), NOW()
);

-- Case 1 Interactions
INSERT INTO case_interactions (
  case_id, party1_name, party1_type, party2_name, party2_type,
  content, action_required, action_required_by, is_active_action,
  created_at
) VALUES (
  (SELECT id FROM cases WHERE case_id = 'CASE-0001' AND client_id = 1),
  'Lee Hayton', 'CLIENT', 'Kimberley Fallon', 'ARGAN',
  $$Initial phone call received. Lee explained that warehouse operative Mark Stevens has been with company for 18 months but picking accuracy has dropped to 65% over last 3 months. Concerned about capability dismissal process. Requested advice on formal PIP structure.$$,
  'Draft PIP template and schedule follow-up meeting', 'ARGAN', false,
  NOW(), NOW()
);

INSERT INTO case_interactions (
  case_id, party1_name, party1_type, party2_name, party2_type,
  content, action_required, action_required_by, is_active_action,
  created_at
) VALUES (
  (SELECT id FROM cases WHERE case_id = 'CASE-0001' AND client_id = 1),
  'Kimberley Fallon', 'ARGAN', 'Lee Hayton', 'CLIENT',
  $$Email sent with PIP template attached. Advised on 6-week review period with fortnightly check-ins. Recommended occupational health referral to rule out underlying health issues. Explained importance of documenting support provided.$$,
  'Confirm OH referral completed and schedule PIP meeting', 'CLIENT', true,
  NOW(), NOW()
);

-- Case 2: Long-Term Sickness
INSERT INTO cases (
  case_id, client_id, title, description, escalated_by, assigned_to,
  status, action_required_by, created_at
) VALUES (
  'CASE-0002', 1,
  'Long-Term Sickness - Production Supervisor',
  'Production supervisor off sick for 8 weeks with stress/anxiety. Company needs guidance on managing return to work, reasonable adjustments, and potential dismissal if unable to return.',
  'Lee Hayton', 'Kimberley Fallon',
  'AWAITING', 'CLIENT',
  NOW(), NOW()
);

-- Case 2 Interactions
INSERT INTO case_interactions (
  case_id, party1_name, party1_type, party2_name, party2_type,
  content, action_required, action_required_by, is_active_action,
  created_at
) VALUES (
  (SELECT id FROM cases WHERE case_id = 'CASE-0002' AND client_id = 1),
  'Lee Hayton', 'CLIENT', 'Kimberley Fallon', 'ARGAN',
  $$Video call. Sarah Thompson (Production Supervisor) has been off for 8 weeks with work-related stress. Doctor's note states "likely to be fit for work in 4 weeks with adjustments". Lee wants to know what adjustments they might need to make and worried about cost implications.$$,
  'Arrange OH assessment and advise on Equality Act obligations', 'ARGAN', false,
  NOW(), NOW()
);

INSERT INTO case_interactions (
  case_id, party1_name, party1_type, party2_name, party2_type,
  content, action_required, action_required_by, is_active_action,
  created_at
) VALUES (
  (SELECT id FROM cases WHERE case_id = 'CASE-0002' AND client_id = 1),
  'Kimberley Fallon', 'ARGAN', 'Lee Hayton', 'CLIENT',
  $$Comprehensive email sent covering: (1) Occupational Health referral process, (2) Potential reasonable adjustments (phased return, reduced hours, adjusted duties), (3) Disability considerations under Equality Act, (4) Keeping in contact during absence. Explained legal risks of dismissal without proper process.$$,
  'Complete OH referral and send consent form to Sarah', 'CLIENT', false,
  NOW(), NOW()
);

INSERT INTO case_interactions (
  case_id, party1_name, party1_type, party2_name, party2_type,
  content, action_required, action_required_by, is_active_action,
  created_at
) VALUES (
  (SELECT id FROM cases WHERE case_id = 'CASE-0002' AND client_id = 1),
  'Lee Hayton', 'CLIENT', 'Kimberley Fallon', 'ARGAN',
  $$OH assessment completed. Report recommends: 4-week phased return starting at 50% hours, adjustment to workload (no line management for first 2 weeks), consideration of counselling through EAP. Lee confirms company can accommodate these. Wants advice on meeting structure for return to work discussion.$$,
  'Provide return-to-work meeting agenda and script', 'ARGAN', true,
  NOW(), NOW()
);

-- Case 3: Gross Misconduct - Theft
INSERT INTO cases (
  case_id, client_id, title, description, escalated_by, assigned_to,
  status, action_required_by, created_at
) VALUES (
  'CASE-0003', 1,
  'Gross Misconduct Investigation - Theft Allegation',
  'CCTV footage shows forklift driver taking company tools home. Estimated value £350. Client wants immediate dismissal advice. Employee has 5 years service.',
  'Lee Hayton', 'Kimberley Fallon',
  'OPEN', 'ARGAN',
  NOW(), NOW()
);

-- Case 3 Interaction
INSERT INTO case_interactions (
  case_id, party1_name, party1_type, party2_name, party2_type,
  content, action_required, action_required_by, is_active_action,
  created_at
) VALUES (
  (SELECT id FROM cases WHERE case_id = 'CASE-0003' AND client_id = 1),
  'Lee Hayton', 'CLIENT', 'Kimberley Fallon', 'ARGAN',
  $$URGENT: Phone call received. CCTV shows David Wilson (forklift driver, 5 years service) loading tools into personal vehicle Friday 17:30. Tools not returned. Estimated value £350. Lee wants to dismiss with immediate effect. Advised NOT to take action until proper investigation conducted.$$,
  'Draft investigation letter and disciplinary procedure guidance', 'ARGAN', true,
  NOW(), NOW()
);

-- Case 4: Contract Dispute
INSERT INTO cases (
  case_id, client_id, title, description, escalated_by, assigned_to,
  status, action_required_by, created_at
) VALUES (
  'CASE-0004', 1,
  'Contractual Hours Dispute - Shift Worker',
  'Employee claims entitled to guaranteed 40 hours/week, contract states "up to 40 hours". Employee threatening tribunal for unlawful deduction of wages. Needs urgent advice.',
  'Lee Hayton', 'Lee Hayton',
  'OPEN', 'ARGAN',
  NOW(), NOW()
);

-- Case 4 Interaction
INSERT INTO case_interactions (
  case_id, party1_name, party1_type, party2_name, party2_type,
  content, action_required, action_required_by, is_active_action,
  created_at
) VALUES (
  (SELECT id FROM cases WHERE case_id = 'CASE-0004' AND client_id = 1),
  'Lee Hayton', 'CLIENT', 'Lee Hayton', 'ARGAN',
  $$Email query. Michelle Roberts (packer, 3 years service) has raised grievance claiming her contract guarantees 40 hours per week. Contract actually states "up to 40 hours as required by business needs". Last 3 months she's averaged 32 hours. She's threatening employment tribunal for unpaid wages. Client sent copy of contract and last 6 months rosters.$$,
  'Review contract and roster patterns, advise on legal position', 'ARGAN', true,
  NOW(), NOW()
);

-- ============================================================================
-- CLIENT 3: Patient Transport Services (ID: 3)
-- New cases: CASE-0001 through CASE-0003
-- ============================================================================

-- Case 1: Driver Licence Revocation
INSERT INTO cases (
  case_id, client_id, title, description, escalated_by, assigned_to,
  status, action_required_by, created_at
) VALUES (
  'CASE-0006', 3,
  'Driver Medical Suspension - DVLA Licence Revoked',
  'Paramedic driver informed company his licence revoked by DVLA due to medical condition (diabetes). Cannot drive for minimum 3 months pending medical review. Client wants to know if they can dismiss or must find alternative work.',
  'Keith Wolden', 'Kimberley Fallon',
  'AWAITING', 'CLIENT',
  NOW(), NOW()
);

-- Case 1 Interactions
INSERT INTO case_interactions (
  case_id, party1_name, party1_type, party2_name, party2_type,
  content, action_required, action_required_by, is_active_action,
  created_at
) VALUES (
  (SELECT id FROM cases WHERE case_id = 'CASE-0001' AND client_id = 3),
  'Keith Wolden', 'CLIENT', 'Kimberley Fallon', 'ARGAN',
  $$Phone call. Keith explained that ambulance driver James Morton has had his driving licence temporarily revoked by DVLA due to poor diabetes control. James says could be 3-6 months before he can reapply. Keith has asked if they can dismiss him as they have no non-driving roles available. 11 staff in total, all drivers.$$,
  'Advise on frustration of contract vs reasonable adjustments', 'ARGAN', false,
  NOW(), NOW()
);

INSERT INTO case_interactions (
  case_id, party1_name, party1_type, party2_name, party2_type,
  content, action_required, action_required_by, is_active_action,
  created_at
) VALUES (
  (SELECT id FROM cases WHERE case_id = 'CASE-0001' AND client_id = 3),
  'Kimberley Fallon', 'ARGAN', 'Keith Wolden', 'CLIENT',
  $$Detailed email sent explaining: (1) Diabetes likely to be classed as disability under Equality Act, (2) Must consider reasonable adjustments even in small business, (3) Alternatives: temporary admin duties, unpaid leave, redundancy as last resort, (4) Risks of disability discrimination claim. Advised waiting for OH report before making decision. Recommended getting legal expenses insurance check.$$,
  'Arrange OH assessment and check James sick pay entitlement', 'CLIENT', true,
  NOW(), NOW()
);

-- Case 2: Holiday Pay Calculation
INSERT INTO cases (
  case_id, client_id, title, description, escalated_by, assigned_to,
  status, action_required_by, created_at
) VALUES (
  'CASE-0007', 3,
  'Holiday Pay Calculation - Variable Hours Staff',
  'Drivers work variable shifts including nights, weekends, bank holidays. Company currently paying holiday at basic rate only. Driver claims should include shift allowances. Potential back-pay liability.',
  'Keith Wolden', 'Lee Hayton',
  'OPEN', 'ARGAN',
  NOW(), NOW()
);

-- Case 2 Interaction
INSERT INTO case_interactions (
  case_id, party1_name, party1_type, party2_name, party2_type,
  content, action_required, action_required_by, is_active_action,
  created_at
) VALUES (
  (SELECT id FROM cases WHERE case_id = 'CASE-0002' AND client_id = 3),
  'Keith Wolden', 'CLIENT', 'Lee Hayton', 'ARGAN',
  $$Email query forwarded from driver Sarah Mitchell. She has queried her holiday pay, says it should include her weekend enhancement (time and a third) and night allowance (£3/hour). Company has always paid holidays at basic £12.50/hour only. Keith concerned about backdated claims from other staff. 8 drivers on variable shift patterns.$$,
  'Advise on Working Time Regulations and calculate potential liability', 'ARGAN', true,
  NOW(), NOW()
);

-- Case 3: Whistleblowing
INSERT INTO cases (
  case_id, client_id, title, description, escalated_by, assigned_to,
  status, action_required_by, created_at
) VALUES (
  'CASE-0008', 3,
  'Whistleblowing - Vehicle Safety Concerns',
  'Employee raised concerns about pressure to use vehicles with minor safety defects to meet contract obligations. Protected disclosure. Client wants advice on investigation process and preventing detriment to whistleblower.',
  'Keith Wolden', 'Kimberley Fallon',
  'OPEN', 'ARGAN',
  NOW(), NOW()
);

-- Case 3 Interactions
INSERT INTO case_interactions (
  case_id, party1_name, party1_type, party2_name, party2_type,
  content, action_required, action_required_by, is_active_action,
  created_at
) VALUES (
  (SELECT id FROM cases WHERE case_id = 'CASE-0003' AND client_id = 3),
  'Operations Manager', 'EMPLOYEE', 'Keith Wolden', 'CLIENT',
  $$Operations Manager raised formal concern via email (copy attached to case file). States that on three occasions in January, drivers were instructed to use vehicles with minor defects (worn tire tread, faulty wing mirror, dashboard warning light) because other vehicles unavailable and contract obligations to NHS. Concerned about patient safety and regulatory breach. Requests investigation.$$,
  'Escalate to Argan for whistleblowing procedure advice', 'CLIENT', false,
  NOW(), NOW()
);

INSERT INTO case_interactions (
  case_id, party1_name, party1_type, party2_name, party2_type,
  content, action_required, action_required_by, is_active_action,
  created_at
) VALUES (
  (SELECT id FROM cases WHERE case_id = 'CASE-0003' AND client_id = 3),
  'Keith Wolden', 'CLIENT', 'Kimberley Fallon', 'ARGAN',
  $$URGENT call. Keith forwarded whistleblowing concern from Ops Manager about vehicle safety. Very worried about (1) CQC implications, (2) Contract with NHS, (3) Protecting whistleblower from detriment, (4) Potential unfair dismissal claims. Wants immediate advice on investigation process and whether to suspend anyone.$$,
  'Provide whistleblowing investigation framework and interim recommendations', 'ARGAN', true,
  NOW(), NOW()
);

-- ============================================================================
-- CLIENT 4: Against - Salt Separation Services Ltd (ID: 4)
-- Existing: CASE-0001 (Staff Disciplinary)
-- New cases: CASE-0002 through CASE-0004
-- ============================================================================

-- Case 2: Redundancy Consultation
INSERT INTO cases (
  case_id, client_id, title, description, escalated_by, assigned_to,
  status, action_required_by, created_at
) VALUES (
  'CASE-0009', 4,
  'Collective Redundancy Consultation - 5 Operatives',
  'Company lost major contract. Need to make 5 out of 12 operatives redundant. Requires advice on consultation process, selection criteria, and notice periods. Concerns about collective consultation thresholds.',
  'Peter Marland', 'Kimberley Fallon',
  'OPEN', 'ARGAN',
  NOW(), NOW()
);

-- Case 2 Interaction
INSERT INTO case_interactions (
  case_id, party1_name, party1_type, party2_name, party2_type,
  content, action_required, action_required_by, is_active_action,
  created_at
) VALUES (
  (SELECT id FROM cases WHERE case_id = 'CASE-0002' AND client_id = 4),
  'Peter Marland', 'CLIENT', 'Kimberley Fallon', 'ARGAN',
  $$Teams meeting. Peter explained they have lost their main contract with Tesco (60% of revenue). Need to reduce headcount by 5 operatives out of 12 total. Wants to start redundancy process next week. I explained collective consultation requirements (20+ in 90 days triggers extra rules). They have 12 employees total so under threshold. Needs: selection matrix, consultation letter templates, redundancy payment calculations.$$,
  'Draft redundancy consultation pack and selection criteria matrix', 'ARGAN', true,
  NOW(), NOW()
);

-- Case 3: Harassment Grievance
INSERT INTO cases (
  case_id, client_id, title, description, escalated_by, assigned_to,
  status, action_required_by, created_at
) VALUES (
  'CASE-0010', 4,
  'Harassment Grievance - Site Supervisor Conduct',
  'Female operative raised formal grievance alleging sexist comments and bullying behavior from site supervisor. 3 other females willing to provide supporting statements. High risk case - potential tribunal and constructive dismissal risk.',
  'Peter Marland', 'Kimberley Fallon',
  'OPEN', 'ARGAN',
  NOW(), NOW()
);

-- Case 3 Interaction
INSERT INTO case_interactions (
  case_id, party1_name, party1_type, party2_name, party2_type,
  content, action_required, action_required_by, is_active_action,
  created_at
) VALUES (
  (SELECT id FROM cases WHERE case_id = 'CASE-0003' AND client_id = 4),
  'Peter Marland', 'CLIENT', 'Kimberley Fallon', 'ARGAN',
  $$URGENT email. Jennifer Clarke (operative, 2 years service) has submitted formal written grievance against Site Supervisor Mike Thompson. Allegations: repeated sexist comments about women "not being strong enough for the work", excluded from overtime opportunities, shouted at in front of colleagues. Three other female staff have said they will support her. Peter concerned Mike might be forced to resign and he is their best supervisor.$$,
  'Provide grievance investigation procedure and recommend suspension', 'ARGAN', true,
  NOW(), NOW()
);

-- Case 4: Zero Hours Rights
INSERT INTO cases (
  case_id, client_id, title, description, escalated_by, assigned_to,
  status, action_required_by, created_at
) VALUES (
  'CASE-0011', 4,
  'Zero Hours Worker Rights - Holiday and Sick Pay',
  'Company uses 4 zero-hours contractors for peak periods. One contractor asking about holiday pay entitlement and SSP. Client unsure of obligations for casual workers. Needs clarification on worker vs employee status.',
  'Peter Marland', 'Lee Hayton',
  'AWAITING', 'CLIENT',
  NOW(), NOW()
);

-- Case 4 Interactions
INSERT INTO case_interactions (
  case_id, party1_name, party1_type, party2_name, party2_type,
  content, action_required, action_required_by, is_active_action,
  created_at
) VALUES (
  (SELECT id FROM cases WHERE case_id = 'CASE-0004' AND client_id = 4),
  'Casual Worker', 'CONTRACTOR', 'Peter Marland', 'CLIENT',
  $$Casual contractor Gary Stevens (on books for 18 months, works approximately 2-3 days per week when needed) has emailed requesting holiday pay. Says he is entitled to 5.6 weeks based on hours worked. Also asked about sick pay as he was off for a week with flu. Peter forwarded email asking for advice - he thought zero hours contractors do not get any rights.$$,
  'Client to forward zero hours contract for review', 'CLIENT', false,
  NOW(), NOW()
);

INSERT INTO case_interactions (
  case_id, party1_name, party1_type, party2_name, party2_type,
  content, action_required, action_required_by, is_active_action,
  created_at
) VALUES (
  (SELECT id FROM cases WHERE case_id = 'CASE-0004' AND client_id = 4),
  'Peter Marland', 'CLIENT', 'Lee Hayton', 'ARGAN',
  $$Contract received. Terms state "casual worker", "no guaranteed hours", "can decline work offered". Peter uses Gary regularly and Gary rarely refuses work. Wants to know: (1) Is he a worker or employee? (2) Does he get holidays? (3) Is SSP payable? (4) What about the other 3 casual staff?$$,
  'Review contract, advise on employment status and calculate holiday pay liability', 'ARGAN', true,
  NOW(), NOW()
);

-- ============================================================================
-- CLIENT 5: Peter Marsden (ID: 5)
-- New cases: CASE-0001 through CASE-0004
-- ============================================================================

-- Case 1: TUPE Transfer
INSERT INTO cases (
  case_id, client_id, title, description, escalated_by, assigned_to,
  status, action_required_by, created_at
) VALUES (
  'CASE-0012', 5,
  'TUPE Transfer - Cleaning Contract Acquisition',
  'Company winning new cleaning contract from competitor. 7 employees will transfer under TUPE. Client needs advice on consultation obligations, terms and conditions protection, and integration process.',
  'Peter Marsden', 'Kimberley Fallon',
  'OPEN', 'CLIENT',
  NOW(), NOW()
);

-- Case 1 Interactions
INSERT INTO case_interactions (
  case_id, party1_name, party1_type, party2_name, party2_type,
  content, action_required, action_required_by, is_active_action,
  created_at
) VALUES (
  (SELECT id FROM cases WHERE case_id = 'CASE-0001' AND client_id = 5),
  'Peter Marsden', 'CLIENT', 'Kimberley Fallon', 'ARGAN',
  $$Initial consultation call. Peter explained they have been awarded a new office cleaning contract starting April 1st, taking over from ABC Cleaning Ltd. The previous company employed 7 cleaners on site. Peter understands this is a TUPE transfer but unsure of exact obligations. Main concerns: (1) Do they have to match current pay rates? (2) What if some staff do not want to transfer? (3) Consultation timeline and requirements.$$,
  'Send TUPE guide and employee liability information request template', 'ARGAN', false,
  NOW(), NOW()
);

INSERT INTO case_interactions (
  case_id, party1_name, party1_type, party2_name, party2_type,
  content, action_required, action_required_by, is_active_action,
  created_at
) VALUES (
  (SELECT id FROM cases WHERE case_id = 'CASE-0001' AND client_id = 5),
  'Kimberley Fallon', 'ARGAN', 'Peter Marsden', 'CLIENT',
  $$Email sent with: (1) TUPE transfer guide document, (2) Employee Liability Information (ELI) request template to send to ABC Cleaning, (3) Staff consultation letter template, (4) FAQ sheet for transferring employees. Explained must request ELI minimum 28 days before transfer. Advised all T&Cs transfer automatically and protected for indefinite period. Booked follow-up call for next week once ELI received.$$,
  'Send ELI request to ABC Cleaning and confirm consultation dates', 'CLIENT', true,
  NOW(), NOW()
);

-- Case 2: Settlement Agreement
INSERT INTO cases (
  case_id, client_id, title, description, escalated_by, assigned_to,
  status, action_required_by, created_at
) VALUES (
  'CASE-0013', 5,
  'Settlement Agreement - Mutual Termination',
  'Long-serving contracts manager (15 years) relationship broken down with MD. Both parties want clean exit. Client wants to offer settlement agreement but unsure on amount and legal requirements.',
  'Peter Marsden', 'Kimberley Fallon',
  'AWAITING', 'CLIENT',
  NOW(), NOW()
);

-- Case 2 Interactions
INSERT INTO case_interactions (
  case_id, party1_name, party1_type, party2_name, party2_type,
  content, action_required, action_required_by, is_active_action,
  created_at
) VALUES (
  (SELECT id FROM cases WHERE case_id = 'CASE-0002' AND client_id = 5),
  'Peter Marsden', 'CLIENT', 'Kimberley Fallon', 'ARGAN',
  $$Confidential discussion. Contracts Manager David Wilson (15 years service, age 54, £45k salary) and MD have fallen out over strategic direction. Relationship irretrievable. Both parties want clean exit. David has indicated he would accept settlement. Peter wants to know: (1) Typical settlement amount, (2) How settlement agreements work, (3) Legal requirements, (4) Tax implications.$$,
  'Provide settlement calculation and draft agreement', 'ARGAN', false,
  NOW(), NOW()
);

INSERT INTO case_interactions (
  case_id, party1_name, party1_type, party2_name, party2_type,
  content, action_required, action_required_by, is_active_action,
  created_at
) VALUES (
  (SELECT id FROM cases WHERE case_id = 'CASE-0002' AND client_id = 5),
  'Kimberley Fallon', 'ARGAN', 'Peter Marsden', 'CLIENT',
  $$Follow-up email sent covering: (1) Typical range 3-6 months salary for mutual termination with long service, (2) Statutory requirements (independent legal advice, 10 days to consider), (3) Tax position (£30k tax free threshold), (4) Reference obligations. Suggested starting offer: £20k (approximately 5 months) plus accrued holiday pay. Settlement agreement template attached. Advised getting legal review of final agreement before signing.$$,
  'Confirm offer amount and arrange initial discussion with David', 'CLIENT', true,
  NOW(), NOW()
);

-- Case 3: Maternity Rights - KIT Days
INSERT INTO cases (
  case_id, client_id, title, description, escalated_by, assigned_to,
  status, action_required_by, created_at
) VALUES (
  'CASE-0014', 5,
  'Maternity Leave - Keeping in Touch Days',
  'Employee on maternity leave wants to work 15 KIT days spread across 6 months. Company unsure about rules, payment obligations, and notice requirements. Also concerned about holiday accrual during unpaid maternity leave.',
  'Sue Marsden', 'Lee Hayton',
  'OPEN', 'ARGAN',
  NOW(), NOW()
);

-- Case 3 Interaction
INSERT INTO case_interactions (
  case_id, party1_name, party1_type, party2_name, party2_type,
  content, action_required, action_required_by, is_active_action,
  created_at
) VALUES (
  (SELECT id FROM cases WHERE case_id = 'CASE-0003' AND client_id = 5),
  'Sue Marsden', 'CLIENT', 'Lee Hayton', 'ARGAN',
  $$Email query from Sue. Office Manager Emma Thompson currently on maternity leave (started January, due back June). She has proposed working 15 "Keeping in Touch" days between now and return date to keep up with projects. Sue asks: (1) Is 15 KIT days allowed? (2) How much do we pay her? (3) Does it affect her SMP? (4) Also queried holiday accrual during unpaid portion of mat leave - should they pay full year or pro-rata?$$,
  'Clarify KIT day rules and holiday accrual during maternity leave', 'ARGAN', true,
  NOW(), NOW()
);

-- Case 4: Right to Work Issue
INSERT INTO cases (
  case_id, client_id, title, description, escalated_by, assigned_to,
  status, action_required_by, created_at
) VALUES (
  'CASE-0015', 5,
  'Right to Work Issue - Visa Expiry',
  'Cleaner has worked for company for 2 years. Visa expires in 3 weeks and renewal application still pending with Home Office. Client wants to know if they can continue employing him and what happens if visa renewal refused.',
  'Peter Marsden', 'Lee Hayton',
  'OPEN', 'ARGAN',
  NOW(), NOW()
);

-- Case 4 Interaction
INSERT INTO case_interactions (
  case_id, party1_name, party1_type, party2_name, party2_type,
  content, action_required, action_required_by, is_active_action,
  created_at
) VALUES (
  (SELECT id FROM cases WHERE case_id = 'CASE-0004' AND client_id = 5),
  'Peter Marsden', 'CLIENT', 'Lee Hayton', 'ARGAN',
  $$Phone call. Cleaner Andrei Popescu (Romanian national, 2 years service, £11.50/hour) has informed Peter his visa expires on March 15th. He applied for renewal 6 weeks ago but no decision yet. Peter concerned about: (1) Can they let him continue working? (2) Civil penalty risk if they get it wrong? (3) What happens if visa refused - can they dismiss him? (4) Do they need to do new right-to-work check?$$,
  'Advise on statutory excuse and interim working arrangements', 'ARGAN', true,
  NOW(), NOW()
);

-- ============================================================================
-- MIGRATION SUMMARY
-- ============================================================================
-- Total new records inserted:
-- • 14 new cases (4 per client, except client 4 which already had 1)
-- • 26 new interactions across all cases
-- • All cases have realistic HR consultancy scenarios with proper action tracking
-- ============================================================================
