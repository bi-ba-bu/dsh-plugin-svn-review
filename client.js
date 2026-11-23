window.__ModuleLoader__.load({
  id: '@local/dsh-plugin-svn-review',
  factory(require) {
    const React = require('react')
    const h = React.createElement
    const { useState, useEffect, useCallback, useRef } = React

    /** Copy namespace and this tab type's identity. */
    const NS = 'svnReview'
    const ID = '@local/dsh-plugin-svn-review'

    const zh = {
      title: 'SVN 改动',
      description: '按工作区查看 SVN 提交记录、本地改动与逐行提交人',
      tab: 'SVN',
      alreadyOpen: 'SVN 面板已打开',
      projects: '项目',
      changes: '改动文件',
      history: '提交记录',
      refresh: '刷新',
      filter: '筛选路径',
      noMatch: '没有匹配的路径。',
      noProjects: '当前工作区下没有发现 SVN 工作副本。',
      noWorkspace: '这个会话的目录不在任何已注册的工作区内，因此没有可查看的 SVN 项目。',
      noSession: '面板没有拿到会话标识，无法确定属于哪个工作区。请关掉这个标签页，再从会话标题栏的 SVN 按钮重新打开。',
      workspace: '工作区',
      noChanges: '这个项目没有本地改动。',
      noHistory: '没有取到提交记录。',
      loading: '正在读取…',
      failed: '读取失败',
      back: '返回列表',
      diff: '改动内容',
      noDiff: '这个文件没有可显示的文本差异（可能是二进制文件或仅属性变更）。',
      fileCount: '{count} 个文件',
      revisionCount: '最近 {count} 个版本',
      truncation: '输出过大，已截断。',
      unversioned: '未纳入版本控制',
      unversionedHint: '该文件尚未 svn add，没有版本库差异。',
      missing: '已丢失',
      ignored: '已忽略',
      conflicted: '冲突',
      obstructed: '被占用',
      external: '外部',
      retry: '重试',
      conflict: '存在冲突',
      emptyMessage: '无提交说明',
      actionM: '修改',
      actionA: '新增',
      actionD: '删除',
      actionR: '替换',
      // Whole-file viewer.
      fileTab: '文件内容',
      diffTab: '改动内容',
      readingFile: '正在读取文件…',
      binaryFile: '这是二进制文件，无法按行显示。',
      emptyFile: '文件为空。',
      shownLines: '{count} 行',
      atRevision: 'r{rev} 的版本',
      localVersion: '工作副本当前版本',
      lineAuthor: '第 {line} 行提交人',
      lineAuthorHint: '右键行号可查看该行提交人',
      blameLoading: '正在查询逐行归属…',
      blameFailed: '逐行归属查询失败',
      blameRepository: '该文件名含非 ASCII 字符，逐行归属取自版本库 r{rev}，不含本地未提交的改动。',
      blameMismatch: '文件有本地改动，行归属按 r{rev} 计算，可能与当前内容的行号不完全对应。',
      close: '关闭',
      closeLineAuthor: '关闭提交人信息',
      legendNewer: '较新',
      legendOlder: '较旧',
      menuBlame: '查看这行提交人',
      author: '提交人',
      revision: '版本',
      date: '时间',
      unknownAuthor: '未知',
      // Revision drill-down from a line's author.
      openRevisionHint: '查看 r{rev} 这次提交改动的文件',
      revisionLoading: '正在读取提交信息…',
      revisionFailed: '提交信息读取失败',
      revisionMissing: '这个工作副本里没有 r{rev} 的提交信息（可能已被删除，或当前账号没有权限）。',
      revisionNoFiles: '这次提交没有记录改动路径。',
      backToRevision: '返回该次提交',
      backToFile: '返回文件内容',
      revisionFiles: '改动的文件',
      outsideCopy: '不在当前工作副本内',
      outsideCopyHint: '这个路径属于分支复制之前的历史（或被移动走了），在当前工作副本里打不开。',
      encodedAs: '编码 {encoding}',
      notInRevision: '这个文件在 r{rev} 时还不存在（或已被删除），因此没有该版本的内容。',
    }

    const en = {
      title: 'SVN changes',
      description: 'Review SVN revisions, local changes, and per-line authors per workspace',
      tab: 'SVN',
      alreadyOpen: 'The SVN panel is already open',
      projects: 'Project',
      changes: 'Changed files',
      history: 'Revisions',
      refresh: 'Refresh',
      filter: 'Filter paths',
      noMatch: 'No path matches the filter.',
      noProjects: 'No SVN working copy was found under this workspace.',
      noWorkspace: 'This session is not inside a registered workspace, so there is no SVN project to show.',
      noSession: 'The panel was given no session id, so it cannot tell which workspace it belongs to. Close this tab and reopen it from the SVN button in the session header.',
      workspace: 'Workspace',
      noChanges: 'This project has no local modifications.',
      noHistory: 'No revisions were returned.',
      loading: 'Loading…',
      failed: 'Request failed',
      back: 'Back to list',
      diff: 'Diff',
      noDiff: 'No text difference for this file (binary, or property-only change).',
      fileCount: '{count} files',
      revisionCount: 'last {count} revisions',
      truncation: 'Output was truncated.',
      unversioned: 'Unversioned',
      unversionedHint: 'This file is not under version control yet, so it has no repository diff.',
      missing: 'Missing',
      ignored: 'Ignored',
      conflicted: 'Conflicted',
      obstructed: 'Obstructed',
      external: 'External',
      retry: 'Retry',
      conflict: 'Conflict',
      emptyMessage: 'No commit message',
      actionM: 'modified',
      actionA: 'added',
      actionD: 'deleted',
      actionR: 'replaced',
      // Whole-file viewer.
      fileTab: 'File',
      diffTab: 'Diff',
      readingFile: 'Reading the file…',
      binaryFile: 'This is a binary file and cannot be shown line by line.',
      emptyFile: 'The file is empty.',
      shownLines: '{count} lines',
      atRevision: 'as of r{rev}',
      localVersion: 'as it is on disk',
      lineAuthor: 'Author of line {line}',
      lineAuthorHint: 'Right-click a line number to see who last changed that line',
      blameLoading: 'Looking up line authors…',
      blameFailed: 'Line-author lookup failed',
      blameRepository: 'This name is not ASCII, so line authors come from repository r{rev} and exclude uncommitted local edits.',
      blameMismatch: 'The file has local edits, so line authors are computed at r{rev} and may not line up with what is on screen.',
      close: 'Close',
      closeLineAuthor: 'Close the author details',
      legendNewer: 'newer',
      legendOlder: 'older',
      menuBlame: 'See who changed this line',
      author: 'Author',
      revision: 'Revision',
      date: 'Date',
      unknownAuthor: 'unknown',
      // Revision drill-down from a line's author.
      openRevisionHint: 'See the files changed by r{rev}',
      revisionLoading: 'Loading the revision…',
      revisionFailed: 'Revision lookup failed',
      revisionMissing: 'This working copy has no information for r{rev} (deleted, or not readable with the current credentials).',
      revisionNoFiles: 'This revision records no changed paths.',
      backToRevision: 'Back to this revision',
      backToFile: 'Back to the file',
      revisionFiles: 'Changed files',
      outsideCopy: 'outside this working copy',
      outsideCopyHint: 'This path belongs to history from before the branch was copied (or was moved away), so it cannot be opened here.',
      encodedAs: 'encoding {encoding}',
      notInRevision: 'This file does not exist at r{rev} (not born yet, or already deleted), so there is no content for that revision.',
    }

    /** Document-relative route base: the page owns the mount point. */
    const route = (name, params) => {
      const search = new URLSearchParams()
      for (const [key, value] of Object.entries(params ?? {})) {
        if (value === undefined || value === null || value === '') continue
        search.set(key, String(value))
      }
      const query = search.toString()
      return `svn-review/${name}${query === '' ? '' : `?${query}`}`
    }

    /** Fetch one route as JSON; non-OK responses become a thrown error. */
    const get = async (name, params, signal) => {
      const response = await fetch(route(name, params), { signal, headers: { accept: 'application/json' } })
      if (!response.ok) throw new Error(`HTTP ${String(response.status)}`)
      return await response.json()
    }

    const css = `
.dsh-svnrev-root { display: flex; flex-direction: column; gap: 10px; padding: 12px; font-size: var(--dsw-font-xs-12, 12px); color: var(--dsw-alias-label-primary); height: 100%; box-sizing: border-box; overflow: auto; }
.dsh-svnrev-bar { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
.dsh-svnrev-btn { font: inherit; cursor: pointer; padding: 3px 8px; border-radius: 6px; border: 1px solid var(--dsw-alias-border-l1); background: transparent; color: var(--dsw-alias-label-primary); }
.dsh-svnrev-btn:hover { background: var(--dsw-alias-bg-layer-2); }
.dsh-svnrev-btn[aria-pressed="true"] { border-color: var(--dsw-alias-brand-primary); color: var(--dsw-alias-brand-primary); }
.dsh-svnrev-btn:disabled { opacity: .5; cursor: default; }
.dsh-svnrev-btn:focus-visible, .dsh-svnrev-select:focus-visible, .dsh-svnrev-row:focus-visible, .dsh-svnrev-diff:focus-visible, .dsh-svnrev-code:focus-visible { outline: 2px solid var(--dsw-alias-brand-primary); outline-offset: 1px; }
.dsh-svnrev-select { font: inherit; padding: 3px 6px; border-radius: 6px; border: 1px solid var(--dsw-alias-border-l1); background: var(--dsw-alias-bg-layer-1); color: var(--dsw-alias-label-primary); max-width: 100%; }
.dsh-svnrev-filter { font: inherit; padding: 3px 8px; border-radius: 6px; border: 1px solid var(--dsw-alias-border-l1); background: var(--dsw-alias-bg-layer-1); color: var(--dsw-alias-label-primary); flex: 1 1 120px; min-width: 0; }
.dsh-svnrev-muted { color: var(--dsw-alias-label-secondary); }
.dsh-svnrev-err { color: var(--dsw-alias-state-error-primary); }
.dsh-svnrev-list { display: flex; flex-direction: column; gap: 2px; }
.dsh-svnrev-row { display: flex; align-items: baseline; gap: 6px; padding: 4px 6px; border-radius: 6px; cursor: pointer; text-align: left; border: 1px solid transparent; background: transparent; color: inherit; font: inherit; width: 100%; }
.dsh-svnrev-row:hover { background: var(--dsw-alias-bg-layer-2); }
.dsh-svnrev-row[aria-current="true"] { background: var(--dsw-alias-bg-layer-2); border-color: var(--dsw-alias-border-l2); }
.dsh-svnrev-row:disabled { cursor: default; opacity: .65; }
.dsh-svnrev-row:disabled:hover { background: transparent; }
.dsh-svnrev-path { flex: 1 1 auto; min-width: 0; overflow-wrap: anywhere; }
.dsh-svnrev-tag { flex: 0 0 auto; font-size: var(--dsw-font-xxs-11, 11px); padding: 1px 5px; border-radius: 999px; border: 1px solid var(--dsw-alias-border-l1); color: var(--dsw-alias-label-secondary); }
.dsh-svnrev-tag-m { color: var(--dsw-alias-state-warn-primary); }
.dsh-svnrev-tag-a { color: var(--dsw-alias-state-success-primary); }
.dsh-svnrev-tag-d { color: var(--dsw-alias-state-error-primary); }
.dsh-svnrev-tag-u { color: var(--dsw-alias-state-idle-primary); }
.dsh-svnrev-rev { display: flex; flex-direction: column; gap: 2px; padding: 6px; border-radius: 6px; border: 1px solid var(--dsw-alias-border-l1); }
.dsh-svnrev-rev-head { display: flex; gap: 6px; align-items: baseline; flex-wrap: wrap; }
.dsh-svnrev-rev-num { font-weight: 600; color: var(--dsw-alias-brand-primary); }
.dsh-svnrev-msg { white-space: pre-wrap; overflow-wrap: anywhere; }
.dsh-svnrev-diff { font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; font-size: var(--dsw-font-xxs-11, 11px); line-height: 1.5; border: 1px solid var(--dsw-alias-border-l1); border-radius: 6px; background: var(--dsw-alias-bg-layer-1); overflow: auto; margin: 0; padding: 6px 0; max-height: 60vh; }
.dsh-svnrev-diff-body { display: block; }
.dsh-svnrev-line { display: block; padding: 0 8px; white-space: pre; }
.dsh-svnrev-add { color: var(--dsw-alias-state-success-primary); }
.dsh-svnrev-del { color: var(--dsw-alias-state-error-primary); }
.dsh-svnrev-hunk { color: var(--dsw-alias-label-secondary); }
.dsh-svnrev-meta { color: var(--dsw-alias-label-secondary); }
.dsh-svnrev-title { display: inline-flex; align-items: center; gap: 4px; }
.dsh-svnrev-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--dsw-alias-brand-primary); display: inline-block; }
.dsh-svnrev-open { display: inline-flex; align-items: center; gap: 5px; }
.dsh-svnrev-open[aria-pressed="true"] { border-color: var(--dsw-alias-brand-primary); color: var(--dsw-alias-brand-primary); }

/* Whole-file viewer with a sticky line-number gutter. */
.dsh-svnrev-code { font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; font-size: var(--dsw-font-xxs-11, 11px); line-height: 1.55; border: 1px solid var(--dsw-alias-border-l1); border-radius: 6px; background: var(--dsw-alias-bg-layer-1); overflow: auto; max-height: 62vh; }
.dsh-svnrev-codeline { display: flex; align-items: flex-start; min-width: max-content; }
.dsh-svnrev-codeline:hover { background: var(--dsw-alias-bg-layer-2); }
.dsh-svnrev-lineno { flex: 0 0 auto; position: sticky; left: 0; z-index: 1; min-width: 5ch; padding: 0 8px 0 6px; text-align: right; color: var(--dsw-alias-label-secondary); background: var(--dsw-alias-bg-layer-2); border-right: 1px solid var(--dsw-alias-border-l1); cursor: context-menu; user-select: none; font: inherit; }
.dsh-svnrev-lineno:hover { color: var(--dsw-alias-brand-primary); }
.dsh-svnrev-lineno-active { color: var(--dsw-alias-brand-primary); font-weight: 600; }
/* Date above author. The date carries a recency colour of its own, so it must
   not inherit the muted grey of the gutter. Both rows are set tight: two rows
   must not make every code line twice as tall. */
.dsh-svnrev-gutter-blame { flex: 0 0 auto; display: flex; flex-direction: column; align-items: flex-start; padding: 0 6px; color: var(--dsw-alias-label-secondary); border-right: 1px solid var(--dsw-alias-border-l1); white-space: pre; line-height: 1.15; }
.dsh-svnrev-gutter-date { font-size: 9px; font-weight: 600; letter-spacing: -.2px; }
.dsh-svnrev-gutter-who { font-size: 10px; color: var(--dsw-alias-label-secondary); }
/* The revision over a line number is a real button, but it must not look like
   a form control inside the gutter. */
.dsh-svnrev-gutter-open { padding: 0; margin: 0; border: 0; border-radius: 2px; background: transparent; font: inherit; font-size: 10px; text-align: left; line-height: 1.15; cursor: pointer; text-decoration: underline; text-underline-offset: 2px; text-decoration-style: dotted; }
.dsh-svnrev-gutter-open:hover { background: var(--dsw-alias-bg-layer-1); color: var(--dsw-alias-brand-primary); }
.dsh-svnrev-gutter-open:focus-visible { outline: 2px solid var(--dsw-alias-brand-primary); outline-offset: 1px; }
.dsh-svnrev-legend { display: flex; align-items: center; gap: 3px; }
/* A swatch is a filled chip: it takes its bucket as background, not text. */
.dsh-svnrev-legend-dot { width: 8px; height: 8px; border-radius: 2px; display: inline-block; background: currentColor; }
/* Recency ramp, newest first, as five hue stops. Light and dark need opposite
   lightness, so each scheme gets its own set; one shared set would fail
   contrast in the other. The stops are declared per scheme, then applied as
   text colour on dates and as fill on legend swatches. */
body:not([data-ds-dark-theme]) .dsh-svnrev-age-0 { color: #1d4ed8; }
body:not([data-ds-dark-theme]) .dsh-svnrev-age-1 { color: #0e7490; }
body:not([data-ds-dark-theme]) .dsh-svnrev-age-2 { color: #57534e; }
body:not([data-ds-dark-theme]) .dsh-svnrev-age-3 { color: #a16207; }
body:not([data-ds-dark-theme]) .dsh-svnrev-age-4 { color: #b91c1c; }
body[data-ds-dark-theme] .dsh-svnrev-age-0 { color: #7ba7ff; }
body[data-ds-dark-theme] .dsh-svnrev-age-1 { color: #4fc9d9; }
body[data-ds-dark-theme] .dsh-svnrev-age-2 { color: #b0aca4; }
body[data-ds-dark-theme] .dsh-svnrev-age-3 { color: #e0b055; }
body[data-ds-dark-theme] .dsh-svnrev-age-4 { color: #f0857a; }
.dsh-svnrev-codetext { display: block; padding: 0 10px; white-space: pre; }
.dsh-svnrev-codehead { display: flex; gap: 8px; align-items: baseline; flex-wrap: wrap; }

/* Right-click menu, positioned at the pointer. */
.dsh-svnrev-menu { position: fixed; z-index: 60; min-width: 170px; padding: 4px; border-radius: 8px; border: 1px solid var(--dsw-alias-border-l2); background: var(--dsw-alias-bg-layer-1); box-shadow: 0 8px 24px rgba(0,0,0,.28); }
.dsh-svnrev-menu-item { display: block; width: 100%; text-align: left; font: inherit; cursor: pointer; padding: 5px 8px; border-radius: 6px; border: 0; background: transparent; color: var(--dsw-alias-label-primary); }
.dsh-svnrev-menu-item:hover, .dsh-svnrev-menu-item:focus-visible { background: var(--dsw-alias-bg-layer-2); outline: none; }
.dsh-svnrev-blamebar { position: relative; display: flex; gap: 10px; flex-wrap: wrap; align-items: baseline; padding: 6px 8px; border-radius: 6px; border: 1px solid var(--dsw-alias-border-l1); background: var(--dsw-alias-bg-layer-2); }
.dsh-svnrev-kv { display: inline-flex; gap: 4px; align-items: baseline; }
/* Date above author, both left-aligned in one column. */
.dsh-svnrev-kv-stack { display: inline-flex; flex-direction: column; align-items: flex-start; gap: 1px; }
/* An inline link that reads as text but is a real, focusable button. */
.dsh-svnrev-link { font: inherit; padding: 0 2px; border: 0; border-radius: 3px; background: transparent; color: var(--dsw-alias-brand-primary); cursor: pointer; text-decoration: underline; text-underline-offset: 2px; }
.dsh-svnrev-link:hover { background: var(--dsw-alias-bg-layer-1); }
.dsh-svnrev-link:focus-visible { outline: 2px solid var(--dsw-alias-brand-primary); outline-offset: 1px; }
@media (max-width: 720px) { .dsh-svnrev-open-label { display: none; } }
`

    /** Classify one unified-diff line for colouring. */
    const lineClass = (line) => {
      if (line.startsWith('+++') || line.startsWith('---') || line.startsWith('Index: ')) return 'dsh-svnrev-meta'
      if (line.startsWith('@@')) return 'dsh-svnrev-hunk'
      if (line.startsWith('+')) return 'dsh-svnrev-add'
      if (line.startsWith('-')) return 'dsh-svnrev-del'
      return undefined
    }

    /** Render a unified diff with per-line colouring. */
    function DiffView({ text, t }) {
      if (text === null || text === undefined || text.trim() === '') {
        return h('div', { className: 'dsh-svnrev-muted' }, t('noDiff'))
      }
      const lines = text.split('\n')
      // A scroll container must be reachable from the keyboard, or a long diff
      // cannot be read without a mouse.
      return h('pre', { className: 'dsh-svnrev-diff', tabIndex: 0, role: 'region', 'aria-label': t('diff') },
        h('code', { className: 'dsh-svnrev-diff-body' },
          lines.map((line, index) => h('span', {
            key: index,
            className: ['dsh-svnrev-line', lineClass(line)].filter(Boolean).join(' '),
          }, line === '' ? ' ' : line))))
    }

    /** Short local time for an SVN ISO timestamp. */
    const when = (iso) => {
      if (!iso) return ''
      const at = new Date(iso)
      return Number.isNaN(at.getTime()) ? iso : at.toLocaleString()
    }

    /** Date without the clock, for the narrow per-line gutter. */
    const whenDate = (iso) => {
      if (!iso) return ''
      const at = new Date(iso)
      return Number.isNaN(at.getTime()) ? iso : at.toLocaleDateString()
    }

    /**
     * SVN status to a label. `svn status --xml` spells its `item` attribute in
     * words (`modified`, `unversioned`, `missing`, `conflicted`, …) while
     * `svn log -v` spells a change action as one letter (`M`, `A`, `D`, `R`), so
     * both spellings map here. Every code names its own meaning rather than
     * deriving one from the first character.
     */
    const STATUS_LABELS = {
      // svn status --xml `item` values.
      normal: { key: 'actionM', tone: 'm' },
      modified: { key: 'actionM', tone: 'm' },
      added: { key: 'actionA', tone: 'a' },
      deleted: { key: 'actionD', tone: 'd' },
      replaced: { key: 'actionR', tone: 'm' },
      conflicted: { key: 'conflicted', tone: 'd' },
      unversioned: { key: 'unversioned', tone: 'u' },
      missing: { key: 'missing', tone: 'd' },
      ignored: { key: 'ignored', tone: 'u' },
      obstructed: { key: 'obstructed', tone: 'd' },
      external: { key: 'external', tone: 'u' },
      incomplete: { key: 'obstructed', tone: 'd' },
      // svn log -v `action` letters.
      M: { key: 'actionM', tone: 'm' },
      A: { key: 'actionA', tone: 'a' },
      D: { key: 'actionD', tone: 'd' },
      R: { key: 'actionR', tone: 'm' },
      C: { key: 'conflicted', tone: 'd' },
      '?': { key: 'unversioned', tone: 'u' },
      '!': { key: 'missing', tone: 'd' },
      I: { key: 'ignored', tone: 'u' },
      '~': { key: 'obstructed', tone: 'd' },
      X: { key: 'external', tone: 'u' },
    }

    /** The status tag for one changed path or revision entry. */
    function statusTag(h, t, code) {
      const raw = String(code ?? 'M')
      const meta = STATUS_LABELS[raw] ?? STATUS_LABELS[raw.toUpperCase()] ?? STATUS_LABELS.M
      return h('span', { className: `dsh-svnrev-tag dsh-svnrev-tag-${meta.tone}` }, t(meta.key))
    }

    /** Tab chip: a dot plus the localized name captured at open time. */
    function SvnTitle({ t }) {
      return h('span', { className: 'dsh-svnrev-title' },
        h('span', { className: 'dsh-svnrev-dot', 'aria-hidden': 'true' }),
        t('tab'))
    }

    /** The guide card's glyph, drawn in the surrounding text colour. */
    function SvnMark({ size }) {
      const px = typeof size === 'number' ? size : 22
      return h('svg', { width: px, height: px, viewBox: '0 0 36 36', 'aria-hidden': 'true', focusable: 'false' },
        h('rect', { x: 5, y: 5, width: 26, height: 26, rx: 7, fill: 'none', stroke: 'currentColor', strokeWidth: 2.6 }),
        h('path', { d: 'M11 15h9m-9 6h6', fill: 'none', stroke: 'currentColor', strokeWidth: 2.6, strokeLinecap: 'round' }),
        h('circle', { cx: 25, cy: 25, r: 6, fill: 'currentColor' }))
    }

    /**
     * The header control that opens this tab. It reports whether this session's
     * panel is already showing, so a second click is visibly a no-op rather
     * than a button that appears broken.
     */
    function SvnOpenButton({ t, open, sessionId, useSvnOpenTabs }) {
      // The framework binds each entry of the inject `hooks` face as a
      // subscribing hook (`svnOpenTabs` → `useSvnOpenTabs`), so this stays
      // correct as tabs open and close.
      const openTabs = typeof useSvnOpenTabs === 'function' ? useSvnOpenTabs() : undefined
      const shown = Array.isArray(openTabs)
        && openTabs.some(tab => tab.sessionId === sessionId && tab.kind === 'svn-review')
      return h('button', {
        type: 'button',
        className: 'dsh-svnrev-btn dsh-svnrev-open',
        title: shown ? t('alreadyOpen') : t('title'),
        'aria-label': t('title'),
        'aria-pressed': shown,
        onClick: open,
      },
      h('svg', { width: 14, height: 14, viewBox: '0 0 36 36', 'aria-hidden': 'true', focusable: 'false' },
        h('rect', { x: 5, y: 5, width: 26, height: 26, rx: 7, fill: 'none', stroke: 'currentColor', strokeWidth: 2.6 }),
        h('path', { d: 'M11 15h9m-9 6h6', fill: 'none', stroke: 'currentColor', strokeWidth: 2.6, strokeLinecap: 'round' }),
        h('circle', { cx: 25, cy: 25, r: 6, fill: 'currentColor' })),
      h('span', { className: 'dsh-svnrev-open-label' }, t('tab')))
    }

    /**
     * Recency palette for the per-line commit date, newest first.
     *
     * A hue ramp, not a black-to-grey opacity ramp: with one hue the only
     * difference between neighbours is brightness, which is exactly the axis a
     * 9px glyph is worst at. Five hue stops stay apart at that size.
     *
     * The stops are class names, not colours: light and dark need opposite
     * lightness, and DSH flips the scheme at runtime by setting
     * `body[data-ds-dark-theme]`, so the CSS carries one palette per scheme.
     */
    const RECENCY_BUCKETS = 5
    const recencyClass = (index) => `dsh-svnrev-age-${String(index)}`

    /**
     * The whole file, one row per line, with a line-number gutter whose numbers
     * open a per-line author lookup on right click.
     *
     * `blame` maps a line number to its attribution. It is rendered only when
     * its `source` matches the content on screen: a repository blame over a
     * locally edited file describes a different text, and printing it beside
     * the wrong lines would be worse than printing nothing.
     *
     * Beside the line number the gutter carries the commit date above the
     * author, and tints that date by recency across the whole file: the newest
     * commit on screen is the strongest colour, the oldest the faintest. One
     * blame call already returns every line's date, so the scale costs no extra
     * request.
     */
    function FileView({ file, blame, activeLine, onPickLine, onOpenRevision, t }) {
      if (file.binary === true) {
        return h('div', { className: 'dsh-svnrev-muted' }, t('binaryFile'))
      }
      const text = String(file.content ?? '')
      if (text === '') {
        return h('div', { className: 'dsh-svnrev-muted' }, t('emptyFile'))
      }
      // A trailing newline is not an extra line of code.
      const lines = text.replace(/\n$/, '').split('\n')
      const aligned = blame !== null && blame !== undefined && blame.source === file.source
      const byLine = new Map()
      const times = []
      if (aligned) {
        for (const entry of blame.entries ?? []) {
          byLine.set(entry.line, entry)
          const at = Date.parse(entry.date)
          if (!Number.isNaN(at)) times.push(at)
        }
      }
      // The range the shading is relative to is the range of THIS page, not of
      // the repository: a file last touched over two years has to show contrast
      // among its own lines even though every one of them is old.
      const newest = times.length === 0 ? 0 : Math.max(...times)
      const oldest = times.length === 0 ? 0 : Math.min(...times)
      // Recency is a hue ramp, not a black-to-grey opacity ramp: with one hue
      // the only difference between neighbours is brightness, which is exactly
      // the axis a 9px glyph is worst at. The buckets are classes so the CSS can
      // supply a light and a dark palette.
      const bucket = (iso) => {
        const at = Date.parse(iso)
        // A single distinct date, or an unparseable one, has nothing to rank
        // against: show it as the newest rather than guessing a shade.
        if (Number.isNaN(at) || newest === oldest) return 0
        const ratio = (at - oldest) / (newest - oldest)
        return Math.min(RECENCY_BUCKETS - 1, Math.floor((1 - ratio) * RECENCY_BUCKETS))
      }
      return h('div', { className: 'dsh-svnrev-code', tabIndex: 0, role: 'region', 'aria-label': t('fileTab') },
        lines.map((line, index) => {
          const number = index + 1
          const entry = byLine.get(number)
          return h('div', { className: 'dsh-svnrev-codeline', key: number },
            // Two stacked rows keep the date beside the author without making
            // the gutter any wider than the code can spare.
            aligned && h('span', {
              className: 'dsh-svnrev-gutter-blame',
              title: entry === undefined
                ? undefined
                : `${entry.author} · r${String(entry.revision)}` + (entry.date === '' ? '' : ` · ${when(entry.date)}`),
            },
            entry === undefined ? ' ' : [
              h('span', {
                className: `dsh-svnrev-gutter-date ${recencyClass(bucket(entry.date))}`,
                key: 'd',
              }, whenDate(entry.date) || ' '),
              // The revision number over the line number is the second way into
              // a commit: same destination as the author in the blame bar, but
              // reachable without looking up the line first.
              entry.revision === null
                ? h('span', { className: 'dsh-svnrev-gutter-who', key: 'w' },
                  `${String(entry.revision ?? '')} ${entry.author}`.trim())
                : h('button', {
                  type: 'button',
                  className: 'dsh-svnrev-gutter-who dsh-svnrev-gutter-open',
                  key: 'w',
                  title: t('openRevisionHint', { rev: String(entry.revision) }),
                  onClick: () => { onOpenRevision(entry.revision) },
                }, `r${String(entry.revision)} ${entry.author}`.trim()),
            ]),
            h('span', {
              className: ['dsh-svnrev-lineno', activeLine === number ? 'dsh-svnrev-lineno-active' : undefined].filter(Boolean).join(' '),
              role: 'button',
              tabIndex: 0,
              title: t('lineAuthorHint'),
              'aria-label': t('lineAuthor', { line: number }),
              onContextMenu: (event) => {
                event.preventDefault()
                onPickLine(number, event.clientX, event.clientY)
              },
              // Keyboard parity: the same lookup without a pointer.
              onKeyDown: (event) => {
                if (event.key !== 'Enter' && event.key !== ' ') return
                event.preventDefault()
                const box = event.currentTarget.getBoundingClientRect()
                onPickLine(number, box.left, box.bottom)
              },
              onClick: (event) => {
                const box = event.currentTarget.getBoundingClientRect()
                onPickLine(number, box.left, box.bottom)
              },
            }, String(number)),
            h('span', { className: 'dsh-svnrev-codetext' }, line === '' ? ' ' : line))
        }))
    }

    /**
     * The panel: one workspace's projects, then that project's local changes or
     * its revisions, then the picked file as a whole (with line numbers and
     * per-line authors) or its diff.
     */
    function SvnPanel({ t, sessionId }) {
      const [projects, setProjects] = useState({ phase: 'loading' })
      const [current, setCurrent] = useState(null)
      const [mode, setMode] = useState('changes')
      const [status, setStatus] = useState({ phase: 'idle' })
      const [log, setLog] = useState({ phase: 'idle' })
      const [picked, setPicked] = useState(null)
      const [revision, setRevision] = useState(null)
      // Which of the two drill-downs owns the pane. A revision can be reached
      // from a file's line author (so `picked` stays loaded behind it) and a
      // file can be opened from a revision's file list (so `revision` stays
      // loaded behind it); a plain boolean says which one is on top, which the
      // presence of either state alone cannot express.
      const [revisionView, setRevisionView] = useState(false)
      const [tab, setTab] = useState('file')
      const [filter, setFilter] = useState('')
      const [generation, setGeneration] = useState(0)
      const [menu, setMenu] = useState(null)
      /** Token of the newest pick; an older response must not overwrite it. */
      const pickToken = useRef(0)
      /** Blame results keyed by `path@rev`, so the same line costs one request. */
      const blameCache = useRef(new Map())
      /** One revision's own metadata, keyed by `wc@rev`. */
      const revisionCache = useRef(new Map())
      /** Token of the newest revision lookup; same rule as `pickToken`. */
      const revisionToken = useRef(0)

      // Projects: one scan per panel life, and again after an explicit rescan.
      // The scan is scoped to the workspace THIS session lives in.
      useEffect(() => {
        const controller = new AbortController()
        setProjects({ phase: 'loading' })
        get('projects', { session: sessionId }, controller.signal).then((payload) => {
          if (controller.signal.aborted) return
          if (payload.ok === false) {
            setProjects({ phase: 'failed', message: payload.message ?? '' })
            return
          }
          const list = payload.projects ?? []
          setProjects({ phase: 'ready', list, workspace: payload.workspace ?? null, reason: payload.reason })
          setCurrent((previous) => previous !== null && list.some(item => item.path === previous.path)
            ? previous
            : list[0] ?? null)
        }, (error) => {
          if (!controller.signal.aborted) setProjects({ phase: 'failed', message: String(error) })
        })
        return () => { controller.abort() }
      }, [generation, sessionId])

      // The selected project's local changes.
      useEffect(() => {
        if (current === null || mode !== 'changes') return
        const controller = new AbortController()
        setStatus({ phase: 'loading' })
        get('status', { wc: current.path }, controller.signal).then((payload) => {
          if (controller.signal.aborted) return
          if (payload.ok === false) {
            setStatus({ phase: 'failed', message: payload.message ?? '' })
            return
          }
          setStatus({ phase: 'ready', payload })
        }, (error) => {
          if (!controller.signal.aborted) setStatus({ phase: 'failed', message: String(error) })
        })
        return () => { controller.abort() }
      }, [current, mode, generation])

      // The selected project's recent revisions.
      useEffect(() => {
        if (current === null || mode !== 'history') return
        const controller = new AbortController()
        setLog({ phase: 'loading' })
        get('log', { wc: current.path }, controller.signal).then((payload) => {
          if (controller.signal.aborted) return
          if (payload.ok === false) {
            setLog({ phase: 'failed', message: payload.message ?? '' })
            return
          }
          setLog({ phase: 'ready', payload })
        }, (error) => {
          if (!controller.signal.aborted) setLog({ phase: 'failed', message: String(error) })
        })
        return () => { controller.abort() }
      }, [current, mode, generation])

      /** Escape closes the line menu. */
      useEffect(() => {
        if (menu === null) return undefined
        const away = () => { setMenu(null) }
        const escape = (event) => { if (event.key === 'Escape') setMenu(null) }
        window.addEventListener('click', away)
        window.addEventListener('keydown', escape)
        return () => {
          window.removeEventListener('click', away)
          window.removeEventListener('keydown', escape)
        }
      }, [menu])

      /**
       * Open one file: its whole content at a revision (or as it is on disk),
       * plus the diff that brought it here.
       *
       * The request is stamped so a response that arrives after the user
       * switched project, mode, or file is discarded instead of replacing what
       * is on screen.
       */
      const openFile = useCallback(async (request) => {
        const token = pickToken.current + 1
        pickToken.current = token
        setTab('file')
        setPicked({
          phase: 'loading',
          title: request.title,
          wc: request.wc,
          path: request.path,
          rev: request.rev,
          diff: request.diff,
          diffTruncated: request.diffTruncated === true,
          hint: request.hint,
          // Which revision's file list opened this file, if any. This is what
          // makes "back" unambiguous: a file opened from r65595's list returns
          // to r65595, while a file opened from the project's own change list
          // returns to that list even if a revision was inspected meanwhile.
          fromRevision: request.fromRevision,
          file: null,
          fileError: null,
          fileMissing: false,
          blame: null,
          activeLine: null,
        })
        try {
          const payload = await get('file', { wc: request.wc, path: request.path, rev: request.rev })
          if (pickToken.current !== token) return
          if (payload.ok === false) {
            // "Not born yet at that revision" is an ordinary answer about
            // history, not a failure to report as an error.
            const message = payload.code === 'not-in-revision'
              ? t('notInRevision', { rev: payload.revision ?? request.rev ?? '?' })
              : (payload.message ?? '')
            setPicked(previous => (previous === null ? previous : {
              ...previous,
              phase: 'ready',
              file: null,
              fileError: message,
              fileMissing: payload.code === 'not-in-revision',
            }))
            return
          }
          setPicked(previous => (previous === null ? previous : {
            ...previous,
            phase: 'ready',
            file: payload,
            fileError: null,
            fileMissing: false,
          }))
        } catch (error) {
          if (pickToken.current !== token) return
          setPicked(previous => (previous === null ? previous : {
            ...previous,
            phase: 'ready',
            file: null,
            fileError: String(error),
            fileMissing: false,
          }))
        }
      }, [])

      /**
       * Load the per-line attribution of the open file. One request per
       * `path@rev` is kept, so right-clicking several lines is free.
       */
      const loadBlame = useCallback(async () => {
        if (picked === null || picked.phase !== 'ready') return
        const key = `${picked.path}@${picked.rev ?? ''}`
        const cached = blameCache.current.get(key)
        if (cached !== undefined) {
          setPicked(previous => (previous === null ? previous : { ...previous, blame: cached }))
          return
        }
        setPicked(previous => (previous === null ? previous : { ...previous, blame: { phase: 'loading' } }))
        try {
          const payload = await get('blame', { wc: picked.wc, path: picked.path, rev: picked.rev })
          const outcome = payload.ok === false
            ? { phase: 'failed', message: payload.message ?? '' }
            : { phase: 'ready', ...payload }
          blameCache.current.set(key, outcome)
          setPicked(previous => (previous === null || previous.path !== picked.path ? previous : { ...previous, blame: outcome }))
        } catch (error) {
          setPicked(previous => (previous === null || previous.path !== picked.path
            ? previous
            : { ...previous, blame: { phase: 'failed', message: String(error) } }))
        }
      }, [picked])

      /** Any move that changes what the list means also closes the open file. */
      const resetView = () => {
        pickToken.current += 1
        revisionToken.current += 1
        setPicked(null)
        setRevision(null)
        setRevisionView(false)
        setFilter('')
        setMenu(null)
      }

      /**
       * Drill into one revision: who committed it, when, why, and the files it
       * touched. This is the step between "line 42 was last changed by chenfei
       * at r65595" and "here is what r65595 actually did".
       *
       * The open file stays in state, so backing out of the revision returns to
       * the line the reader started from.
       */
      const openRevision = useCallback(async (rev, wc) => {
        const token = revisionToken.current + 1
        revisionToken.current = token
        setMenu(null)
        setRevisionView(true)
        const key = `${wc}@${rev}`
        const cached = revisionCache.current.get(key)
        if (cached !== undefined) {
          setRevision(cached)
          return
        }
        setRevision({ phase: 'loading', rev, wc })
        try {
          const payload = await get('revision', { wc, rev: String(rev) })
          if (revisionToken.current !== token) return
          const outcome = payload.ok === false
            ? {
              phase: 'failed',
              rev,
              wc,
              missing: payload.code === 'no-such-revision',
              message: payload.message ?? '',
            }
            : { phase: 'ready', rev, wc, ...payload }
          revisionCache.current.set(key, outcome)
          setRevision(outcome)
        } catch (error) {
          if (revisionToken.current !== token) return
          setRevision({ phase: 'failed', rev, wc, missing: false, message: String(error) })
        }
      }, [])

      const body = []

      /**
       * One changed path of one revision, as a row that opens the file at that
       * revision.
       *
       * A row whose path lies outside the working copy (history inherited from
       * before a branch copy) is shown but disabled: opening it would always
       * fail, and a click that cannot work is worse than a row that says why.
       */
      const pathRow = (entry, rev, wc) => {
        const outside = entry.inCopy === false
        return h('button', {
          key: `${String(rev)}:${entry.path}`,
          type: 'button',
          className: 'dsh-svnrev-row',
          disabled: outside,
          title: outside ? t('outsideCopyHint') : undefined,
          onClick: () => {
            void (async () => {
              // The revision card stays loaded behind the file, so "back"
              // returns to this revision's file list.
              setRevisionView(false)
              // The committed diff is the reason this row is interesting, and
              // it comes from a different route than the file body.
              const payload = await get('diff', {
                wc,
                path: entry.path,
                rev: String(rev),
              }).catch(error => ({ ok: false, message: String(error) }))
              await openFile({
                title: `${entry.relative ?? entry.path} @ r${String(rev)}`,
                wc,
                path: entry.path,
                rev: String(rev),
                diff: payload.ok === false ? null : payload.diff,
                diffTruncated: payload.ok === false ? false : payload.truncated === true,
                hint: payload.ok === false ? (payload.message ?? '') : undefined,
                fromRevision: rev,
              })
            })()
          },
        },
        h('span', { className: 'dsh-svnrev-path' }, entry.relative ?? entry.path),
        outside && h('span', { className: 'dsh-svnrev-tag dsh-svnrev-tag-u' }, t('outsideCopy')),
        statusTag(h, t, entry.action))
      }

      // Header: project picker, the two views, one reload control.
      body.push(h('div', { className: 'dsh-svnrev-bar', key: 'bar' },
        h('select', {
          className: 'dsh-svnrev-select',
          'aria-label': t('projects'),
          value: current === null ? '' : current.path,
          disabled: projects.phase !== 'ready' || projects.list.length === 0,
          onChange: (event) => {
            const next = (projects.list ?? []).find(item => item.path === event.target.value) ?? null
            resetView()
            setCurrent(next)
          },
        }, projects.phase === 'ready' && projects.list.length > 0
          // `label` already spells the chain out (workspace, then the path down
          // to the working copy), so two same-named checkouts stay distinct.
          ? projects.list.map(item => h('option', { key: item.path, value: item.path },
            item.label ?? item.name))
          : h('option', { value: '' }, projects.phase === 'ready' ? t('noProjects') : t('loading'))),
        h('button', {
          type: 'button', className: 'dsh-svnrev-btn',
          'aria-pressed': mode === 'changes',
          disabled: current === null,
          onClick: () => { resetView(); setMode('changes') },
        }, t('changes')),
        h('button', {
          type: 'button', className: 'dsh-svnrev-btn',
          'aria-pressed': mode === 'history',
          disabled: current === null,
          onClick: () => { resetView(); setMode('history') },
        }, t('history')),
        h('button', {
          type: 'button', className: 'dsh-svnrev-btn',
          disabled: current === null,
          onClick: () => { resetView(); setGeneration(value => value + 1) },
        }, t('refresh'))))

      // The workspace this panel is confined to, so the scope is never implied.
      if (projects.phase === 'ready' && projects.workspace !== null && projects.workspace !== undefined) {
        body.push(h('div', { className: 'dsh-svnrev-muted', key: 'ws' },
          `${t('workspace')}: ${projects.workspace.title === '' ? projects.workspace.path : projects.workspace.title}`))
      }

      // A failed project scan is its own dead end; retry re-runs it.
      if (projects.phase === 'failed') {
        body.push(h('div', { className: 'dsh-svnrev-err', key: 'pf' },
          `${t('failed')}: ${projects.message}`,
          ' ',
          h('button', {
            type: 'button', className: 'dsh-svnrev-btn',
            onClick: () => { setGeneration(value => value + 1) },
          }, t('retry'))))
      }
      if (projects.phase === 'ready' && projects.list.length === 0) {
        // Three different causes, three different fixes: a panel with no session
        // id, a session outside every workspace, or a workspace with no checkout.
        const explanation = projects.reason === 'no-session'
          ? t('noSession')
          : projects.workspace === null || projects.workspace === undefined ? t('noWorkspace') : t('noProjects')
        body.push(h('div', { className: 'dsh-svnrev-muted', key: 'np' }, explanation))
      }
      // A working copy whose own `svn info` failed still lists, with its reason.
      if (current !== null && current.error !== null && current.error !== undefined) {
        body.push(h('div', { className: 'dsh-svnrev-err', key: 'cerr' },
          `${t('failed')}: ${current.error}`))
      }

      // Revision numbers from the log make the project line concrete.
      if (current !== null) {
        body.push(h('div', { className: 'dsh-svnrev-muted', key: 'cur' },
          `${current.label ?? current.name} · r${String(current.revision ?? '?')}`))
      }

      // The revision card owns the pane while it is on top. It is reached from a
      // line's author (a file stays loaded behind it) or from the history list,
      // so "back" leads to whichever of those the reader came from.
      if (revision !== null && revisionView === true) {
        body.push(h('div', { className: 'dsh-svnrev-bar', key: 'revbar' },
          h('button', {
            type: 'button', className: 'dsh-svnrev-btn',
            onClick: () => {
              if (picked !== null) {
                // Return to the file this revision was opened from, keeping
                // its line and its blame as they were.
                setRevisionView(false)
                return
              }
              revisionToken.current += 1
              setRevision(null)
            },
          }, picked !== null ? t('backToFile') : t('back'))))
        if (revision.phase === 'loading') {
          body.push(h('div', { className: 'dsh-svnrev-muted', key: 'revload' }, t('revisionLoading')))
        } else if (revision.phase === 'failed') {
          body.push(h('div', {
            className: revision.missing === true ? 'dsh-svnrev-muted' : 'dsh-svnrev-err',
            key: 'revfail',
          }, revision.missing === true
            ? t('revisionMissing', { rev: String(revision.rev) })
            : `${t('revisionFailed')}: ${revision.message}`))
        } else {
          body.push(h('div', { className: 'dsh-svnrev-rev', key: 'revcard' },
            h('div', { className: 'dsh-svnrev-rev-head' },
              h('span', { className: 'dsh-svnrev-rev-num' }, `r${String(revision.revision)}`),
              h('span', { className: 'dsh-svnrev-muted' },
                revision.author === '' ? t('unknownAuthor') : revision.author),
              h('span', { className: 'dsh-svnrev-muted' }, when(revision.date))),
            h('div', { className: 'dsh-svnrev-msg' },
              revision.message.trim() === ''
                ? h('span', { className: 'dsh-svnrev-muted' }, t('emptyMessage'))
                : revision.message)))
          const files = revision.paths ?? []
          if (files.length === 0) {
            body.push(h('div', { className: 'dsh-svnrev-muted', key: 'revnone' }, t('revisionNoFiles')))
          } else {
            body.push(h('div', { className: 'dsh-svnrev-muted', key: 'revcount' },
              `${t('revisionFiles')} · ${t('fileCount', { count: files.length })}`))
            body.push(h('div', { className: 'dsh-svnrev-list', key: 'revlist' },
              files.map(entry => pathRow(entry, revision.revision, revision.wc))))
          }
        }
      }

      // A picked file replaces the list, unless a revision card is on top of it.
      if (picked !== null && revisionView === false) {
        body.push(h('div', { className: 'dsh-svnrev-bar', key: 'pickbar' },
          h('button', {
            type: 'button', className: 'dsh-svnrev-btn',
            // A file opened from a revision's own file list returns to that
            // revision. Any other file returns to its project list, even if a
            // revision was inspected from it in the meantime — using "a
            // revision exists" as the test would loop back and forth forever.
            onClick: () => {
              if (picked.fromRevision !== undefined && revision !== null) {
                pickToken.current += 1
                setPicked(null)
                setRevisionView(true)
                return
              }
              resetView()
            },
          }, picked.fromRevision !== undefined && revision !== null
            ? t('backToRevision')
            : t('back')),
          h('button', {
            type: 'button', className: 'dsh-svnrev-btn',
            'aria-pressed': tab === 'file',
            onClick: () => { setTab('file') },
          }, t('fileTab')),
          h('button', {
            type: 'button', className: 'dsh-svnrev-btn',
            'aria-pressed': tab === 'diff',
            onClick: () => { setTab('diff') },
          }, t('diffTab'))))
        body.push(h('div', { className: 'dsh-svnrev-path', key: 'picktitle' }, picked.title))
        if (picked.phase === 'loading') {
          body.push(h('div', { className: 'dsh-svnrev-muted', key: 'pickload' }, t('readingFile')))
        } else if (tab === 'diff') {
          if (picked.hint !== undefined) {
            body.push(h('div', { className: 'dsh-svnrev-muted', key: 'pickhint' }, picked.hint))
          }
          if (picked.diffTruncated === true) {
            body.push(h('div', { className: 'dsh-svnrev-muted', key: 'picktrunc' }, t('truncation')))
          }
          body.push(h('div', { key: 'pickdiff' }, h(DiffView, { text: picked.diff, t })))
        } else if (picked.fileError !== undefined && picked.fileError !== null) {
          body.push(h('div', {
            className: picked.fileMissing === true ? 'dsh-svnrev-muted' : 'dsh-svnrev-err',
            key: 'pickfail',
          }, picked.fileMissing === true ? picked.fileError : `${t('failed')}: ${picked.fileError}`))
        } else if (picked.file === null || picked.file === undefined) {
          body.push(h('div', { className: 'dsh-svnrev-muted', key: 'picknone' }, t('readingFile')))
        } else {
          const file = picked.file
          const blame = picked.blame
          const ready = blame !== null && blame !== undefined && blame.phase === 'ready'
          const blameForView = ready ? blame : null
          const activeEntry = ready && picked.activeLine !== null
            ? (blame.entries ?? []).find(entry => entry.line === picked.activeLine)
            : undefined
          body.push(h('div', { className: 'dsh-svnrev-codehead', key: 'chead' },
            h('span', { className: 'dsh-svnrev-muted' },
              file.source === 'repository' ? t('atRevision', { rev: file.revision }) : t('localVersion')),
            h('span', { className: 'dsh-svnrev-muted' }, t('shownLines', { count: file.lines ?? 0 })),
            file.encoding !== null && file.encoding !== undefined && file.encoding !== 'utf-8'
              && h('span', { className: 'dsh-svnrev-muted' }, t('encodedAs', { encoding: file.encoding })),
            file.truncated === true && h('span', { className: 'dsh-svnrev-err' }, t('truncation'))))
          if (file.binary !== true) {
            body.push(h('div', { className: 'dsh-svnrev-muted', key: 'blamehint' }, t('lineAuthorHint')))
          }
          // The palette is meaningless without its key: five coloured dates say
          // nothing about which end is newer until this line spells it out.
          if (ready && file.binary !== true) {
            body.push(h('div', { className: 'dsh-svnrev-legend', key: 'legend' },
              h('span', { className: 'dsh-svnrev-muted' }, t('legendNewer')),
              Array.from({ length: RECENCY_BUCKETS }, (unused, index) => h('span', {
                key: index,
                className: `dsh-svnrev-legend-dot ${recencyClass(index)}`,
              })),
              h('span', { className: 'dsh-svnrev-muted' }, t('legendOlder'))))
          }
          if (blame !== null && blame !== undefined && blame.phase === 'loading') {
            body.push(h('div', { className: 'dsh-svnrev-muted', key: 'blameload' }, t('blameLoading')))
          }
          if (blame !== null && blame !== undefined && blame.phase === 'failed') {
            body.push(h('div', { className: 'dsh-svnrev-err', key: 'blamefail' },
              `${t('blameFailed')}: ${blame.message}`))
          }
          // A lookup that does not describe the text on screen says so instead
          // of stamping the wrong author beside a line.
          if (ready && file.binary !== true) {
            if (blame.source === 'repository' && file.source === 'working') {
              body.push(h('div', { className: 'dsh-svnrev-muted', key: 'blamerepo' },
                t('blameMismatch', { rev: blame.revision })))
            } else if (blame.source === 'repository') {
              body.push(h('div', { className: 'dsh-svnrev-muted', key: 'blamerepo2' },
                t('blameRepository', { rev: blame.revision })))
            }
          }
          if (ready && picked.activeLine !== null && file.binary !== true) {
            body.push(h('div', { className: 'dsh-svnrev-blamebar', key: 'blamebar' },
              h('strong', null, t('lineAuthor', { line: picked.activeLine })),
              activeEntry === undefined
                ? h('span', { className: 'dsh-svnrev-muted' }, t('unknownAuthor'))
                : [
                  // Date above author, matching the gutter, so the same two
                  // facts read in the same order in both places.
                  h('span', { className: 'dsh-svnrev-kv dsh-svnrev-kv-stack', key: 'a' },
                    h('span', { className: 'dsh-svnrev-muted' }, `${t('date')}: ${when(activeEntry.date)}`),
                    h('span', null,
                      h('span', { className: 'dsh-svnrev-muted' }, `${t('author')}: `),
                      // The author itself is the entry point the reader reaches
                      // for first, so it drills into the same revision.
                      activeEntry.revision === null || activeEntry.author === ''
                        ? h('span', null, t('unknownAuthor'))
                        : h('button', {
                          type: 'button',
                          className: 'dsh-svnrev-link',
                          title: t('openRevisionHint', { rev: String(activeEntry.revision) }),
                          onClick: () => { void openRevision(activeEntry.revision, picked.wc) },
                        }, activeEntry.author))),
                  // The revision number is the way in: clicking it loads that
                  // commit's own record and its changed files.
                  h('span', { className: 'dsh-svnrev-kv', key: 'r' },
                    h('span', { className: 'dsh-svnrev-muted' }, `${t('revision')}:`),
                    activeEntry.revision === null
                      ? h('span', null, '—')
                      : h('button', {
                        type: 'button',
                        className: 'dsh-svnrev-link',
                        title: t('openRevisionHint', { rev: String(activeEntry.revision) }),
                        onClick: () => { void openRevision(activeEntry.revision, picked.wc) },
                      }, `r${String(activeEntry.revision)}`)),
                ]))
          }
          body.push(h('div', { key: 'code' }, h(FileView, {
            file,
            blame: blameForView,
            activeLine: picked.activeLine,
            onPickLine: (line, x, y) => { setMenu({ line, x, y }) },
            // The revision shown over a line number opens that commit, exactly
            // like the author in the blame bar.
            onOpenRevision: (rev) => { void openRevision(rev, picked.wc) },
            t,
          })))
        }
      } else if (revisionView === false && mode === 'changes' && current !== null) {
        if (status.phase === 'loading') {
          body.push(h('div', { className: 'dsh-svnrev-muted', key: 'sload' }, t('loading')))
        } else if (status.phase === 'failed') {
          body.push(h('div', { className: 'dsh-svnrev-err', key: 'sfail' }, `${t('failed')}: ${status.message}`))
        } else if (status.phase === 'ready') {
          const files = status.payload.files ?? []
          // A failed `svn status` or whole-copy diff is not an empty project:
          // saying "no changes" there would be a false all-clear.
          if (status.payload.statusError) {
            body.push(h('div', { className: 'dsh-svnrev-err', key: 'serr' },
              `${t('failed')}: ${status.payload.statusError}`))
          }
          if (status.payload.diffError) {
            body.push(h('div', { className: 'dsh-svnrev-err', key: 'sderr' },
              `${t('failed')}: ${status.payload.diffError}`))
          }
          if (status.payload.diffTruncated === true) {
            body.push(h('div', { className: 'dsh-svnrev-muted', key: 'strunc' }, t('truncation')))
          }
          if (files.length === 0) {
            if (!status.payload.statusError) {
              body.push(h('div', { className: 'dsh-svnrev-muted', key: 'snone' }, t('noChanges')))
            }
          } else {
            // Filtering is client-side: the status route already returned every
            // row, so a keystroke must not cost another `svn status`.
            const needle = filter.trim().toLowerCase()
            const visibleFiles = needle === ''
              ? files
              : files.filter(entry => entry.path.toLowerCase().includes(needle))
            // `svn status` reports working-copy-relative paths; the file route
            // wants a repository-absolute one, which the copy's own URL supplies.
            const base = (current.relativeUrl ?? '').replace(/^\^/, '').replace(/\/+$/, '')
            body.push(h('div', { className: 'dsh-svnrev-bar', key: 'sfilter' },
              h('input', {
                type: 'search',
                className: 'dsh-svnrev-filter',
                placeholder: t('filter'),
                'aria-label': t('filter'),
                value: filter,
                onChange: (event) => { setFilter(event.target.value) },
              }),
              h('span', { className: 'dsh-svnrev-muted' },
                t('fileCount', { count: visibleFiles.length }))))
            if (visibleFiles.length === 0) {
              body.push(h('div', { className: 'dsh-svnrev-muted', key: 'snomatch' }, t('noMatch')))
            } else {
              const rows = visibleFiles.map(entry => h('button', {
                key: entry.path,
                type: 'button',
                className: 'dsh-svnrev-row',
                onClick: () => {
                  void openFile({
                    title: entry.path,
                    wc: current.path,
                    path: `${base}/${entry.path.replaceAll('\\', '/')}`,
                    rev: undefined,
                    diff: entry.diff,
                    diffTruncated: status.payload.diffTruncated === true,
                    // An unversioned file has no repository baseline, so its empty
                    // diff is a fact to explain rather than an empty pane.
                    hint: entry.item === 'unversioned' ? t('unversionedHint') : undefined,
                  })
                },
              },
              h('span', { className: 'dsh-svnrev-path' }, entry.path),
              entry.treeConflict === true
                && h('span', { className: 'dsh-svnrev-tag dsh-svnrev-tag-d' }, t('conflict')),
              statusTag(h, t, entry.item)))
              body.push(h('div', { className: 'dsh-svnrev-list', key: 'slist' }, rows))
            }
          }
        }
      } else if (revisionView === false && mode === 'history' && current !== null) {
        if (log.phase === 'loading') {
          body.push(h('div', { className: 'dsh-svnrev-muted', key: 'lload' }, t('loading')))
        } else if (log.phase === 'failed') {
          body.push(h('div', { className: 'dsh-svnrev-err', key: 'lfail' }, `${t('failed')}: ${log.message}`))
        } else if (log.phase === 'ready') {
          const revisions = log.payload.revisions ?? []
          if (revisions.length === 0) {
            body.push(h('div', { className: 'dsh-svnrev-muted', key: 'lnone' }, t('noHistory')))
          } else {
            body.push(h('div', { className: 'dsh-svnrev-muted', key: 'lcount' },
              t('revisionCount', { count: revisions.length })))
            const rows = revisions.map((revision) => {
              const files = revision.paths.map(entry => pathRow(entry, revision.revision, current.path))
              const message = revision.message.trim() === ''
                ? h('span', { className: 'dsh-svnrev-muted' }, t('emptyMessage'))
                : revision.message
              return h('div', { className: 'dsh-svnrev-rev', key: revision.revision },
                h('div', { className: 'dsh-svnrev-rev-head' },
                  h('span', { className: 'dsh-svnrev-rev-num' }, `r${String(revision.revision)}`),
                  h('span', { className: 'dsh-svnrev-muted' }, revision.author),
                  h('span', { className: 'dsh-svnrev-muted' }, when(revision.date))),
                h('div', { className: 'dsh-svnrev-msg' }, message),
                files)
            })
            body.push(h('div', { className: 'dsh-svnrev-list', key: 'llist' }, rows))
          }
        }
      }

      // The per-line menu, placed at the pointer that opened it. Right-clicking
      // a line number is both how the author lookup is opened and how it is
      // dismissed, so the same menu carries the close item whenever a lookup is
      // showing — the reader never has to hunt for a corner control.
      const menuNode = menu === null ? null : h('div', {
        className: 'dsh-svnrev-menu',
        style: { left: `${String(menu.x)}px`, top: `${String(menu.y)}px` },
        role: 'menu',
        key: 'linemenu',
        onClick: (event) => { event.stopPropagation() },
      },
      h('button', {
        type: 'button',
        className: 'dsh-svnrev-menu-item',
        role: 'menuitem',
        autoFocus: true,
        onClick: () => {
          const line = menu.line
          setMenu(null)
          setPicked(previous => (previous === null ? previous : { ...previous, activeLine: line }))
          void loadBlame()
        },
      }, t('menuBlame')),
      // Only offered while a lookup is on screen: an item that would do nothing
      // is worse than an absent one.
      picked !== null && picked.activeLine !== null && h('button', {
        type: 'button',
        className: 'dsh-svnrev-menu-item',
        role: 'menuitem',
        onClick: () => {
          setMenu(null)
          // Clearing `activeLine` hides the bar and un-highlights the row; the
          // file and its blame stay loaded, so reopening a line is free.
          setPicked(previous => (previous === null ? previous : { ...previous, activeLine: null }))
        },
      }, t('closeLineAuthor')))

      return h('div', { className: 'dsh-svnrev-root' },
        h('style', { key: 'css', dangerouslySetInnerHTML: { __html: css } }),
        body,
        menuNode)
    }

    return {
      inject: ['slots', 'locale', 'sidebarRightTabs', 'sidebarRight'],
      apply(ctx) {
        // Untyped per-locale registration: the namespace is owned by this plugin,
        // not by the compiled LocaleNamespaceMap.
        for (const [locale, dict] of Object.entries({ zh, en })) {
          ctx.effect(() => ctx.locale.register(NS, locale, dict), `svn-review: locale ${locale}`)
        }
        const t = ctx.locale.bind(NS)

        // Stage one: the tab type. A page type names no patterns and is opened by kind.
        ctx.effect(() => ctx.sidebarRightTabs.register({
          id: ID,
          kind: 'svn-review',
          priority: 'extension',
          keepMounted: true,
          title: () => t('tab'),
          guide: [{
            id: 'review',
            order: 40,
            title: () => t('title'),
            description: () => t('description'),
            icon: SvnMark,
          }],
        }), 'svn-review: tab type')

        // Stage two: the body and the chip, both keyed by the type's id.
        ctx.effect(() => ctx.slots.inject('sidebar.right.pane.tab', () => ctx.slots.register({
          name: 'sidebar.right.pane.tab',
          key: ID,
          locale: NS,
        }, SvnPanel)), 'svn-review: panel')

        ctx.effect(() => ctx.slots.inject('sidebar.right.pane.tab.title', () => ctx.slots.register({
          name: 'sidebar.right.pane.tab.title',
          key: ID,
          locale: NS,
        }, SvnTitle)), 'svn-review: title')

        // A session-header control, so the panel is reachable without first
        // opening the sidebar's own add menu. The `hooks` face is subscribed by
        // the framework, so the button follows tabs opening and closing.
        ctx.effect(() => ctx.slots.inject('conversation.session.header.utilities', () => ctx.slots.register({
          name: 'conversation.session.header.utilities',
          id: 'svn-review-open',
          order: 55,
          locale: NS,
          inject: () => ({
            open: () => { ctx.sidebarRight.openTab('svn-review') },
            hooks: { svnOpenTabs: ctx.sidebarRight.openTabs },
          }),
        }, SvnOpenButton)), 'svn-review: header action')
      },
    }
  },
})
