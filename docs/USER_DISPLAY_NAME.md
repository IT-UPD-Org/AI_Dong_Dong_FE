# User display name and admin links

## Display name (breaking API change)

- User responses (`/api/users/@me`, `/api/admin/users`, login) now carry only
  `display_name`; there is no `name` field. `toUser` (`src/api/auth.api.ts`) reads
  `display_name` and, only for a rolling deploy, falls back to a legacy `name`,
  then to the email prefix.
- The frontend `User` type exposes `display_name` only. Every place that shows a
  person's name (sidebar, header, profile, admin lists, Sentry user) uses it.
- Editing: `PATCH /api/users/@me` and `PATCH /api/admin/users/{id}` take
  `display_name: string | null`. A blank value is sent as `null` and clears the
  custom name; the backend decides what is then shown. `name` is never sent.
- Login/account-creation inputs still use `name`; that is identity setup, not the
  display editor.
- An admin editing their own display name updates the signed-in account too.

## Admin cross-links

- `GET /api/admin/users?p=&user_id=` returns 0 or 1 user (exact match), so a user
  who is not on the current page can still be opened.
- `GET /api/admin/chats?p=&user_id=` filters chats by owner. Each chat has
  `user_name` (`null` when the user was deleted).
- URLs: `/admin?tab=users&user_id=<id>` opens that user's details;
  `/admin?tab=chats&user_id=<id>` shows only that user's chats (clear the chip to
  reset to everyone, page 1). Build them with `adminTabUrl` in
  `src/pages/admin/shared.tsx`.