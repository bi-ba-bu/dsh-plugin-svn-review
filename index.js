/**
 * Host half of the SVN review plugin.
 *
 * Serves four read-only routes that read SVN working copies under the user's
 * workspace and hand the results to the browser half:
 *
 *   GET svn-review/projects  — working copies found under a workspace root
 *   GET svn-review/status    — local modifications of one working copy + its diff
 *   GET svn-review/log       — recent revisions with their changed paths
 *   GET svn-review/diff      — the unified diff of one file at one revision
 *
 * Two SVN quirks drive the implementation:
 *
 * 1. `svn.exe` on Windows receives `argv` through the ANSI code page, so any
 *    non-ASCII path passed as an argument is mangled. Every command therefore
 *    runs with `cwd` set to the working copy and names targets relative to it,
 *    and single-file revision diffs use the repository-relative `^/` URL with
 *    percent-encoded segments instead of a file-system path.
 * 2. `svn` writes UTF-8 to stdout even on a non-UTF-8 console, so output is
 *    decoded as UTF-8 rather than as the process code page.
 *
 * Every route accepts only requests that pass the connection trust fence, and
 * `root`/`wc` are confined to registered workspaces.
 */

import { spawn } from 'node:child_process'
import { readFile, stat } from 'node:fs/promises'
import { basename, join } from 'node:path'

/** Route paths (absolute, as `ctx.webServer` registers them). */
const WORKSPACES_PATH = '/svn-review/workspaces'
const PROJECTS_PATH = '/svn-review/projects'
const STATUS_PATH = '/svn-review/status'
const LOG_PATH = '/svn-review/log'
const DIFF_PATH = '/svn-review/diff'
const FILE_PATH = '/svn-review/file'
const BLAME_PATH = '/svn-review/blame'

/** Clamp a configured number into its accepted range, falling back on a non-number. */
function bounded(value, fallback, min, max) {
  const number = typeof value === 'number' ? value : Number(value)
  if (!Number.isFinite(number)) return fallback
  return Math.min(Math.max(Math.trunc(number), min), max)
}

/**
 * Resolve the row's raw config into the shape the routes use.
 *
 * This bundle declares no `Config` schema: a schema would need a dependency on
 * the Host's schema package, which a locally installed bundle does not resolve
 * from the DSH installation. The defaults in the patch therefore stay
 * authoritative, and this function only validates them.
 * @param config - the patch row's raw configuration.
 * @returns resolved limits and paths.
 */
function resolveConfig(config) {
  const raw = config !== null && typeof config === 'object' ? config : {}
  return {
    svnPath: typeof raw.svnPath === 'string' && raw.svnPath.trim() !== '' ? raw.svnPath.trim() : 'svn',
    scanDepth: bounded(raw.scanDepth, 3, 1, 8),
    logLimit: bounded(raw.logLimit, 30, 1, 200),
    maxOutputBytes: bounded(raw.maxOutputBytes, 8 * 1024 * 1024, 1024, 64 * 1024 * 1024),
    timeoutMs: bounded(raw.timeoutMs, 45_000, 1000, 600_000),
  }
}

/** Route carrier and the trust fence guarding every route. */
export const inject = ['webServer', 'connection']

/**
 * One SVN invocation's collected output.
 *
 * With `binary` the collected `stdout` is a Buffer and the byte cap is applied
 * to bytes; otherwise it is UTF-8 text. `svn cat` must be fetched as bytes
 * because a working copy may hold GBK-encoded sources, which a fixed UTF-8
 * decode would destroy before the caller could detect it.
 */
