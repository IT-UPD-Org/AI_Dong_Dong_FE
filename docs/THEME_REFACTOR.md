# Global Theme System — implementation and verification report

## Architecture

The frontend remains React 19 + Vite + Tailwind CSS 4. It uses the existing
`next-themes` provider; no additional theme library or per-page theme state was
introduced. Routing, authentication handlers and API contracts are unchanged.

- `src/index.css` is the single source of semantic color tokens. `:root` defines
  Light; `.dark` defines Dark. Tailwind utilities map onto those variables.
- One `ThemeToggle` is reused by the public navbar and application navbar. The
  application reuses its existing header at all viewport widths; its duplicate
  sidebar toggle was removed. Settings uses `ThemeModeSelector` for
  Light / Dark / System on the same provider state.
- Preferences persist in localStorage under `itupd-theme`. A pre-paint script
  migrates the previous `theme` key, resolves the system preference and applies
  the class before React starts. A tiny initial palette prevents a white flash
  before the main stylesheet arrives.
- Navbar icons reflect `resolvedTheme`, not just the stored `system` preference.
  Accessible action labels and tooltips are Vietnamese. Color transitions are
  brief and honor reduced-motion preferences.
- Geist fonts are imported through Vite in `src/main.tsx` so their WOFF2 assets
  are bundled correctly, including Vietnamese coverage.

## Dark palette

| Semantic role | Value |
|---|---|
| Main background | `#121212` |
| Secondary surface | `#181818` |
| Card | `#1E1E1E` |
| Elevated / popover | `#242424` |
| Input | `#1A1A1A` |
| Primary text | `#F5F5F5` |
| Secondary text | `#BDBDBD` |
| Muted text | `#909090` |
| Primary border | `#333333` |
| Subtle border | `#292929` |
| Disabled text | `#666666` |

Brand identity remains ITUPD green (`#04714a`, `#00a86b`). Readable brand text
uses the existing lighter green in Dark. White-on-green primary buttons retain
a sufficiently dark hover tone. Code samples keep an intentional dark reading
surface in both modes, through dedicated `--code-*` tokens. The public footer
also has explicit `--footer-*` tokens for its intentionally dark brand treatment
in Light. Status colors retain their meaning with contrast-adjusted theme pairs.

## Audit findings and corrections

- Public navbar controls were hidden behind an undefined `xs` breakpoint. The
  theme button is now visible without opening a menu, including while logged out.
- Theme controls previously used the stored mode rather than the resolved mode,
  and one conditional hook path was unsafe. The shared implementation fixes both.
- Auth, approval and admin pages had many hard-coded light colors and no dark
  variants. Chat and application pages used several competing gray palettes.
  These now use semantic surface, text, border, input and interaction tokens.
- Global unlayered link-hover and focus styles could override component
  utilities. Defaults now live in the CSS base layer; there is no global
  brand-colored `a:hover` override to create green-on-green button labels.
- Input, select, textarea, checkbox, switch, tabs, table, dialog, dropdown and
  popover state colors were audited. Visible controls now derive colors from
  tokens rather than a white/black patchwork.
- No application body typography text stroke or text-shadow source was found.
  Rendered checks found no text strokes/shadows in the inspected states.
  Intentional hero illustration decoration, SVG artwork and the loader sweep
  were retained, rather than removing decorative effects indiscriminately.
- Browser inspection found low contrast in an account initial, PDF badge,
  knowledge indices, a profile action and landing labels. Their foreground /
  background token pairings were corrected. The decorative brand logo dot is
  intentionally kept at its identity color.
- The About heading was bounded for narrow screens. A hero annotation was also
  contained to avoid horizontal overflow around the tablet/desktop breakpoint.
- The old unresolved Geist font URLs were corrected by importing the package
  from the Vite entrypoint, not through Tailwind's CSS import inlining.

## Components and pages migrated

