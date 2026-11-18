# Firestore Security Specification

## 1. Data Invariants
1. Public institutional collections (`siteSettings`, `subjects`, `teachers`, `students`, `events`, `achievements`, `announcements`, `gallery`, `projects`, `downloads`) are publicly readable (`get` and `list`) and strictly writable ONLY by verified administrators (`isAdmin()`).
2. All document IDs in single-document operations (`get`, `create`, `update`, `delete`) must satisfy `isValidId(id)` (`^[a-zA-Z0-9_-]+$`, length `<= 128`).
3. Every string and list field has explicit `.size()` bounds to prevent resource exhaustion attacks.
4. User profiles (`/users/{userId}`) contain PII (`email`) and MUST NEVER be readable by other non-admin users (`get` restricted to `isOwner(userId) || isAdmin()`, `list` restricted to `isAdmin()`).
5. Self-registration on `/users/{userId}` enforces `role == 'student'` and `status == 'active'` and `uid == request.auth.uid`; users cannot escalate their own role or activate a deactivated account.
6. Only existing verified administrators (including bootstrapped admin `hiranyaudakara2@gmail.com` with `email_verified == true`) can manage `/admins/{userId}` or update user roles/status.
7. `/adminLogs/{logId}` is append-only for admins (`create` allowed with `adminUid == request.auth.uid` and `createdAt == request.time`; `update` and `delete` denied).
8. `/contactMessages/{messageId}` requires a verified authenticated user (`senderUid == request.auth.uid`, initial `status == 'new'`), and `list`/`get` is restricted to `isAdmin()` or `resource.data.senderUid == request.auth.uid`.
9. Every write requires `request.auth.token.email_verified == true`, and all timestamps (`createdAt`, `updatedAt`) are verified against `request.time`.

## 2. The "Dirty Dozen" Attack Payloads (Expected: PERMISSION_DENIED)
1. **Unauthenticated Write to Subjects**: Anonymous user tries `create /subjects/sft` -> DENIED (`!isSignedIn()`).
2. **Non-Admin Student Modifying SiteSettings**: Verified student tries `update /siteSettings/main` -> DENIED (`!isAdmin()`).
3. **Self-Assigned Admin Privilege Escalation**: User creates `/users/{uid}` with `role: 'admin'` -> DENIED (`incoming().role == 'student'`).
4. **Role Escalation via Update**: User updates own `/users/{uid}` changing `role` to `'admin'` -> DENIED (`affectedKeys().hasOnly(...)` & `role == existing().role`).
5. **Email Spoofing Attack**: Attacker with `email: 'hiranyaudakara2@gmail.com'` and `email_verified: false` tries to write `/subjects/hack` -> DENIED (`email_verified == true` required).
6. **PII Blanket Read**: Non-admin user calls `get /users/otherUserId` or `list /users` -> DENIED.
7. **Shadow Ghost Field Injection**: Admin or user sends `{ ...validSubject, isSuperSecret: true }` -> DENIED (`keys().hasOnly(...)`).
8. **ID Poisoning**: Attacker targets `/subjects/bad$id/../../../` or 500-char ID -> DENIED (`isValidId()`).
9. **Client Timestamp Forgery**: User submits `createdAt` in the past on `/contactMessages/{id}` -> DENIED (`createdAt == request.time`).
10. **Contact Message Identity Spoofing**: User A submits `/contactMessages/{id}` with `senderUid: 'userB'` -> DENIED (`senderUid == request.auth.uid`).
11. **Contact Message Query Scraping**: Non-admin User A calls `list /contactMessages` without filtering `senderUid == UserA` -> DENIED (`resource.data.senderUid == request.auth.uid`).
12. **Audit Log Tampering**: Admin attempts to `update` or `delete` `/adminLogs/{logId}` -> DENIED (`allow update, delete: if false;`).