async function run(command, args, cwd, limits, signal, binary = false) {
  return await new Promise((resolve) => {
    /** @type {string | Buffer} */
    let stdout = binary ? Buffer.alloc(0) : ''
    let stderr = ''
    let settled = false
    let truncated = false
    const child = spawn(command, args, {
      cwd,
      windowsHide: true,
      // Keep the child's own locale from turning progress messages into noise.
      env: { ...process.env, LC_ALL: 'C', LANG: 'C' },
      signal,
    })
    const timer = setTimeout(() => {
      if (!settled) {
        try { child.kill() } catch { /* already gone */ }
      }
    }, limits.timeoutMs)
    const finish = (outcome) => {
      if (settled) return
      settled = true
      clearTimeout(timer)
      resolve({ ...outcome, stdout, stderr, truncated })
    }
    if (!binary) child.stdout.setEncoding('utf8')
    child.stderr.setEncoding('utf8')
    child.stdout.on('data', (chunk) => {
      if (binary) {
        const bytes = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)
        if (stdout.length >= limits.maxOutputBytes) { truncated = true; return }
        stdout = Buffer.concat([stdout, bytes])
        if (stdout.length > limits.maxOutputBytes) {
          stdout = stdout.subarray(0, limits.maxOutputBytes)
          truncated = true
          try { child.kill() } catch { /* already gone */ }
        }
        return
      }
      if (stdout.length >= limits.maxOutputBytes) { truncated = true; return }
      stdout += chunk
      if (stdout.length > limits.maxOutputBytes) {
        stdout = stdout.slice(0, limits.maxOutputBytes)
        truncated = true
        try { child.kill() } catch { /* already gone */ }
      }
    })
    child.stderr.on('data', (chunk) => {
      if (stderr.length < 16 * 1024) stderr += chunk
    })
    child.on('error', (error) => { finish({ exitCode: null, failure: error.message }) })
    child.on('close', (code) => { finish({ exitCode: code, failure: undefined }) })
  })
}

/**
 * Decode a working-copy file the way its author's editor most likely wrote it:
 * UTF-8 when the bytes are valid UTF-8, otherwise GBK, which is what a Chinese
 * Windows checkout commonly holds. A wrong guess shows replacement characters,
 * so UTF-8 is only accepted when strictly valid.
 */
function decodeBytes(buffer) {
  try {
    return { text: new TextDecoder('utf-8', { fatal: true }).decode(buffer), encoding: 'utf-8' }
  } catch {
    try {
      return { text: new TextDecoder('gbk').decode(buffer), encoding: 'gbk' }
    } catch {
      return { text: new TextDecoder('utf-8').decode(buffer), encoding: 'utf-8' }
    }
  }
}

/** Whether a byte buffer looks binary (a NUL in the first 8 KiB). */
function looksBinary(buffer) {
  const limit = Math.min(buffer.length, 8192)
  for (let index = 0; index < limit; index += 1) {
    if (buffer[index] === 0) return true
  }
  return false
}

/** Parse `svn blame --xml` output into one attribution per line. */
function parseBlame(xml) {
  const entries = []
  const pattern = /<entry\s+line-number="(\d+)"[^>]*>([\s\S]*?)<\/entry>/g
  let match
  while ((match = pattern.exec(xml)) !== null) {
    const body = match[2]
    const commit = /<commit\b([^>]*)>([\s\S]*?)<\/commit>/.exec(body)
    entries.push({
      line: Number(match[1]),
      revision: commit === null ? null : Number(attr(commit[1], 'revision') ?? 0),
      author: commit === null ? '' : (element(commit[2], 'author') ?? ''),
      date: commit === null ? '' : (element(commit[2], 'date') ?? ''),
    })
  }
  return entries
}

/** Read one XML attribute's value from a raw attribute string. */
function attr(tagText, name) {
  const match = new RegExp(`${name}="([^"]*)"`).exec(tagText)
  return match === null ? undefined : decodeXml(match[1])
}

/** Undo the five XML entities SVN emits. */
function decodeXml(text) {
  return text
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>')
    .replaceAll('&quot;', '"')
    .replaceAll('&apos;', "'")
    .replaceAll('&amp;', '&')
}

/** Text of the first `<name>…</name>` element in a fragment. */
function element(fragment, name) {
  const match = new RegExp(`<${name}>([\\s\\S]*?)</${name}>`).exec(fragment)
  return match === null ? undefined : decodeXml(match[1])
}

/** Parse `svn info --xml` output for one working copy. */
function parseInfo(xml) {
  const entry = /<entry[\s\S]*?>([\s\S]*?)<\/entry>/.exec(xml)
  if (entry === null) return undefined
  const body = entry[1]
  const wcInfo = element(body, 'wc-info') ?? ''
  return {
    revision: attr(entry[0], 'revision'),
    url: element(body, 'url'),
    repositoryRoot: element(body, 'root'),
    relativeUrl: element(body, 'relative-url'),
    wcRoot: element(wcInfo, 'wcroot-abspath'),
  }
}

