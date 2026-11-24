/**
 * Persistence on SQLite (Node's built-in node:sqlite, no native build step).
 * Every entity is a row in `docs` (collection, id, JSON). The server keeps the live state in memory
 * and writes only the rows that changed after each mutation.
 */
import { DatabaseSync } from 'node:sqlite'
import { mkdirSync } from 'node:fs'
import { dirname } from 'node:path'
import type { State } from '../src/store/types'

const COLLECTIONS = ['riders', 'drivers', 'trips', 'promos', 'tickets', 'notices', 'categories', 'payments'] as const
type Coll = (typeof COLLECTIONS)[number]
const keyOf = (c: Coll, d: Record<string, unknown>) => String(c === 'promos' ? d.code : d.id)

export class Store {
  db: DatabaseSync
  private cache = new Map<string, string>()

  constructor(file: string) {
    if (file !== ':memory:') mkdirSync(dirname(file), { recursive: true })
    this.db = new DatabaseSync(file)
    this.db.exec(`
      PRAGMA journal_mode = WAL;
      CREATE TABLE IF NOT EXISTS docs (coll TEXT NOT NULL, id TEXT NOT NULL, data TEXT NOT NULL, PRIMARY KEY (coll, id));
      CREATE TABLE IF NOT EXISTS kv (k TEXT PRIMARY KEY, v TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS otp (phone TEXT NOT NULL, role TEXT NOT NULL, code_hash TEXT NOT NULL, expires INTEGER NOT NULL, attempts INTEGER NOT NULL DEFAULT 0, sent_at INTEGER NOT NULL, PRIMARY KEY (phone, role));
    `)
  }

  kvGet(k: string): string | undefined {
    const r = this.db.prepare('SELECT v FROM kv WHERE k = ?').get(k) as { v: string } | undefined
    return r?.v
  }
  kvSet(k: string, v: string) {
    this.db.prepare('INSERT INTO kv (k, v) VALUES (?, ?) ON CONFLICT(k) DO UPDATE SET v = excluded.v').run(k, v)
  }

  load(): State | null {
    const meta = this.kvGet('meta')
    if (!meta) return null
    const m = JSON.parse(meta) as Pick<State, 'v' | 'settings' | 'log'>
    const s = { ...m, me: { riderId: '', driverId: '', riderSignedIn: false, driverSignedIn: false } } as State
    for (const c of COLLECTIONS) {
      const rows = this.db.prepare('SELECT id, data FROM docs WHERE coll = ?').all(c) as { id: string; data: string }[]
      ;(s as unknown as Record<string, unknown[]>)[c] = rows.map((r) => {
        this.cache.set(`${c}/${r.id}`, r.data)
        return JSON.parse(r.data)
      })
    }
    // newest first, as the app expects
    s.trips.sort((a, b) => b.requestedAt - a.requestedAt)
    s.payments.sort((a, b) => b.at - a.at)
    s.tickets.sort((a, b) => b.at - a.at)
    s.notices.sort((a, b) => b.at - a.at)
    return s
  }

  /** Writes changed / new / deleted rows in one transaction. */
  save(s: State) {
    const up = this.db.prepare('INSERT INTO docs (coll, id, data) VALUES (?, ?, ?) ON CONFLICT(coll, id) DO UPDATE SET data = excluded.data')
    const del = this.db.prepare('DELETE FROM docs WHERE coll = ? AND id = ?')
    this.db.exec('BEGIN')
    try {
      const seen = new Set<string>()
      for (const c of COLLECTIONS) {
        for (const d of (s as unknown as Record<string, Record<string, unknown>[]>)[c]) {
          const id = keyOf(c, d)
          const k = `${c}/${id}`
          seen.add(k)
          const json = JSON.stringify(d)
          if (this.cache.get(k) !== json) {
            up.run(c, id, json)
            this.cache.set(k, json)
          }
        }
      }
      for (const k of [...this.cache.keys()]) {
        if (!seen.has(k)) {
          const [c, ...rest] = k.split('/')
          del.run(c, rest.join('/'))
          this.cache.delete(k)
        }
      }
      this.kvSet('meta', JSON.stringify({ v: s.v, settings: s.settings, log: s.log }))
      this.db.exec('COMMIT')
    } catch (e) {
      this.db.exec('ROLLBACK')
      throw e
    }
  }
}
