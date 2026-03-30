# Plan: Implement Consistent Archive/Delete Pattern

## Overview

Implement a three-tier data lifecycle pattern across all entities:
1. **Active** - default view, normal operations
2. **Archived** - soft deleted (`archivedAt` timestamp), hidden from default views, restorable
3. **Hard Delete** - only for "oops" cases, requires confirmation, only allowed when no critical relationships exist

## Current State

**Already has soft delete (`deletedAt`):**
- Students, Families, Tutors - use `deletedAt` timestamp
- Subjects - use `active` varchar ('true'/'false') instead

**Uses hard delete:**
- Sessions - hard delete for all cases
- Invoices - hard delete for drafts only

**API filtering:**
- Students/Families/Tutors - filter `WHERE deletedAt IS NULL`
- Subjects - filter `WHERE active = 'true'`
- Sessions/Invoices - no filtering

## Implementation Plan

### Step 1: Schema Consistency - Rename `deletedAt` to `archivedAt`

**Files to modify:**
- `lib/db/schema.ts`

**Changes:**
1. Rename `deletedAt` → `archivedAt` for: users, tutors, families, students
2. Replace subjects `active` varchar field with `archivedAt` timestamp for consistency
3. Keep sessions and invoices as-is (no archive field needed)

**Migration:**
- Generate via `npx drizzle-kit generate`
- Select "rename column" for deletedAt → archivedAt

---

### Step 2: Update Archive Actions (Students, Families, Tutors, Subjects)

**Pattern for all entities:**
```typescript
export async function archiveEntity(_prevState: unknown, formData: FormData) {
  const id = parseInt(formData.get('id') as string);

  await db
    .update(entityTable)
    .set({ archivedAt: new Date() })
    .where(eq(entityTable.id, id));

  revalidatePath('/dashboard/entity');
  return { success: 'Entity archived successfully' };
}
```

**Files to modify:**
- `app/(dashboard)/dashboard/students/actions.ts` - rename `deleteStudent` → `archiveStudent`
- `app/(dashboard)/dashboard/families/actions.ts` - rename `deleteFamily` → `archiveFamily`
- `app/(dashboard)/dashboard/tutors/actions.ts` - rename `deleteTutor` → `archiveTutor`
- `app/(dashboard)/dashboard/subjects/actions.ts` - replace `active='false'` with `archivedAt`

**Cascade behavior for archive:**
- **Students**: When archived, cancel all future scheduled sessions for this student
- **Families**: When archived, cascade archive to all students, which cascels their sessions
- **Tutors**: When archived, cancel all future scheduled sessions for this tutor

---

### Step 3: Add Hard Delete Actions (Students, Families, Tutors, Subjects)

**Pattern:**
```typescript
export async function deleteEntityPermanently(_prevState: unknown, formData: FormData) {
  const id = parseInt(formData.get('id') as string);

  // Check for relationships
  const sessions = await db.select().from(sessionStudents).where(eq(sessionStudents.studentId, id));
  if (sessions.length > 0) {
    return { error: 'Cannot delete - student has session history. Archive instead.' };
  }

  // Hard delete
  await db.delete(entityTable).where(eq(entityTable.id, id));

  revalidatePath('/dashboard/entity');
  return { success: 'Entity permanently deleted' };
}
```

**Relationship checks:**
- **Students**: Check `session_students` table
- **Families**: Check if has students with sessions/invoices
- **Tutors**: Check `sessions` table
- **Subjects**: Check `sessions` table for subject references

**Files to modify:**
- `app/(dashboard)/dashboard/students/actions.ts` - add `deleteStudentPermanently`
- `app/(dashboard)/dashboard/families/actions.ts` - add `deleteFamilyPermanently`
- `app/(dashboard)/dashboard/tutors/actions.ts` - add `deleteTutorPermanently`
- `app/(dashboard)/dashboard/subjects/actions.ts` - add `deleteSubjectPermanently`

---

### Step 4: Update API Routes to Use `archivedAt`