- Foundation: global CSS, pre-paint HTML, ThemeProvider, ThemeToggle,
  ThemeModeSelector, font entrypoint.
- Public layouts: navbar, account dropdown, footer, landing hero / feature
  sections / illustrations, homepage loader and its preview.
- Public pages: Landing, Login, Register, authentication callbacks, account
  creation, approval, About, Contributors, Project Team.
- Main app: shared navbar/sidebar/account menu, Chat, History, Documents,
  Knowledge, Profile, Settings and document-processing notifications.
- Chat: composer and mention menu, Markdown/table/quote/code rendering,
  file cards/previews, upload popover, feedback panel, effort modal, tool lists,
  scroll controls and issue image picker.
- Admin: users, requests, files, chats, models, providers; shared form and paging
  styles; table and modal surfaces.
- Shared primitives: buttons, dialog/alert-dialog/sheet/drawer overlays, table,
  input/textarea/select/checkbox/radio/switch/slider/tabs, command and input groups.
  Other existing token-based primitives were reviewed without unnecessary edits.

## Verification

### Automated

- `corepack pnpm build`: exit 0 (TypeScript + production Vite build).
- `corepack pnpm test`: exit 0, **6 files / 85 tests passed**.
- Added `src/__tests__/Theme.test.tsx`: 5 checks for resolved Light/Dark/System
  behavior, shared selector and provider configuration.
- Separate pre-paint execution check: explicit Light, explicit Dark, System,
  default preference and legacy-key migration all passed.
- Repository scan of application TSX/CSS (excluding token definitions and tests)
  found no `text-black`, `bg-white`, `border-white`, `border-black`, `text-gray-N`,
  `bg-gray-N`, `text-stroke` or `text-shadow` matches after migration.
- `git diff --check`: passed. Generated production assets are included because
  this repository tracks `dist/`.

### Browser checks

Local frontend rendering was inspected with browser accessibility snapshots and
computed styles. Initial responsive checks used isolated local API fixtures at
320 / 768 / 1000 px. The account supplied by the user was then used to log in
against the real API over **HTTPS** via a temporary localhost verification proxy.
The proxy and credentials are not part of the repository or build.

Both Light and Dark were exercised for:

- `/`, `/login`, `/register`, `/admin/create`, `/approve`, `/about`,
  `/contributors`, `/donate`, `/callback`, `/auth/callback`.
- `/chat`, an existing `/c/:id`, `/history`, `/knowledge`, `/documents`,
  `/profile`, `/settings`.
- `/admin` tabs: users, requests, files, chats, models, providers.
- Representative populated Markdown/table/file-card content and empty states;
  account dropdown; add-model dialog; chat feedback, effort and upload panels.

Real API read checks returned HTTP 200 for current user, conversations, files,
admin users, models and providers. No messages were sent and no account,
file, model or provider data was edited. Logout revoked the temporary session
and cleared the local token while keeping the theme preference.

Persistence was confirmed across route changes, full reload and logout. Computed
dark modal/input/border colors matched `#242424` / `#1A1A1A` / `#333333`.

## Known limitations / remaining issues

- Browser screenshots were unavailable because the connected desktop window was
  not visible; verification used rendered DOM, accessibility and computed style
  evidence rather than a screenshot-based visual sign-off. This is not a claim
  that every possible live-content, hover/focus, PDF or streaming state has been
  visually reviewed.
- Unused shared UI primitives were code-audited; not every primitive has a route
  on which it can be exercised live.
- An existing chat-title API request returns 404. This is outside the theme
  scope; no API/backend changes were made.
- Vite still reports the existing large JavaScript chunk advisory. Font asset
  resolution warnings have been removed; all five Geist WOFF2 assets are emitted.
- No assertion of production deployment is made by this report. The commit
  includes a build suitable for the repository's existing deployment pipeline.

## Changed source files

The following appendix lists the source and document files in this refactor;
generated `dist/` assets and `tsconfig.tsbuildinfo` are not individually listed.

