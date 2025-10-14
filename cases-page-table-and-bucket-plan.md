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
   - **file_title** (optional) - "Written Warning - John Smith"
   - **file_description** (optional) - "Final written warning for repeated lateness..."
   - **file_tags** (array, optional) - ["Warning", "Disciplinary", "Final"]

The key here is **interaction_id is nullable**:
- If `interaction_id` is NULL → it's a **case-level file**
- If `interaction_id` has a value → it's an **interaction-level file**

**Document metadata** enables:
- Searchable documents by title/tags
- AI summarization without downloading files
- Better organization and filtering

## File Storage Structure

**Nested Directory Structure** for clear organization:

```
argan-admin-bucket/                    ← Internal Argan documents
├── {client-id}/
│   └── cases/
│       └── {case-id}/
│           ├── case-level/            ← Case-level files
│           │   ├── settlement-agreement.pdf
│           │   └── contract.pdf
│           └── interactions/          ← Interaction-level files
│               ├── interaction-5/
│               │   ├── evidence.pdf
│               │   └── email.pdf
│               └── interaction-7/
│                   └── witness-statement.pdf

argan-client-bucket/                   ← Client-facing documents
├── {client-id}/
│   ├── policies/
│   ├── handbooks/
│   └── ...
```

**Benefits of nested structure:**
- Clear separation between case-level and interaction-level
- Easy to find all files for a specific interaction
- Natural hierarchy matching data model
- Better for UI grouping and display

## File Naming Convention

With nested directories, filenames can be simpler:

**Case-level files:**
```
Path: {client-id}/cases/{case-id}/case-level/{timestamp}-{original-filename}.pdf
Example: 123/cases/CASE-0001/case-level/1634567890-settlement-agreement.pdf
```

**Interaction-level files:**
```
Path: {client-id}/cases/{case-id}/interactions/interaction-{id}/{timestamp}-{original-filename}.pdf
Example: 123/cases/CASE-0001/interactions/interaction-5/1634567890-evidence.pdf
```

**Benefits:**
- Directory structure provides context (no need for complex filenames)
- Timestamp prevents naming collisions
- Original filename preserved for clarity
- Easy to find all files for a specific interaction

## Implementation Approach

### File Upload Modal Workflow:

**1. User clicks paperclip icon** (Case Details Widget OR Interaction card)

**2. Modal opens with:**
- File selector
- **File Title** (optional text input) - "Written Warning - John Smith"
- **File Description** (optional textarea) - "Final written warning for..."
- **Tags** (optional multi-select) - Warning, Disciplinary, Evidence, etc.
- Upload button

**3. Upload logic determines path:**

**Case Details Widget (case-level):**
```
Path: {client-id}/cases/{case-id}/case-level/{timestamp}-{filename}
Database: interaction_id = NULL
```

**Interaction Widget (interaction-level):**
```
Path: {client-id}/cases/{case-id}/interactions/interaction-{id}/{timestamp}-{filename}
Database: interaction_id = {specific_interaction_id}
```

**4. Database record created in `case_files` table with:**
- file_url (S3 URL)
- file_title, file_description, file_tags (if provided)
- Linked to case (and interaction if applicable)
