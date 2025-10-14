# Cases Page Table and Bucket Plan

You're absolutely right to think this through now! Your structure makes perfect sense. Let me break down what I'm hearing and offer a recommendation:

## Database Structure

You'll need:

1. **Cases table** (linked to client_id)
   - id (primary key)
   - client_id (foreign key)
   - case_id (e.g., "CASE-0001")
   - title
   - escalated_by
   - assigned_to
   - status
   - action_required_by
   - description
   - created_at

2. **Interactions table** (linked to case_id)
   - id (primary key)
   - case_id (foreign key)
   - party1_name (who initiated/first party)
   - party1_type (ARGAN | CLIENT | CONTRACTOR | EMPLOYEE)
   - party2_name (who received/second party)
   - party2_type (ARGAN | CLIENT | CONTRACTOR | EMPLOYEE)
   - content
   - created_at

3. **Case Files table** (tracks all file attachments)
   - id (primary key)
   - case_id (foreign key)
   - interaction_id (foreign key, **nullable**)
   - file_name
   - file_url (S3 URL)
   - file_size
   - uploaded_at
   - uploaded_by

The key here is **interaction_id is nullable**:
- If `interaction_id` is NULL → it's a **case-level file**
- If `interaction_id` has a value → it's an **interaction-level file**

## File Storage Structure

Your bucket architecture is spot-on:

```
admin-bucket/                          ← Internal Argan documents
├── {client-id}/
│   ├── cases/
│   │   └── {case-id}/
│   │       ├── case-document-1.pdf        ← Case-level (no interaction ID)
│   │       ├── case-document-2.pdf
│   │       ├── interaction-{id}-doc.pdf   ← Interaction-level
│   │       └── interaction-{id}-evidence.pdf

client-bucket/                         ← Client-facing documents
├── {client-id}/
│   ├── policies/
│   ├── handbooks/
│   └── ...
```

## File Naming Convention

**Case-level files:**
```
{case-id}-{timestamp}-{original-filename}.pdf
Example: CASE-0001-1634567890-settlement-agreement.pdf
```

**Interaction-level files:**
```
{case-id}-interaction-{interaction-id}-{timestamp}-{original-filename}.pdf
Example: CASE-0001-interaction-5-1634567890-evidence.pdf
```

This way:
- You can easily see which case a file belongs to
- You can distinguish case vs interaction files by the presence of "interaction-{id}"
- Timestamp prevents naming collisions
- Original filename is preserved for user clarity

## Implementation Approach

When the file upload icon is clicked:
1. **In Case Details Widget** → `interaction_id = null` in database
2. **In Interactions Widget** → `interaction_id = {specific_interaction_id}` in database

The upload handler knows which level based on context. Does this structure work for what you're envisioning?
