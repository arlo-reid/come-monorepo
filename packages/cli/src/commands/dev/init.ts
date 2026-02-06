import fs from 'node:fs';
import path from 'node:path';

import { Command } from '@commander-js/extra-typings';
import prompts from 'prompts';

import { safeExec } from '../../utils/safeExec';
import { projectName } from '../infra/util/projectName';

const environmentToLoadFrom = 'dev';

const secretMap: Record<string, string> = {
  CLERK_ISSUER: 'clerk_issuer',
  CLERK_JWSK_URL: 'clerk_jwsk_url',
  CLERK_PUBLISHABLE_KEY: 'clerk_publishable_key',
  CLERK_SECRET_KEY: 'clerk_secret_key',
};

const parseEnvFile = (content: string): Record<string, string> => {
  const result: Record<string, string> = {};
  content.split('\n').forEach((line) => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const eqIndex = trimmed.indexOf('=');
      if (eqIndex !== -1) {
        const key = trimmed.slice(0, eqIndex).trim();
        let value = trimmed.slice(eqIndex + 1).trim();
        // Remove surrounding quotes if present
        if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
          value = value.slice(1, -1);
        }
        result[key] = value;
      }
    }
  });
  return result;
};

const stringifyEnvFile = (obj: Record<string, string>): string => {
  return Object.entries(obj)
    .map(([key, value]) => `${key}=${value}`)
    .join('\n');
};

const apply = (exampleConfig: Record<string, string>, secretValues: Record<string, string>): Record<string, string> => {
  const result: Record<string, string> = {
    ...exampleConfig,
  };
  for (const key of Object.keys(secretValues)) {
    if (key in exampleConfig) {
      const value = secretValues[key];
      if (value !== undefined) {
        result[key] = value;
      }
    }
  }
  return result;
};

export const init = new Command()
  .command('init')
  .description(`Sets up .env files with values from ${environmentToLoadFrom}`)
  .action(async () => {
    const filePath = path.resolve(__dirname, `../../../../../apps`);
    const apps = fs.readdirSync(filePath);
    const prefix = safeExec(`gh variable list | grep PROJECT_PREFIX | awk -F ' ' '{print $2}'`).join('').trim();
    const projectUid = safeExec(`gh variable list | grep PROJECT_UID | awk -F ' ' '{print $2}'`).join('').trim();
    const project = projectName(prefix, projectUid, environmentToLoadFrom);
    console.log(`This script loads all configured secret values from ${environmentToLoadFrom} secret manager`);
    console.log('and merges them with the values from .env.example');
    console.log('and then overwrites the .env files with the final results');
    console.log(`Files that will be overwritten/created:`);
    apps.forEach((app) => {
      console.log(`* /apps/${app}/.env`);
    });
    const { confirm } = await prompts(
      {
        type: 'confirm',
        name: 'confirm',
        message: 'Continue?',
        initial: false,
      },
      {
        onCancel: () => process.exit(1),
      }
    );
    if (!confirm) {
      process.exit(1);
    }

    const secretValues: Record<string, string> = {};
    for (const key of Object.keys(secretMap)) {
      const secret = safeExec(`gcloud secrets versions access latest --secret ${secretMap[key]} --project ${project}`)
        .join('')
        .trim();
      secretValues[key] = secret;
    }
    apps.forEach((app) => {
      const envExampleFile = path.resolve(filePath, `${app}/.env.example`);
      const envExample = parseEnvFile(fs.readFileSync(envExampleFile, 'utf-8'));
      const env = apply(envExample, secretValues);
      fs.writeFileSync(path.resolve(filePath, `${app}/.env`), stringifyEnvFile(env));
    });
    console.log('Finished');
  });
