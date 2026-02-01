# Resource Scheduling Calendar - Debugging Notes & Lessons Learned

This document captures the toughest quirks encountered while building this project, along with conclusions to help future developers avoid the same pitfalls.

---

## 1. Timezone Handling with Airtable Data

### The Problem
Events synced from Airtable were not appearing on the calendar, even though the API returned data correctly.

### Root Cause
Airtable returns datetime fields with a `Z` suffix (e.g., `2026-02-01T10:30:00.000Z`), indicating UTC time. When JavaScript parses this, it converts to UTC, causing:
- An event entered as "10:30 AM" in Airtable to display as "2:30 AM" in Pacific time
- Events falling outside the calendar's 8 AM - 7 PM display range

### Solution
**Backend (during sync):** Strip the `Z` suffix when storing times so they're treated as "wall clock" times:
```typescript
const parseAsLocalTime = (isoString: string) => {
  const localString = isoString.replace('Z', '');
  return new Date(localString);
};
```

**Frontend (during display):** Also strip `Z` when parsing timestamps from the API:
```typescript
const parseLocalTime = (timestamp: string | Date): Date => {
  if (timestamp instanceof Date) return timestamp;
  return new Date(timestamp.replace('Z', ''));
};
```

### Warning
If you're working with a different timezone strategy (e.g., storing everything in UTC and converting on display), you'll need to adjust this approach. The current implementation assumes all times should be displayed as entered.

---

## 2. Schema Field Naming: `panelId` vs `resourceId`

### The Problem
Events were not displaying in the calendar grid even though both panels and events were being fetched.

### Root Cause
The database schema used `panelId` as the foreign key, but the frontend code was still referencing `resourceId` from an earlier design.

### Solution
Updated `CalendarGrid.tsx` to use `event.panelId` instead of `event.resourceId` in all filter functions.

### Warning
When renaming schema fields, search the entire codebase for the old field name. Use grep:
```bash
grep -r "resourceId" client/src/
```

---

## 3. Database Driver: WebSocket vs HTTP Mode

### The Problem
Database connections failed in the Replit environment with WebSocket-related errors.

### Root Cause
The Neon serverless driver's WebSocket mode (`@neondatabase/serverless`) doesn't work reliably in all environments.

### Solution
Switched to HTTP mode using `neon-http`:
```typescript
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";

const sql = neon(process.env.DATABASE_URL!);
export const db = drizzle(sql);
```

### Warning
If you see WebSocket connection errors, switch to HTTP mode. It's slightly slower but more reliable.

---

## 4. Filter Buttons Mismatched with Data

### The Problem
Clicking type filter buttons (Doctor, Room, Technician) showed no panels.

### Root Cause
The filter buttons were hardcoded with placeholder types that didn't match the actual data types in the database (Autograph, Exclusive, Panel, Cart, Media).

### Solution
Updated `CalendarToolbar.tsx` to use the actual type values from the data.

### Warning
After seeding or syncing data, always verify:
```sql
SELECT DISTINCT type FROM panels ORDER BY type;
```
Then ensure filter buttons match these values.

---

## 5. Environment Variables Lost on Restart

### The Problem
Airtable sync endpoint returned "credentials not configured" after workflow restarts.

### Root Cause
Environment variables set programmatically sometimes don't persist across workflow restarts.

### Solution
Re-set the environment variable and restart the workflow:
```typescript
AIRTABLE_BASE_ID: "your-base-id"
```

### Warning
Always verify env vars are set after restarts:
```bash
echo $AIRTABLE_BASE_ID
```

---

## 6. Port Conflicts on Restart

### The Problem
Workflow failed with `EADDRINUSE: address already in use 0.0.0.0:5000`.

### Root Cause
Previous server process didn't shut down cleanly before the new one started.

### Solution
Simply restart the workflow again. The Replit environment usually cleans up orphaned processes.

---

## 7. Airtable Linked Records

### The Problem
Events were being skipped during sync with "no valid panel link" warnings.

### Root Cause
Airtable's "Link to another record" fields return an array of record IDs, not a single string.

### Solution
Extract the first element from the array:
```typescript
const panelLink = record.get("Panel") as string[];
const airtablePanelId = panelLink && panelLink[0] ? panelLink[0] : null;
```

### Warning
Always check if Airtable fields return arrays (linked records, multiple select) vs single values.

---

## 8. Missing Start/End Times in Airtable

### The Problem
Some events were skipped with "missing start/end time" warnings.

### Root Cause
Some Airtable records had empty datetime fields.

### Solution
Added validation and skip logic:
```typescript
if (!startTime || !endTime) {
  console.warn(`Skipping event "${event.title}" - missing start/end time`);
  continue;
}
```

### Warning
Validate your Airtable data before syncing. Consider adding a view filter in Airtable to only show complete records.

---

## Architecture Decisions

### Why sync to PostgreSQL instead of direct Airtable API?
1. **Rate limits:** Airtable has API rate limits (5 requests/second)
2. **Performance:** Local DB queries are faster than API calls
3. **Reliability:** App works even if Airtable is temporarily unavailable

### Data Flow
```
Airtable → POST /api/sync/airtable → PostgreSQL → GET /api/events → Frontend
```

### Type Mapping
| Airtable Field | PostgreSQL Column | Notes |
|----------------|-------------------|-------|
| Name | name (text) | Required |
| Type | type (text) | Used for filtering |
| Color | color (text) | Hex code |
| Panel (link) | panelId (varchar) | Foreign key to panels |
| Start Time | startTime (timestamp) | Parsed as local time |
| End Time | endTime (timestamp) | Parsed as local time |
| Category | category (text) | For color coding |

---

## Quick Debugging Checklist

When events don't appear:
1. Check the date picker - are you viewing the right date?
2. Check the filter - is "All" selected?
3. Check the API response: `curl /api/events?date=YYYY-MM-DD`
4. Check timezone parsing - are times being converted unexpectedly?
5. Check panelId matching - do event panelIds match panel ids?

When sync fails:
1. Verify AIRTABLE_API_TOKEN secret exists
2. Verify AIRTABLE_BASE_ID env var is set
3. Check Airtable table names match exactly ("Panels", "Events")
4. Check Airtable field names match the code
5. Look for "Skipping event" warnings in logs