**Files to modify:**
- `app/api/students/route.ts` - change `isNull(students.deletedAt)` → `isNull(students.archivedAt)`
- `app/api/families/route.ts` - change `isNull(families.deletedAt)` → `isNull(families.archivedAt)`
- `app/api/tutors/route.ts` - change `isNull(tutors.deletedAt)` → `isNull(tutors.archivedAt)`
- `app/api/subjects/route.ts` - change `eq(subjects.active, 'true')` → `isNull(subjects.archivedAt)`

**No changes needed:**
- Sessions API - shows all sessions (status filtering via UI)
- Invoices API - shows all invoices (status filtering via UI)

---

### Step 5: Add Confirmation Modals for Hard Deletes

**New component:** `components/delete-confirmation-dialog.tsx`

```tsx
export function DeleteConfirmationDialog({
  open,
  onOpenChange,
  entityName,
  onConfirm,
  impactMessage, // e.g., "This will cancel 3 upcoming sessions"
  isPending
}) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete {entityName}?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone.
            {impactMessage && <div className="mt-2 font-medium">{impactMessage}</div>}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} disabled={isPending}>
            Delete Permanently
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
```

**Files to modify:**
- `app/(dashboard)/dashboard/sessions/detail-view.tsx` - add confirmation for session deletes
- `app/(dashboard)/dashboard/invoices/detail-view.tsx` - add confirmation for draft invoice deletes

---

### Step 6: Update Detail Views - Two-Button Pattern

**Pattern for Students/Families/Tutors/Subjects:**

Replace single "Delete" button with:
1. **Primary destructive action**: "Archive" (always available)
2. **Secondary destructive action**: "Delete Permanently" (only if no relationships, requires confirmation)

**Component structure:**
```tsx
<DetailPanelHeader
  actions={[
    <Button onClick={handleArchive}>Archive</Button>,
    canHardDelete && (
      <DropdownMenu>
        <DropdownMenuTrigger>More</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem onClick={() => setShowDeleteConfirm(true)}>
            Delete Permanently
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    )
  ]}
/>
```

**Files to modify:**
- `app/(dashboard)/dashboard/students/detail-view.tsx`
- `app/(dashboard)/dashboard/families/detail-view.tsx`
- `app/(dashboard)/dashboard/tutors/detail-view.tsx`
- `app/(dashboard)/dashboard/subjects/detail-view.tsx`

**Pattern for Sessions/Invoices:**

Keep single "Delete" button but add confirmation dialog.

**Files to modify:**
- `app/(dashboard)/dashboard/sessions/detail-view.tsx`
- `app/(dashboard)/dashboard/invoices/detail-view.tsx`

---

### Step 7: Archive Cascade Implementation

**Students archive cascade:**

When archiving a student, cancel their future scheduled sessions:

```typescript
export async function archiveStudent(_prevState: unknown, formData: FormData) {
  const id = parseInt(formData.get('id') as string);

  // Archive student
  await db.update(students).set({ archivedAt: new Date() }).where(eq(students.id, id));

  // Find student's future scheduled sessions
  const futureSessionStudents = await db
    .select({ sessionId: sessionStudents.sessionId })
    .from(sessionStudents)
    .innerJoin(sessions, eq(sessionStudents.sessionId, sessions.id))
    .where(
      and(
        eq(sessionStudents.studentId, id),
        eq(sessions.status, 'scheduled')
      )
    );

  const sessionIds = futureSessionStudents.map(s => s.sessionId);

  if (sessionIds.length > 0) {
    await db
      .update(sessions)
      .set({ status: 'student_cancelled' })
      .where(inArray(sessions.id, sessionIds));
  }

  revalidatePath('/dashboard/students');
  return { success: `Student archived. ${sessionIds.length} upcoming sessions cancelled.` };
}
```

**Families archive cascade:**

