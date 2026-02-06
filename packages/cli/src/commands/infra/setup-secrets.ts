import { Command } from '@commander-js/extra-typings';
import prompts from 'prompts';

import { safeExec } from '../../utils/safeExec';

import { createEnvironmentArgument } from './arguments/createEnvironmentArgument';
import { projectName } from './util/projectName';

const secretMap: Record<string, string> = {
  CLERK_ISSUER: 'clerk_issuer',
  CLERK_JWSK_URL: 'clerk_jwsk_url',
  CLERK_PUBLISHABLE_KEY: 'clerk_publishable_key',
  CLERK_SECRET_KEY: 'clerk_secret_key',
};

export const setupSecrets = new Command()
  .command('setup-secrets')
  .description('Sets up secrets for the environment')
  .addArgument(createEnvironmentArgument())
  .action(async (environment) => {
    const prefix = safeExec(`gh variable list | grep PROJECT_PREFIX |awk -F ' ' '{print $2}'`).join('').trim();
    const projectUid = safeExec(`gh variable list | grep PROJECT_UID |awk -F ' ' '{print $2}'`).join('').trim();
    const project = projectName(prefix, projectUid, environment);
    console.log(`Setting up secret values for ${project}`);
    const questions = Object.keys(secretMap).map((envValue): prompts.PromptObject<string> => {
      return {
        type: 'text',
        name: envValue,
        message: `[${environment}] Please enter the value for ${envValue}`,
        format: (val) => val.trim(),
      };
    });
    const answers = await prompts(questions, {
      onCancel: () => {
        process.exit(1);
      },
    });
    for (const [envValue, secretName] of Object.entries(secretMap)) {
      safeExec(
        `printf "${answers[envValue]}" | gcloud secrets versions add ${secretName} --project=${project} --data-file=-`
      );
    }
  });