/** Parse `svn status --xml` output into changed paths. */
function parseStatus(xml) {
  const entries = []
  const pattern = /<entry\s+path="([^"]*)">([\s\S]*?)<\/entry>/g
  let match
  while ((match = pattern.exec(xml)) !== null) {
    const body = match[2]
    const wcStatus = /<wc-status\b([^>]*)>/.exec(body)
    if (wcStatus === null) continue
    const treeConflict = /<tree-conflict\b/.test(body)
    entries.push({
      path: decodeXml(match[1]),
      // `item` is the schedule/modification kind: modified, added, deleted, unversioned…
      item: attr(wcStatus[0], 'item') ?? 'normal',
      props: attr(wcStatus[0], 'props') ?? 'none',
      copied: attr(wcStatus[0], 'copied') === 'true',
      treeConflict,
    })
  }
  return entries
}

/** Parse `svn log -v --xml` output into revisions carrying their changed paths. */
function parseLog(xml) {
  const revisions = []
  const pattern = /<logentry\s+revision="([^"]*)">([\s\S]*?)<\/logentry>/g
  let match
  while ((match = pattern.exec(xml)) !== null) {
    const body = match[2]
    const paths = []
    const pathPattern = /<path\b([^>]*)>([\s\S]*?)<\/path>/g
    let pathMatch
    while ((pathMatch = pathPattern.exec(body)) !== null) {
      paths.push({
        action: attr(pathMatch[1], 'action') ?? 'M',
        kind: attr(pathMatch[1], 'kind') ?? 'file',
        path: decodeXml(pathMatch[2]),
      })
    }
    revisions.push({
      revision: Number(match[1]),
      author: element(body, 'author') ?? '',
      date: element(body, 'date') ?? '',
      message: element(body, 'msg') ?? '',
      paths,
    })
  }
  return revisions
}

/** Split one working-copy diff into per-file chunks keyed by their relative path. */
function splitDiff(text) {
  /** @type {Map<string, string>} */
  const chunks = new Map()
  if (text === '') return chunks
  const lines = text.split('\n')
  let current
  let buffer = []
  const flush = () => {
    if (current !== undefined) chunks.set(current, buffer.join('\n'))
    buffer = []
  }
  for (const line of lines) {
    if (line.startsWith('Index: ')) {
      flush()
      current = line.slice('Index: '.length).trim()
      buffer = [line]
      continue
    }
    // A separator line introduces every file's diff; keep it out of the body.
    if (line.startsWith('====') && buffer.length === 1) continue
    buffer.push(line)
  }
  flush()
  return chunks
}

/** Percent-encode each segment of a repository-relative path for use in a `^/` URL. */
function encodeRepoPath(repoPath) {
  return repoPath
    .split('/')
    .map(segment => encodeURIComponent(segment))
    .join('/')
}

/** Whether `target` is `parent` or lives below it. */
function isWithin(target, parent) {
  const normalise = value => value.replaceAll('\\', '/').replace(/\/+$/, '').toLowerCase()
  const child = normalise(target)
  const base = normalise(parent)
  return child === base || child.startsWith(`${base}/`)
}

/** JSON response helper. */
function sendJson(res, status, payload) {
  res.statusCode = status
  res.setHeader('content-type', 'application/json; charset=utf-8')
  res.setHeader('cache-control', 'no-store')
  res.end(JSON.stringify(payload))
}

/**
 * Register the read-only SVN routes.
 * @param ctx - Host context carrying the web server and the trust fence.
 * @param rawConfig - the patch row's raw configuration.
 */
