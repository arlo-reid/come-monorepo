/**
 * OpenAPI to Bruno Collection Generator
 *
 * Fetches OpenAPI spec from a running server and generates Bruno .bru files.
 *
 * Usage:
 *   npx tsx scripts/generate-bruno.ts
 *   API_BASE_URL=https://staging.example.com npx tsx scripts/generate-bruno.ts
 */

import * as fs from 'fs';
import * as path from 'path';

interface OpenApiSpec {
  openapi: string;
  info: {
    title: string;
    version: string;
  };
  paths: Record<string, PathItem>;
  components?: {
    schemas?: Record<string, Schema>;
  };
}

interface PathItem {
  get?: Operation;
  post?: Operation;
  put?: Operation;
  patch?: Operation;
  delete?: Operation;
}

interface Operation {
  operationId?: string;
  summary?: string;
  description?: string;
  tags?: string[];
  parameters?: Parameter[];
  requestBody?: RequestBody;
  responses?: Record<string, Response>;
}

interface Parameter {
  name: string;
  in: 'path' | 'query' | 'header';
  required?: boolean;
  schema?: Schema;
  example?: unknown;
}

interface RequestBody {
  content?: {
    'application/json'?: {
      schema?: Schema;
    };
  };
}

interface Response {
  description?: string;
}

interface Schema {
  type?: string;
  properties?: Record<string, Schema>;
  example?: unknown;
  $ref?: string;
}

const BASE_URL = process.env.API_BASE_URL || 'http://localhost:8000';
const OUTPUT_DIR = path.join(__dirname, '../collections/core-api');

function toKebabCase(str: string): string {
  return str
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .replace(/[\s_]+/g, '-')
    .toLowerCase();
}

function getMethodName(method: string, operationId?: string, path?: string): string {
  if (operationId) {
    return toKebabCase(operationId);
  }
  // Generate from path and method
  const cleanPath = path?.replace(/[{}]/g, '').replace(/\//g, '-') || '';
  return `${method}${cleanPath}`;
}

function resolveRef(spec: OpenApiSpec, ref: string): Schema | undefined {
  const parts = ref.replace('#/', '').split('/');
  let current: unknown = spec;
  for (const part of parts) {
    current = (current as Record<string, unknown>)?.[part];
  }
  return current as Schema | undefined;
}

function generateExampleBody(
  spec: OpenApiSpec,
  schema: Schema | undefined,
): Record<string, unknown> | undefined {
  if (!schema) return undefined;

  if (schema.$ref) {
    schema = resolveRef(spec, schema.$ref);
    if (!schema) return undefined;
  }

  if (schema.example) {
    return schema.example as Record<string, unknown>;
  }

  if (schema.properties) {
    const result: Record<string, unknown> = {};
    for (const [key, prop] of Object.entries(schema.properties)) {
      if (prop.example !== undefined) {
        result[key] = prop.example;
      } else if (prop.type === 'string') {
        result[key] = `example-${key}`;
      } else if (prop.type === 'number' || prop.type === 'integer') {
        result[key] = 0;
      } else if (prop.type === 'boolean') {
        result[key] = false;
      }
    }
    return result;
  }

  return undefined;
}

function generateBruFile(
  method: string,
  urlPath: string,
  operation: Operation,
  spec: OpenApiSpec,
  seq: number,
): string {
  const name =
    operation.summary || getMethodName(method, operation.operationId, urlPath);

  // Convert path params from {param} to {{param}}
  const bruPath = urlPath.replace(/{(\w+)}/g, '{{$1}}');

  // Build the .bru file content
  let content = `meta {
  name: ${name}
  type: http
  seq: ${seq}
}

${method} {
  url: {{baseUrl}}${bruPath}
  body: ${operation.requestBody ? 'json' : 'none'}
  auth: bearer
}
`;

  // Add auth
  content += `
auth:bearer {
  token: {{authToken}}
}
`;

  // Add request body if present
  if (operation.requestBody?.content?.['application/json']?.schema) {
    const schema = operation.requestBody.content['application/json'].schema;
    const exampleBody = generateExampleBody(spec, schema);
    if (exampleBody) {
      content += `
body:json {
  ${JSON.stringify(exampleBody, null, 2).split('\n').join('\n  ')}
}
`;
    }
  }

  // Add assertions based on responses
  const successCodes = Object.keys(operation.responses || {}).filter(
    (code) => code.startsWith('2'),
  );
  if (successCodes.length > 0) {
    const expectedStatus = successCodes[0];
    content += `
assert {
  res.status: eq ${expectedStatus}
}
`;
  }

  // Add documentation
  if (operation.description) {
    content += `
docs {
  ${operation.description}
}
`;
  }

  return content;
}

async function fetchOpenApiSpec(): Promise<OpenApiSpec> {
  const url = `${BASE_URL}/api/docs/json`;
  console.log(`Fetching OpenAPI spec from: ${url}`);

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch OpenAPI spec: ${response.statusText}`);
  }

  return response.json();
}

function ensureDir(dir: string): void {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

async function generateBrunoCollection(): Promise<void> {
  const spec = await fetchOpenApiSpec();

  console.log(`\nAPI: ${spec.info.title} v${spec.info.version}`);
  console.log(`Found ${Object.keys(spec.paths).length} paths\n`);

  // Group endpoints by tag
  const byTag: Record<string, { method: string; path: string; operation: Operation }[]> = {};

  for (const [urlPath, pathItem] of Object.entries(spec.paths)) {
    const methods = ['get', 'post', 'put', 'patch', 'delete'] as const;

    for (const method of methods) {
      const operation = pathItem[method];
      if (!operation) continue;

      const tag = operation.tags?.[0] || 'default';
      const tagKey = toKebabCase(tag);

      if (!byTag[tagKey]) {
        byTag[tagKey] = [];
      }

      byTag[tagKey].push({ method, path: urlPath, operation });
    }
  }

  // Generate files for each tag
  let totalGenerated = 0;

  for (const [tag, endpoints] of Object.entries(byTag)) {
    const tagDir = path.join(OUTPUT_DIR, tag);
    ensureDir(tagDir);

    console.log(`\n📁 ${tag}/`);

    let seq = 1;
    for (const { method, path: urlPath, operation } of endpoints) {
      const fileName = `${getMethodName(method, operation.operationId, urlPath)}.bru`;
      const filePath = path.join(tagDir, fileName);

      const content = generateBruFile(method, urlPath, operation, spec, seq);
      fs.writeFileSync(filePath, content);

      console.log(`   ✅ ${fileName}`);
      seq++;
      totalGenerated++;
    }
  }

  console.log(`\n✨ Generated ${totalGenerated} Bruno request files`);
  console.log(`   Output: ${OUTPUT_DIR}`);
}

// Run the generator
generateBrunoCollection().catch((error) => {
  console.error('Error generating Bruno collection:', error.message);
  process.exit(1);
});
