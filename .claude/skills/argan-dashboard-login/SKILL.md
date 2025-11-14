---
name: argan-dashboard-login
description: Log into the Argan HR production dashboard at argan-hr-system.vercel.app using admin credentials. Use when you need to access the production dashboard, test features in production, or perform manual testing. Uses Playwright MCP tools to automate browser interactions.
allowed-tools: mcp__playwright__browser_navigate, mcp__playwright__browser_snapshot, mcp__playwright__browser_click, mcp__playwright__browser_type, mcp__playwright__browser_fill_form, mcp__playwright__browser_wait_for, mcp__playwright__browser_take_screenshot
---

# Argan Dashboard Login

This Skill logs into the Argan HR production dashboard using the Playwright MCP server.

## Production Credentials

- **URL**: https://argan-hr-system.vercel.app/admin
- **Username**: admin@argan.hr
- **Password**: password

## Instructions

When logging into the Argan HR dashboard:

1. **Navigate to the login page**:
   ```
   Use mcp__playwright__browser_navigate with URL: https://argan-hr-system.vercel.app/admin
   ```

2. **Take a snapshot** to verify the page loaded:
   ```
   Use mcp__playwright__browser_snapshot to see the page structure
   ```

3. **Fill in the login form**:
   - Use `mcp__playwright__browser_fill_form` with:
     - Email field: admin@argan.hr
     - Password field: password

   OR use individual field filling:
   - Use `mcp__playwright__browser_type` for email field
   - Use `mcp__playwright__browser_type` for password field

4. **Submit the form**:
   - Use `mcp__playwright__browser_click` to click the login/submit button

5. **Wait for navigation**:
   ```
   Use mcp__playwright__browser_wait_for to ensure dashboard loads
   ```

6. **Verify successful login**:
   - Take a snapshot or screenshot to confirm you're on the dashboard
   - Look for dashboard elements like "Dashboard", "Clients", "Users" navigation

## Important Notes

- **Never use the browser-tester sub-agent** - Use Playwright MCP tools directly
- **Always take snapshots** before interacting to understand the page structure
- **Wait for elements** to appear before clicking or typing
- **Verify success** by checking for dashboard-specific elements after login
- The login redirects to `/admin` (dashboard) on success

## Common Login Flow

```
1. Navigate → 2. Snapshot → 3. Fill Form → 4. Click Submit → 5. Wait → 6. Verify
```

## Error Handling

If login fails:
- Check if the login button has the correct text or ref
- Verify the form fields are correctly identified
- Look for error messages on the page
- Take a screenshot to debug

## After Login

Once logged in, you'll be on the dashboard at `/admin` where you can:
- Navigate to clients (`/admin/clients`)
- View client details
- Create new clients
- Access other admin features

## Example Usage

"Log into the production dashboard and navigate to the clients page"
"Sign in to the Argan HR admin panel and take a screenshot"
"Access the production dashboard and verify the client count"