- `index.html`
- `src/components/auth/TemporaryLogin.tsx`
- `src/components/chat/AgentEffortModal.tsx`
- `src/components/chat/ChatComposer.tsx`
- `src/components/chat/CodeBlock.tsx`
- `src/components/chat/ConversationScrollbar.tsx`
- `src/components/chat/DocumentUploadPopup.tsx`
- `src/components/chat/FileCard.tsx`
- `src/components/chat/FilePreviewPanel.tsx`
- `src/components/chat/IssueImagePicker.tsx`
- `src/components/chat/MessageBubble.tsx`
- `src/components/chat/MessageFeedbackPanel.tsx`
- `src/components/chat/ModifiedPromptInput.tsx`
- `src/components/chat/SafeMarkdown.tsx`
- `src/components/chat/ScrollToLatestButton.tsx`
- `src/components/chat/ToolCallList.tsx`
- `src/components/landing/AiSphereIllustration.tsx`
- `src/components/landing/ChatShowcaseSection.tsx`
- `src/components/landing/HeroIntro.tsx`
- `src/components/landing/InteractiveIllustration.css`
- `src/components/landing/KnowledgeRepositoryIllustration.tsx`
- `src/components/landing/ProductDemoVideo.tsx`
- `src/components/layout/AppShell.tsx`
- `src/components/layout/DocumentProcessingNotifications.tsx`
- `src/components/layout/LandingFooter.tsx`
- `src/components/layout/PageLoader.css`
- `src/components/layout/PageLoaderPreview.tsx`
- `src/components/layout/PresentLPDongDong.tsx`
- `src/components/layout/PublicLayout.tsx`
- `src/components/theme/ThemeProvider.tsx`
- `src/components/theme/ThemeToggle.tsx`
- `src/components/ui/alert-dialog.tsx`
- `src/components/ui/button.tsx`
- `src/components/ui/checkbox.tsx`
- `src/components/ui/command.tsx`
- `src/components/ui/dialog.tsx`
- `src/components/ui/drawer.tsx`
- `src/components/ui/input-group.tsx`
- `src/components/ui/input-otp.tsx`
- `src/components/ui/input.tsx`
- `src/components/ui/radio-group.tsx`
- `src/components/ui/select.tsx`
- `src/components/ui/sheet.tsx`
- `src/components/ui/slider.tsx`
- `src/components/ui/switch.tsx`
- `src/components/ui/table.tsx`
- `src/components/ui/tabs.tsx`
- `src/components/ui/textarea.tsx`
- `src/index.css`
- `src/main.tsx`
- `src/pages/ApprovePage.tsx`
- `src/pages/AuthVerifyPage.tsx`
- `src/pages/ChatPage.tsx`
- `src/pages/ContributorsPage.tsx`
- `src/pages/CreateAccountPage.tsx`
- `src/pages/DocumentsPage.tsx`
- `src/pages/HistoryPage.tsx`
- `src/pages/InfoPage.tsx`
- `src/pages/KnowledgePage.tsx`
- `src/pages/LandingPage.tsx`
- `src/pages/LoginPage.tsx`
- `src/pages/ProfilePage.tsx`
- `src/pages/ProjectTeamPage.css`
- `src/pages/RegisterPage.tsx`
- `src/pages/SettingsPage.tsx`
- `src/pages/admin/AdminPage.tsx`
- `src/pages/admin/ChatsTab.tsx`
- `src/pages/admin/FilesTab.tsx`
- `src/pages/admin/ModelsTab.tsx`
- `src/pages/admin/ProvidersTab.tsx`
- `src/pages/admin/RequestsTab.tsx`
- `src/pages/admin/UsersTab.tsx`
- `src/pages/admin/shared.tsx`
- `src/__tests__/Theme.test.tsx`
- `docs/THEME_REFACTOR.md`
