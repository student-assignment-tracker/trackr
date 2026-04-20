# Supabase Integration Guide

This document is for whoever is wiring Supabase. The frontend was built so the integration should be almost entirely in **one file: `src/lib/api.js`**.

Everything in the app reads and writes data through the functions exported from that file. If you keep the function signatures identical, the UI won't need any changes.

## Step 1: Install the client

```bash
npm install @supabase/supabase-js
```

## Step 2: Create the Supabase project

1. Go to [supabase.com](https://supabase.com) and create a new project.
2. Once it's provisioned, go to **Project Settings → API** and copy:
   - The **Project URL**
   - The **anon / public key** (this is safe to ship to the frontend)

## Step 3: Create the tables

In the Supabase SQL editor, run this. It creates every table the app needs, with foreign keys and the delete-cascade rules the UI already expects. It also enables row-level security so each user only sees their own data.

```sql
-- users are handled by Supabase Auth automatically (auth.users)

create table semesters (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  name text not null,
  start_date date,
  end_date date,
  created_at timestamptz default now()
);

create table classes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  semester_id uuid references semesters on delete set null,
  name text not null,
  code text,
  color text,
  start_date date,
  end_date date,
  meeting_days int[] default '{}',
  meeting_start_time time,
  meeting_end_time time,
  categories jsonb default '[]',   -- array of {id, name, weight}
  created_at timestamptz default now()
);

create table assignments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  class_id uuid not null references classes on delete cascade,
  category_id text,                 -- matches the id field inside classes.categories
  title text not null,
  due_date date not null,
  due_time time not null,
  done boolean default false,
  score numeric,                    -- 0-100, null = ungraded
  description text,
  created_at timestamptz default now()
);

create table notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  class_id uuid references classes on delete set null,
  title text not null,
  date date not null,
  body text,
  color text,
  created_at timestamptz default now()
);

create table reminders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  class_id uuid references classes on delete set null,
  title text not null,
  date date not null,
  start_time time not null,
  end_time time,
  body text,
  color text,
  created_at timestamptz default now()
);

-- Row-level security: every user only sees their own rows
alter table semesters enable row level security;
alter table classes enable row level security;
alter table assignments enable row level security;
alter table notes enable row level security;
alter table reminders enable row level security;

-- Policies (repeat this pattern for each table)
create policy "own rows" on semesters for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own rows" on classes for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own rows" on assignments for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own rows" on notes for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own rows" on reminders for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
```

## Step 4: Add environment variables

Create `.env.local` in the project root (it's already in `.gitignore`):

```
VITE_SUPABASE_URL=https://<your-project>.supabase.co
VITE_SUPABASE_ANON_KEY=<your-anon-key>
```

## Step 5: Create the Supabase client

New file `src/lib/supabaseClient.js`:

```js
import { createClient } from "@supabase/supabase-js";

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
);
```

## Step 6: Rewrite `src/lib/api.js`

Each exported function's body becomes a Supabase call. The comments above every function in the current `api.js` show the exact call to make. Example transformation for one function:

**Before (current placeholder):**
```js
export async function getAssignments() {
  await tick();
  return [...store.assignments];
}
```

**After (wired to Supabase):**
```js
export async function getAssignments() {
  const { data, error } = await supabase
    .from("assignments")
    .select("*")
    .order("due_date");
  if (error) throw error;
  return data.map(mapAssignmentFromDb);
}
```

**Column naming:** Postgres convention is `snake_case`; the frontend uses `camelCase`. Add small mapping helpers:

```js
function mapAssignmentFromDb(row) {
  return {
    id: row.id,
    title: row.title,
    classId: row.class_id,
    categoryId: row.category_id,
    dueDate: row.due_date,
    dueTime: row.due_time,
    done: row.done,
    score: row.score,
    description: row.description,
    createdAt: row.created_at,
  };
}

function mapAssignmentToDb(payload) {
  return {
    title: payload.title,
    class_id: payload.classId,
    category_id: payload.categoryId,
    due_date: payload.dueDate,
    due_time: payload.dueTime,
    done: payload.done,
    score: payload.score,
    description: payload.description,
  };
}
```

Do the same pattern for Class / Note / Reminder / Semester.

## Step 7: Clean up

Once everything works:

- Delete the `store` object at the top of `api.js`
- Delete the `uid()` and `tick()` helpers
- Delete the "TEMPORARY" comment block

The frontend will keep working because the function signatures are unchanged.

## Authentication (next step beyond this document)

The app currently assumes a logged-in user. To add auth:

1. Wrap `<App/>` in a gate that shows Supabase's auth UI (or a custom login form) if `supabase.auth.getUser()` returns null.
2. Each `api.*` function implicitly gets the user via RLS — no need to pass `user_id` from the frontend; the RLS policies above enforce it automatically when you insert rows (set a trigger or default so `user_id = auth.uid()` on insert).

## Testing checklist

After wiring Supabase, verify:

- [ ] Classes, semesters, assignments, notes, reminders all create, edit, delete, and persist across refresh
- [ ] Weight categories on a class save and load correctly (stored as JSON in `categories`)
- [ ] Deleting a class also removes its assignments (CASCADE works)
- [ ] Deleting a semester detaches its classes but keeps them (SET NULL works)
- [ ] Two different logged-in users can't see each other's data (RLS works)
- [ ] Running grade on the Classes tab updates when you add/edit a score

If any of those fail, the issue is almost certainly in `api.js` or in your RLS policies, not in the UI.
