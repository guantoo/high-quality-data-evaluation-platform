import { randomBytes } from 'node:crypto';
import { readFile, writeFile, chmod } from 'node:fs/promises';
export async function localConnectorConfig() {
  let text = ''; try { text = await readFile('.dev.vars', 'utf8'); } catch (error) { if (error.code !== 'ENOENT') throw error; }
  const values = Object.fromEntries(text.split('\n').filter(line => /^[A-Z_]+=/.test(line)).map(line => { const i = line.indexOf('='); return [line.slice(0, i), line.slice(i + 1).replace(/^['"]|['"]$/g, '')]; }));
  const defaults = { DB_CONNECTOR_URL: 'http://127.0.0.1:8788', DB_CONNECTOR_TOKEN: randomBytes(32).toString('hex'), DB_CONNECTION_KEY: randomBytes(32).toString('base64') };
  let changed = false;
  for (const [name, fallback] of Object.entries(defaults)) { if (!values[name]) { values[name] = process.env[name] || fallback; text += `\n${name}=${values[name]}\n`; changed = true; } }
  if (changed) { await writeFile('.dev.vars', text, { mode: 0o600 }); await chmod('.dev.vars', 0o600); }
  return values;
}
