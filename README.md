# SVN review

A right-sidebar panel for reading SVN state without leaving the conversation.

## What it shows

Everything is scoped to **the workspace this conversation lives in**. Opening the
panel in a `saomiao_place` session lists only the checkouts under
`saomiao_place`; a session outside every registered workspace says so instead of
listing unrelated projects.

- **Projects** — every SVN working copy found under that workspace (up to a
  configurable depth), with its working revision. The picker spells the chain
  out — `saomiao_place/service`, `saomiao_place/static` — so two checkouts that
  share a folder name stay distinct.
- **Changed files** — the local modifications of the selected working copy, each
  row tagged with its SVN status, plus a conflict marker. A filter box narrows
  the list by path.
- **Revisions** — the most recent commits of that working copy, each with its
  author, time, message, and changed paths.

## Reading a file

Picking a changed file, or a file inside a revision, opens it as a whole file
with a line-number gutter. Two tabs sit above it:

- **File** — the complete text, one row per line, numbered. Local files are read
  from disk (as they are right now, including uncommitted edits); a file picked
  inside a revision comes from the repository at that revision.
- **Diff** — the unified diff that produced the change.

**Right-click a line number** (or focus it and press <kbd>Enter</kbd>) to see who
last changed that line: author, revision, and date. The attribution then stays
in the gutter beside every line, so the whole file reads like `svn blame`. One
lookup serves the whole file, so checking several lines costs one request.

A response that arrives after you moved on is discarded, so a slow lookup can
never replace what you are looking at.

## How to open it

Click the **SVN** control in the conversation header, or open the right
sidebar's add control (the `+` at the end of its tab strip) and pick **SVN
changes** from the guide. The panel is a normal right-sidebar tab: it docks,
floats, and is remembered per session like any other.

## Limits

- Read-only. It never runs `commit`, `update`, `revert`, `add`, or any other
  mutating SVN command.
- Requires the SVN command-line client (`svn`) on the machine running the Host.
  Set `svnPath` in the plugin configuration when it is not on `PATH`.
- Only directories under a registered DSH workspace are readable. A project
  outside every workspace is refused, and a path that escapes the selected
  working copy is refused.
- The changed-file diff comes from one whole-working-copy `svn diff`; a very
  large working copy can hit `maxOutputBytes` and report truncation.
- Files that are not under version control (`?`) have no repository diff; the
  panel explains that instead of showing an empty difference.
- A failed `svn status` is reported as a failure, never as "no local changes".
- `svn.exe` on Windows receives its arguments through the ANSI code page, so a
  non-ASCII file name cannot be passed on the command line. Such files are read
  and blamed through their percent-encoded repository URL instead; the panel
  says when line authors therefore describe the committed text rather than
  uncommitted local edits.
- Binary files are named as such rather than rendered, and a very large file is
  clipped at `maxOutputBytes` with a visible notice.

## Configuration

| Key | Default | Meaning |
|---|---|---|
| `svnPath` | `svn` | Executable name or absolute path of the SVN client. |
| `scanDepth` | `3` | Directory levels searched below each workspace root. |
| `logLimit` | `30` | Revision page size for the history view. |
| `maxOutputBytes` | `8388608` | Ceiling on any one `svn` invocation's stdout, and on one file view. |
| `timeoutMs` | `45000` | Deadline for one `svn` invocation. |