export function apply(ctx, rawConfig) {
  const config = resolveConfig(rawConfig)
  const limits = {
    maxOutputBytes: config.maxOutputBytes,
    timeoutMs: config.timeoutMs,
  }

  /** The workspaces this plugin may read: the registry's paths, or none when it is absent. */
  const workspaceRoots = () => {
    const registry = ctx.get('workspaceRegistry')
    if (registry === undefined) return undefined
    try {
      return registry.list().map(workspace => workspace.path)
    } catch {
      return undefined
    }
  }

  /**
   * The registered workspace a Session belongs to.
   *
   * The panel is scoped to the workspace the conversation lives in, so one
   * Session — not the whole registry — decides what is listed. DSH already
   * keeps that mapping: `Workspace.sessionIds` is the registry's canonical-cwd
   * header index, so it is asked first. Directory containment is only the
   * fallback for a Session the index has not recorded yet, and there the
   * LONGEST matching root wins so a nested workspace beats its parent.
   * @param sessionId - the panel's own `sessionId` prop.
   * @returns the owning workspace, or undefined when it cannot be resolved.
   */
  const workspaceOfSession = (sessionId) => {
    if (typeof sessionId !== 'string' || sessionId === '') return undefined
    const registry = ctx.get('workspaceRegistry')
    if (registry === undefined) return undefined
    let workspaces
    try {
      workspaces = registry.list()
    } catch {
      return undefined
    }
    const indexed = workspaces.find(workspace => (workspace.sessionIds ?? []).includes(sessionId))
    if (indexed !== undefined) return indexed
    const sessions = ctx.get('sessions')
    const workingDirectory = ctx.get('workingDirectory')
    let directory
    try {
      const session = sessions === undefined ? undefined : sessions.get(sessionId)
      if (session !== undefined) {
        // The committed directory is authoritative; the Session's own header is
        // the fallback when the directory service is unavailable.
        directory = workingDirectory === undefined
          ? session.header.cwd
          : workingDirectory.get(session)
      }
    } catch {
      directory = undefined
    }
    if (directory === undefined || directory === '') return undefined
    const matches = workspaces.filter(workspace => isWithin(directory, workspace.path))
    if (matches.length === 0) return undefined
    matches.sort((left, right) => right.path.length - left.path.length)
    return matches[0]
  }

  /** Answer an untrusted request; true when it was rejected. */
  const rejected = (req, res) => {
    const connection = ctx.get('connection')
    if (connection === undefined) return false
    const rejection = connection.requestRejection(req)
    if (rejection === undefined) return false
    res.statusCode = rejection
    res.end()
    return true
  }

  /** Confine an absolute directory to the registered workspaces. */
  const permitted = (path) => {
    if (typeof path !== 'string' || path === '') return false
    const roots = workspaceRoots()
    // Without a registry the fence is the connection trust check alone: this is
    // a local, authenticated tool, and refusing every path would break it.
    if (roots === undefined) return true
    return roots.some(root => isWithin(path, root))
  }

  /** Read the query parameters of one request. */
  const query = (req) => new URL(String(req.url), 'http://localhost').searchParams

  /** Run one SVN command in a working copy, mapping failures to a route payload. */
  const svn = async (args, cwd, signal) => {
    const outcome = await run(config.svnPath, args, cwd, limits, signal)
    if (outcome.failure !== undefined) {
      return { ok: false, code: 'svn-unavailable', message: outcome.failure }
    }
    if (outcome.exitCode !== 0 && outcome.stdout.trim() === '') {
      return {
        ok: false,
        code: 'svn-failed',
        message: (outcome.stderr || `svn exited with ${String(outcome.exitCode)}`).trim(),
      }
    }
    return { ok: true, stdout: outcome.stdout, truncated: outcome.truncated }
  }

  ctx.effect(() => ctx.webServer.register({
    kind: 'exact',
    path: PROJECTS_PATH,
    handler: async (req, res) => {
      if (rejected(req, res)) return
      const params = query(req)
      const sessionId = params.get('session') ?? ''
      const requested = params.get('root') ?? ''
      // A panel is scoped to ONE workspace: the one its own Session lives in.
      // Scanning the whole registry would list other checkouts (and other
      // branches of the same repository) in a panel that is meant to describe
      // this conversation's tree.
      const owner = workspaceOfSession(sessionId)
      let roots
      if (requested !== '') {
        if (!permitted(requested)) {
          sendJson(res, 400, { ok: false, code: 'forbidden-path', message: 'root is outside every workspace' })
          return
        }
        roots = [requested]
      } else if (owner !== undefined) {
        roots = [owner.path]
      } else {
        // No owning workspace is not permission to widen the search. A Session
        // outside every registered workspace, or a request that named no Session
        // at all, gets an explicit empty answer: scanning the whole registry
        // would fill a panel that describes one conversation with unrelated
        // checkouts, and the reader has no way to tell that happened.
        sendJson(res, 200, {
          ok: true,
          root: '',
          roots: [],
          workspace: null,
          reason: sessionId === '' ? 'no-session' : 'not-in-workspace',
          projects: [],
        })
        return
      }
      if (roots.length === 0) {
        sendJson(res, 200, { ok: true, root: '', roots: [], workspace: null, projects: [] })
        return
      }
      const controller = new AbortController()
      req.on('close', () => { controller.abort() })
      /** @type {Array<Record<string, unknown>>} */
      const found = []
      for (const root of roots) {
        await scanRoot(root, found, controller.signal)
      }
      sendJson(res, 200, {
        ok: true,
        root: roots[0],
        roots,
        workspace: owner === undefined
          ? null
          : { id: owner.id, path: owner.path, title: owner.title ?? '' },
        projects: found,
      })
    },
  }), `svn-review: GET ${PROJECTS_PATH}`)

  /**
   * Breadth-first scan of one root for working copies, pruned below each hit.
   * @param root - absolute workspace directory.
   * @param found - accumulator for every working copy discovered.
   * @param signal - request lifetime.
   */
  async function scanRoot(root, found, signal) {
    const { readdir } = await import('node:fs/promises')
    /** @type {Array<{ path: string, depth: number }>} */
    const pending = [{ path: root, depth: 0 }]
    let scanned = 0
    while (pending.length > 0 && found.length < 40 && scanned < 400) {
      const next = pending.shift()
      if (next === undefined) break
      scanned += 1
      if (signal.aborted) return
      let hasSvn = false
      try {
        hasSvn = (await stat(join(next.path, '.svn'))).isDirectory()
      } catch {
        hasSvn = false
      }
      if (hasSvn) {
        const info = await svn(['info', '--xml', '--non-interactive'], next.path, signal)
        const parsed = info.ok ? parseInfo(info.stdout) : undefined
        // `relative` is the whole path from the workspace root down to this
        // working copy, so `service` and `web/service` name different projects
        // instead of colliding on the bare directory name.
        const relative = next.path.slice(root.length).replaceAll('\\', '/').replace(/^\/+/, '')
        found.push({
          path: next.path,
          root,
          name: next.path.replaceAll('\\', '/').split('/').pop() ?? next.path,
          relative,
          // A display label that spells the chain out: workspace name, then the
          // relative path to the working copy.
          label: relative === ''
            ? basename(root.replaceAll('\\', '/')) || basename(next.path)
            : `${basename(root.replaceAll('\\', '/'))}/${relative}`,
          revision: parsed?.revision ?? null,
          url: parsed?.url ?? null,
          relativeUrl: parsed?.relativeUrl ?? null,
          error: info.ok ? null : info.message,
        })
        // A working copy's own children are its content, not further projects.
        continue
      }
      if (next.depth >= config.scanDepth) continue
      let names = []
      try {
        names = await readdir(next.path)
      } catch {
        names = []
      }
      for (const name of names) {
        if (name === '.svn' || name === 'node_modules' || name.startsWith('.')) continue
        pending.push({ path: join(next.path, name), depth: next.depth + 1 })
      }
    }
  }

  ctx.effect(() => ctx.webServer.register({
    kind: 'exact',
    path: WORKSPACES_PATH,
    handler: async (req, res) => {
      if (rejected(req, res)) return
      sendJson(res, 200, { ok: true, roots: workspaceRoots() ?? [] })
    },
  }), `svn-review: GET ${WORKSPACES_PATH}`)

  ctx.effect(() => ctx.webServer.register({
    kind: 'exact',
    path: STATUS_PATH,
    handler: async (req, res) => {
      if (rejected(req, res)) return
      const wc = query(req).get('wc') ?? ''
      if (!permitted(wc)) {
        sendJson(res, 400, { ok: false, code: 'forbidden-path', message: 'wc is outside every workspace' })
        return
      }
      const controller = new AbortController()
      req.on('close', () => { controller.abort() })
      const info = await svn(['info', '--xml', '--non-interactive'], wc, controller.signal)
      if (!info.ok) {
        sendJson(res, 200, { ok: false, code: info.code, message: info.message })
        return
      }
      const status = await svn(['status', '--xml', '--non-interactive'], wc, controller.signal)
      // One whole-working-copy diff avoids per-file arguments, which cannot carry
      // non-ASCII names on Windows; its chunks are the per-file diffs.
      const diff = await svn(['diff', '--non-interactive'], wc, controller.signal)
      const chunks = diff.ok ? splitDiff(diff.stdout) : new Map()
      const files = (status.ok ? parseStatus(status.stdout) : []).map((entry) => ({
        ...entry,
        diff: chunks.get(entry.path.replaceAll('\\', '/')) ?? null,
      }))
      sendJson(res, 200, {
        ok: true,
        info: parseInfo(info.stdout),
        files,
        diffTruncated: diff.ok ? diff.truncated : false,
        diffError: diff.ok ? null : diff.message,
        statusError: status.ok ? null : status.message,
      })
    },
  }), `svn-review: GET ${STATUS_PATH}`)

  ctx.effect(() => ctx.webServer.register({
    kind: 'exact',
    path: LOG_PATH,
    handler: async (req, res) => {
      if (rejected(req, res)) return
      const params = query(req)
      const wc = params.get('wc') ?? ''
      if (!permitted(wc)) {
        sendJson(res, 400, { ok: false, code: 'forbidden-path', message: 'wc is outside every workspace' })
        return
      }
      const limit = Math.min(Number(params.get('limit') ?? config.logLimit) || config.logLimit, 200)
      const controller = new AbortController()
      req.on('close', () => { controller.abort() })
      const info = await svn(['info', '--xml', '--non-interactive'], wc, controller.signal)
      if (!info.ok) {
        sendJson(res, 200, { ok: false, code: info.code, message: info.message })
        return
      }
      const log = await svn(
        ['log', '-v', '--xml', '--non-interactive', '-l', String(limit)],
        wc,
        controller.signal,
      )
      if (!log.ok) {
        sendJson(res, 200, { ok: false, code: log.code, message: log.message })
        return
      }
      const parsed = parseInfo(info.stdout)
      sendJson(res, 200, {
        ok: true,
        info: parsed,
        // Repository paths arrive repo-absolute (`/trunk/…`); the client needs
        // them relative to the working copy's own URL to match local files.
        revisions: parseLog(log.stdout).map(revision => ({
          ...revision,
          paths: revision.paths.map((entry) => {
            const base = parsed?.relativeUrl?.replace(/^\^/, '') ?? ''
            const relative = base !== '' && entry.path.startsWith(base)
              ? entry.path.slice(base.length).replace(/^\/+/, '')
              : entry.path.replace(/^\/+/, '')
            return { ...entry, relative }
          }),
        })),
      })
    },
  }), `svn-review: GET ${LOG_PATH}`)

  ctx.effect(() => ctx.webServer.register({
    kind: 'exact',
    path: DIFF_PATH,
    handler: async (req, res) => {
      if (rejected(req, res)) return
      const params = query(req)
      const wc = params.get('wc') ?? ''
      if (!permitted(wc)) {
        sendJson(res, 400, { ok: false, code: 'forbidden-path', message: 'wc is outside every workspace' })
        return
      }
      const repositoryPath = params.get('path') ?? ''
      const revision = params.get('rev') ?? ''
      if (repositoryPath === '' || !/^\d+$/.test(revision)) {
        sendJson(res, 400, { ok: false, code: 'bad-request', message: 'path and numeric rev are required' })
        return
      }
      const controller = new AbortController()
      req.on('close', () => { controller.abort() })
      // The `^/` form names a repository path, whose segments survive percent
      // encoding as ASCII — the only way a non-ASCII name reaches svn.exe intact.
      const url = `^/${encodeRepoPath(repositoryPath.replace(/^\/+/, ''))}@${revision}`
      const diff = await svn(
        ['diff', '--non-interactive', '-c', revision, url],
        wc,
        controller.signal,
      )
      if (!diff.ok) {
        sendJson(res, 200, { ok: false, code: diff.code, message: diff.message })
        return
      }
      sendJson(res, 200, { ok: true, diff: diff.stdout, truncated: diff.truncated })
    },
  }), `svn-review: GET ${DIFF_PATH}`)

  /**
   * Derive what a `path` parameter means inside one working copy.
   *
   * The client always sends a repository-absolute path (`/trunk/…`), because
   * that is what `svn log -v` reports. Two derived forms are needed: the
   * working-copy-relative path used for local disk reads, and the `^/…` URL used
   * for every `svn` call — `svn.exe` on Windows cannot receive a non-ASCII
   * argument, so a Chinese file name only ever reaches it percent-encoded.
   * @param wc - absolute working copy directory.
   * @param repositoryPath - repo-absolute path from the client.
   * @param relativeUrl - the working copy's own `^/…` URL.
   * @returns the derived paths, or undefined when the path escapes the copy.
   */
  const locate = (wc, repositoryPath, relativeUrl) => {
    const clean = repositoryPath.replace(/^\/+/, '')
    if (clean === '' || clean.includes('://') || clean.split('/').includes('..')) return undefined
    const base = (relativeUrl ?? '').replace(/^\^/, '').replace(/^\/+/, '')
    if (base === '') return undefined
    if (clean !== base && !clean.startsWith(`${base}/`)) return undefined
    return {
      relative: clean.slice(base.length).replace(/^\/+/, ''),
      repository: clean,
      url: `^/${encodeRepoPath(clean)}`,
      ascii: /^[\u0000-\u007f]*$/.test(clean),
    }
  }

  /** Read one working copy's own identity, or undefined when it cannot be read. */
  const workingCopy = async (wc, signal) => {
    const info = await svn(['info', '--xml', '--non-interactive'], wc, signal)
    if (!info.ok) return { failure: { ok: false, code: info.code, message: info.message } }
    const parsed = parseInfo(info.stdout)
    return parsed === undefined
      ? { failure: { ok: false, code: 'svn-failed', message: 'svn info returned no entry' } }
      : { info: parsed }
  }

  /**
   * Name the one SVN failure worth its own explanation: a path that does not
   * exist at the requested revision, which is normal for a file that was still
   * unborn (or already deleted) at that point in history.
   */
  const revisionFailure = (message, revision) => {
    const missing = /W160013|W170000|E195012|path not found|non-existent in revision/i.test(message)
    return missing
      ? { ok: false, code: 'not-in-revision', revision, message }
      : { ok: false, code: 'svn-failed', message }
  }

  /**
   * Read one file as the repository holds it at `revision`.
   *
   * `svn cat` is fetched as bytes and decoded afterwards, because a working copy
   * may hold GBK-encoded sources that a fixed UTF-8 decode would destroy.
   * @returns the route payload for this file.
   */
  const readRepository = async (resolved, wc, revision, signal) => {
    const cat = await run(
      config.svnPath,
      ['cat', '--non-interactive', `${resolved.url}@${revision}`],
      wc,
      limits,
      signal,
      true,
    )
    if (cat.failure !== undefined) return { ok: false, code: 'svn-unavailable', message: cat.failure }
    if (cat.exitCode !== 0 && cat.stdout.length === 0) {
      return revisionFailure(
        (cat.stderr || `svn exited with ${String(cat.exitCode)}`).trim(),
        revision,
      )
    }
    const bytes = Buffer.isBuffer(cat.stdout) ? cat.stdout : Buffer.from(String(cat.stdout))
    if (looksBinary(bytes)) {
      return {
        ok: true,
        source: 'repository',
        revision,
        binary: true,
        size: bytes.length,
        content: '',
        lines: 0,
        encoding: null,
        truncated: cat.truncated,
      }
    }
    const decoded = decodeBytes(bytes)
    return {
      ok: true,
      source: 'repository',
      revision,
      binary: false,
      size: bytes.length,
      content: decoded.text,
      lines: decoded.text.split('\n').length,
      encoding: decoded.encoding,
      truncated: cat.truncated,
    }
  }

  ctx.effect(() => ctx.webServer.register({
    kind: 'exact',
    path: FILE_PATH,
    handler: async (req, res) => {
      if (rejected(req, res)) return
      const params = query(req)
      const wc = params.get('wc') ?? ''
      if (!permitted(wc)) {
        sendJson(res, 400, { ok: false, code: 'forbidden-path', message: 'wc is outside every workspace' })
        return
      }
      const controller = new AbortController()
      req.on('close', () => { controller.abort() })
      const identity = await workingCopy(wc, controller.signal)
      if (identity.failure !== undefined) {
        sendJson(res, 200, identity.failure)
        return
      }
      const resolved = locate(wc, params.get('path') ?? '', identity.info.relativeUrl)
      if (resolved === undefined) {
        sendJson(res, 400, { ok: false, code: 'forbidden-path', message: 'path is outside this working copy' })
        return
      }
      const requested = params.get('rev') ?? ''
      const revision = /^\d+$/.test(requested) ? requested : identity.info.revision
      // A local change is best shown as it is on disk; a revision is shown as
      // the repository holds it. `rev` is what tells the two apart.
      if (requested !== '') {
        sendJson(res, 200, await readRepository(resolved, wc, revision, controller.signal))
        return
      }
      try {
        const bytes = await readFile(join(wc, resolved.relative))
        // A minified bundle or a log file would otherwise be handed to the
        // panel whole; the cap keeps one click from stalling the renderer.
        const clipped = bytes.length > config.maxOutputBytes
        const kept = clipped ? bytes.subarray(0, config.maxOutputBytes) : bytes
        const binary = looksBinary(kept)
        if (binary) {
          sendJson(res, 200, {
            ok: true,
            source: 'working',
            revision: identity.info.revision,
            binary: true,
            size: bytes.length,
            content: '',
            lines: 0,
            encoding: null,
            truncated: clipped,
          })
          return
        }
        const decoded = decodeBytes(kept)
        sendJson(res, 200, {
          ok: true,
          source: 'working',
          revision: identity.info.revision,
          binary: false,
          size: bytes.length,
          content: decoded.text,
          lines: decoded.text.split('\n').length,
          encoding: decoded.encoding,
          truncated: clipped,
        })
      } catch (error) {
        const code = error !== null && typeof error === 'object' ? error.code : undefined
        // A `deleted` or `missing` file has no bytes on disk. The baseline in the
        // repository is then the only thing to show, and saying so is better
        // than an ENOENT error the reader can do nothing with.
        if (code === 'ENOENT') {
          const fallback = await readRepository(resolved, wc, revision, controller.signal)
          sendJson(res, 200, fallback.ok === true
            ? { ...fallback, source: 'baseline', note: 'missing-locally' }
            : fallback)
          return
        }
        sendJson(res, 200, {
          ok: false,
          code: 'read-failed',
          message: `${resolved.relative}: ${error instanceof Error ? error.message : String(error)}`,
        })
      }
    },
  }), `svn-review: GET ${FILE_PATH}`)

  ctx.effect(() => ctx.webServer.register({
    kind: 'exact',
    path: BLAME_PATH,
    handler: async (req, res) => {
      if (rejected(req, res)) return
      const params = query(req)
      const wc = params.get('wc') ?? ''
      if (!permitted(wc)) {
        sendJson(res, 400, { ok: false, code: 'forbidden-path', message: 'wc is outside every workspace' })
        return
      }
      const controller = new AbortController()
      req.on('close', () => { controller.abort() })
      const identity = await workingCopy(wc, controller.signal)
      if (identity.failure !== undefined) {
        sendJson(res, 200, identity.failure)
        return
      }
      const resolved = locate(wc, params.get('path') ?? '', identity.info.relativeUrl)
      if (resolved === undefined) {
        sendJson(res, 400, { ok: false, code: 'forbidden-path', message: 'path is outside this working copy' })
        return
      }
      const requested = params.get('rev') ?? ''
      const revision = /^\d+$/.test(requested) ? requested : identity.info.revision
      // Blame inherits the same ASCII-only argument rule as every other call.
      // An ASCII name can be blamed in place, which covers local, uncommitted
      // lines; any other name is blamed through its URL, so its attribution
      // describes the committed text and `source` says so.
      const inPlace = requested === '' && resolved.ascii && resolved.relative !== ''
      let blame = inPlace
        ? await svn(['blame', '--xml', '--non-interactive', resolved.relative], wc, controller.signal)
        : undefined
      let source = 'repository'
      if (blame === undefined || !blame.ok) {
        // A `deleted` or `missing` file cannot be blamed in place; the URL form
        // still describes the committed text, which is the useful answer here.
        blame = await svn(['blame', '--xml', '--non-interactive', `${resolved.url}@${revision}`], wc, controller.signal)
      } else {
        source = 'working'
      }
      if (!blame.ok) {
        sendJson(res, 200, { ok: false, code: blame.code, message: blame.message })
        return
      }
      const entries = parseBlame(blame.stdout)
      sendJson(res, 200, {
        ok: true,
        source,
        revision,
        entries,
        truncated: blame.truncated,
      })
    },
  }), `svn-review: GET ${BLAME_PATH}`)
}