```typescript
export async function archiveFamily(_prevState: unknown, formData: FormData) {
  const id = parseInt(formData.get('id') as string);

  // Archive family
  await db.update(families).set({ archivedAt: new Date() }).where(eq(families.id, id));

  // Get all students in family
  const familyStudents = await db
    .select({ id: students.id })
    .from(students)
    .where(eq(students.familyId, id));

  const studentIds = familyStudents.map(s => s.id);

  if (studentIds.length > 0) {
    // Archive all students
    await db
      .update(students)
      .set({ archivedAt: new Date() })
      .where(inArray(students.id, studentIds));

    // Cancel all future sessions for these students
    const futureSessionStudents = await db
      .select({ sessionId: sessionStudents.sessionId })
      .from(sessionStudents)
      .innerJoin(sessions, eq(sessionStudents.sessionId, sessions.id))
      .where(
        and(
          inArray(sessionStudents.studentId, studentIds),
          eq(sessions.status, 'scheduled')
        )
      );

    const sessionIds = [...new Set(futureSessionStudents.map(s => s.sessionId))];

    if (sessionIds.length > 0) {
      await db
        .update(sessions)
        .set({ status: 'student_cancelled' })
        .where(inArray(sessions.id, sessionIds));
    }
  }

  revalidatePath('/dashboard/families');
  return { success: `Family and ${studentIds.length} students archived. Sessions cancelled.` };
}
```

**Tutors archive cascade:**

```typescript
export async function archiveTutor(_prevState: unknown, formData: FormData) {
  const id = parseInt(formData.get('id') as string);

  // Archive tutor
  await db.update(tutors).set({ archivedAt: new Date() }).where(eq(tutors.id, id));

  // Cancel all future scheduled sessions
  const result = await db
    .update(sessions)
    .set({ status: 'tutor_cancelled' })
    .where(
      and(
        eq(sessions.tutorId, id),
        eq(sessions.status, 'scheduled')
      )
    );

  revalidatePath('/dashboard/tutors');
  return { success: `Tutor archived. Upcoming sessions cancelled.` };
}
```

**Files to modify:**
- `app/(dashboard)/dashboard/students/actions.ts` - add cascade logic to `archiveStudent`
- `app/(dashboard)/dashboard/families/actions.ts` - add cascade logic to `archiveFamily`
- `app/(dashboard)/dashboard/tutors/actions.ts` - add cascade logic to `archiveTutor`

**Import additions needed:**
- Add `inArray`, `and` from `drizzle-orm`
- Add `sessionStudents` from schema where needed

---

### Step 8: Prepare for Future Unarchive Feature

**No schema changes needed** - `archivedAt` already supports unarchive by setting to `null`.

**Future implementation notes** (not building now):
- Add `unarchiveEntity` actions that set `archivedAt = null`
- Add query param `?includeArchived=true` to API routes
- Add "Show Archived" toggle in UI
- Add "Unarchive" button in archived entity detail views

**Files to prepare (add TODO comments):**
- API routes - add comment about future `includeArchived` param
- Detail views - add comment about future unarchive action

---

## Summary of Changes

**Schema (1 file):**
- `lib/db/schema.ts` - rename deletedAt → archivedAt, replace subjects.active with archivedAt

**Actions (4 files):**
- Students, Families, Tutors, Subjects - add archive actions with cascade, add hard delete with relationship checks

**API Routes (4 files):**
- Students, Families, Tutors, Subjects - update filtering to use archivedAt

**Detail Views (6 files):**
- Students, Families, Tutors, Subjects - two-button pattern (Archive + Delete Permanently)
- Sessions, Invoices - add confirmation dialog

**New Components (1 file):**
- `components/delete-confirmation-dialog.tsx`

**Migration:**
- Generate via `npx drizzle-kit generate`
- Rename deletedAt → archivedAt for all tables
- Drop subjects.active, add subjects.archivedAt

---

## Verification

**Test Archive:**
1. Archive a student → verify future sessions cancelled
2. Archive a family → verify students archived, sessions cancelled
3. Archive a tutor → verify future sessions cancelled
4. Archive a subject → verify hidden from subject picker

**Test Hard Delete:**
1. Try to delete student with sessions → should fail with error
2. Delete student with no sessions → should succeed
3. Try to delete draft invoice → should show confirmation → succeed
4. Try to delete sent invoice → should fail

**Test API Filtering:**
1. Archive a student → verify not in GET /api/students
2. Archive a family → verify not in GET /api/families
3. Archive a tutor → verify not in GET /api/tutors
4. Archive a subject → verify not in GET /api/subjects
