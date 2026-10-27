// Dev bridge: browser → HTTP JSON → gRPC SduiTemplateService (hermes.widget.sduitemplate).
// Browsers cannot speak gRPC and s.dev.mservice.io is internal, so the call runs inside the Vite dev / preview
// server on the developer's machine (VPN required), like server.js does for GitLab.
//
// Endpoint: POST /grpc/sdui-template/generate-velocity-template
//   body:     { raw_json: string, dynamic_fields: [{ path, variable }], container_name?, loop_variable? }
//   response: GenerateVelocityTemplateResponse as JSON (snake_case, as in proto/sduitemplate.proto)
//
// Config (env): SDUI_GRPC_TARGET (default s.dev.mservice.io:443), SDUI_GRPC_INSECURE=1 for plaintext,
//               SDUI_GRPC_TIMEOUT_MS (default 20000).
import { fileURLToPath } from 'node:url'
import type { IncomingMessage, ServerResponse } from 'node:http'
import * as grpc from '@grpc/grpc-js'
import * as protoLoader from '@grpc/proto-loader'
import type { Plugin } from 'vite'

export const GENERATE_VELOCITY_PATH = '/grpc/sdui-template/generate-velocity-template'
const PROTO_FILE = fileURLToPath(new URL('../proto/sduitemplate.proto', import.meta.url))
const TARGET = process.env.SDUI_GRPC_TARGET || 's.dev.mservice.io:443'
const TIMEOUT_MS = Number(process.env.SDUI_GRPC_TIMEOUT_MS) || 20_000
const MAX_BODY_BYTES = 5 * 1024 * 1024

type Callback = (error: grpc.ServiceError | null, response: Record<string, unknown>) => void
interface SduiTemplateClient extends grpc.Client {
  GenerateVelocityTemplate(request: unknown, options: grpc.CallOptions, callback: Callback): void
}

let client: SduiTemplateClient | undefined
function getClient(): SduiTemplateClient {
  if (client) return client
  // keepCase: field names stay snake_case, the same JSON shape grpcurl prints.
  const definition = protoLoader.loadSync(PROTO_FILE, { keepCase: true, longs: String, enums: String, defaults: true, oneofs: true })
  const pkg = grpc.loadPackageDefinition(definition) as any
  const Service = pkg.hermes.widget.sduitemplate.SduiTemplateService
  const credentials = process.env.SDUI_GRPC_INSECURE === '1' ? grpc.credentials.createInsecure() : grpc.credentials.createSsl()
  client = new Service(TARGET, credentials) as SduiTemplateClient
  return client
}

function readJson(request: IncomingMessage): Promise<any> {
  return new Promise((resolve, reject) => {
    let size = 0
    const chunks: Buffer[] = []
    request.on('data', (chunk: Buffer) => {
      size += chunk.length
      if (size > MAX_BODY_BYTES) { reject(new Error('Request body too large')); request.destroy(); return }
      chunks.push(chunk)
    })
    request.on('end', () => { try { resolve(JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}')) } catch { reject(new Error('Body is not valid JSON')) } })
    request.on('error', reject)
  })
}

function send(response: ServerResponse, status: number, body: unknown) {
  response.statusCode = status
  response.setHeader('Content-Type', 'application/json; charset=utf-8')
  response.end(JSON.stringify(body))
}

async function handle(request: IncomingMessage, response: ServerResponse) {
  if (request.method !== 'POST') return send(response, 405, { error: 'Use POST' })
  let body: any
  try { body = await readJson(request) } catch (error) { return send(response, 400, { error: (error as Error).message }) }
  if (typeof body.raw_json !== 'string' || !body.raw_json) return send(response, 400, { error: 'raw_json (string) is required' })
  const fields = Array.isArray(body.dynamic_fields) ? body.dynamic_fields : []
  const grpcRequest = {
    raw_json: body.raw_json,
    dynamic_fields: fields.map((field: any) => ({ path: String(field?.path ?? ''), variable: String(field?.variable ?? '') })),
    ...(typeof body.container_name === 'string' && body.container_name ? { container_name: body.container_name } : {}),
    ...(typeof body.loop_variable === 'string' && body.loop_variable ? { loop_variable: body.loop_variable } : {}),
  }
  let service: SduiTemplateClient
  try { service = getClient() } catch (error) { return send(response, 500, { error: `Cannot load proto: ${(error as Error).message}` }) }
  service.GenerateVelocityTemplate(grpcRequest, { deadline: Date.now() + TIMEOUT_MS }, (error, result) => {
    if (error) {
      const unreachable = error.code === grpc.status.UNAVAILABLE || error.code === grpc.status.DEADLINE_EXCEEDED
      return send(response, 502, {
        error: unreachable ? `Không kết nối được ${TARGET} (cần VPN?): ${error.details || error.message}` : error.details || error.message,
        grpc_code: grpc.status[error.code] ?? error.code,
      })
    }
    send(response, 200, result)
  })
}

/** Vite plugin: serves the bridge in `vite` (dev) and `vite preview`. */
export function sduiTemplateBridge(): Plugin {
  const mount = (middlewares: { use: (path: string, handler: (req: IncomingMessage, res: ServerResponse) => void) => void }) =>
    middlewares.use(GENERATE_VELOCITY_PATH, (req, res) => { void handle(req, res) })
  // The hooks must return nothing: Vite calls a returned function as a post hook, and `use()` returns the
  // connect app (a function), which then crashes with "Cannot read properties of undefined (reading 'url')".
  return {
    name: 'sdui-template-grpc-bridge',
    configureServer(server) { mount(server.middlewares) },
    configurePreviewServer(server) { mount(server.middlewares) },
  }
}
