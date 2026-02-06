/* eslint-disable @typescript-eslint/no-explicit-any */
import { Command } from '@commander-js/extra-typings';
import prompts from 'prompts';

import { safeExec } from '../../utils/safeExec';
import { environments } from './constants/environments';
import { regions } from './constants/regions';
import { ensureDeps } from './util/ensureDeps';
import { projectName } from './util/projectName';
import { generateRandomHandle } from './util/randomHandle';

const getBillingAccounts = (organizationId: string) => {
  try {
    console.log('Getting billing accounts');
    const [stdout] = safeExec('gcloud billing accounts list --format json');
    const accounts = JSON.parse(stdout);
    return accounts
      .filter((account: any) => account.parent === `organizations/${organizationId}`)
      .map(({ displayName, name }: { displayName: string; name: string }) => ({
        title: `${displayName} (from org: ${organizationId})`,
        value: name.split('/')[1],
      }));
  } catch (e) {
    console.error(e);
    throw new Error(
      'You have to setup a billing account - follow the tutorial at https://cloud.google.com/billing/docs/how-to/create-billing-account'
    );
  }
};

const getOrganizations = () => {
  try {
    const [stdout] = safeExec('gcloud organizations list --format json');
    return JSON.parse(stdout).map(({ displayName, name }: { displayName: string; name: string }) => ({
      title: displayName,
      value: name.split('/')[1],
    }));
  } catch (e) {
    console.error(e);
    throw new Error(
      'You have to setup an organization - follow the tutorial at https://cloud.google.com/resource-manager/docs/creating-managing-organization'
    );
  }
};

const getFolders = (organizationId: string) => {
  try {
    const [stdout] = safeExec(`gcloud resource-manager folders list --organization=${organizationId} --format=json`);
    return JSON.parse(stdout).map(({ displayName, name }: { displayName: string; name: string }) => ({
      title: displayName,
      value: name.split('/')[1],
    }));
  } catch (e) {
    console.log(e);
    console.warn('No folders found or insufficient permissions');
    return [];
  }
};

const createFolder = (folderName: string, parentId: string, isOrganization: boolean): string => {
  try {
    const parentFlag = isOrganization ? `--organization=${parentId}` : `--folder=${parentId}`;
    const [stdout] = safeExec(
      `gcloud resource-manager folders create --display-name="${folderName}" ${parentFlag} --format="value(name)"`
    );
    const folderId = stdout.trim().split('/')[1] ?? '';
    console.log(`Created folder "${folderName}" with ID: ${folderId}`);
    return folderId;
  } catch (e) {
    console.error('Failed to create folder:', e);
    throw new Error(`Failed to create folder "${folderName}"`);
  }
};

const getAllFoldersRecursively = (
  organizationId: string,
  parentFolderId: string
): Array<{ title: string; value: string }> => {
  const getFoldersRecursive = (parentId: string, depth: number = 0): Array<{ title: string; value: string }> => {
    try {
      const command =
        parentId === organizationId
          ? `gcloud resource-manager folders list --organization=${organizationId} --format=json`
          : `gcloud resource-manager folders list --folder=${parentId} --format=json`;

      const [stdout] = safeExec(command);
      const folders = JSON.parse(stdout);

      let allFolders: Array<{ title: string; value: string }> = [];

      folders.forEach(({ displayName, name }: { displayName: string; name: string }) => {
        const folderId = name.split('/')[1] ?? '';
        allFolders.push({
          title: `${'  '.repeat(depth)}📁 ${displayName}`,
          value: folderId,
        });

        console.log(`Found folder ${displayName} with id ${folderId}`);
        console.log(`Checking child folders for ${displayName}`);

        // Recursively get child folders
        if (folderId) {
          const childFolders = getFoldersRecursive(folderId, depth + 1);
          allFolders = allFolders.concat(childFolders);
        }
      });

      return allFolders;
    } catch (e) {
      console.log(e);
      console.warn('No folders found or insufficient permissions');
      return [];
    }
  };

  return getFoldersRecursive(parentFolderId || organizationId);
};

export const init = new Command()
  .command('init')
  .description('Sets up the entire infrastructure')
  .action(async () => {
    ensureDeps();

    const projectUid = generateRandomHandle();

    console.log('Starting prompts...');

    const answers = await prompts(
      [
        {
          type: 'autocomplete',
          name: 'environment',
          initial: 'europe-west2',
          message: 'What environment do you want to setup?',
          choices: environments.map((v) => ({
            title: v,
            value: v,
          })),
        },
        {
          type: 'autocomplete',
          name: 'region',
          initial: 'europe-west2',
          message: 'In what region should we create the environment in?',
          choices: regions.map((v) => ({
            title: v,
            value: v,
          })),
        },
        {
          type: 'text',
          name: 'prefix',
          message: 'Please give a unique prefix for the projects we will setup in GCP',
          format: (val) => val.trim(),
          validate: (value: string) => {
            const prefix = value?.trim();
            if (!prefix || prefix.length < 1) {
              return 'Prefix can not be empty';
            }
            const longestEnvName = [...environments].sort()[0] ?? 'demo';
            const longestProjectName = projectName(prefix, projectUid, longestEnvName);
            const emptyProjectName = projectName('', projectUid, longestEnvName);
            if (longestProjectName.length > 30) {
              return `Prefix can not be longer than ${30 - emptyProjectName.length} characters`;
            }
            if (prefix.charAt(0) === prefix.charAt(0).toUpperCase()) {
              return 'Prefix can not start with an uppercase number';
            }
            if (prefix.match(/^\d/)) {
              return 'Prefix can not start with a number';
            }
            return true;
          },
        },
        {
          type: 'autocomplete',
          name: 'organizationId',
          choices: getOrganizations(),
          message: 'Which organization do you want to use?',
        },
        {
          type: 'autocomplete',
          name: 'parentFolderId',
          choices: (_prev: unknown, values: Record<string, string | undefined>) => getFolders(values.organizationId ?? ''),
          message: 'Which folder do you want to use? (optional)',
          initial: undefined,
        },
        {
          type: 'autocomplete',
          name: 'folderId',
          choices: (_prev: unknown, values: Record<string, string | undefined>) => {
            const folders = getAllFoldersRecursively(values.organizationId ?? '', values.parentFolderId ?? '');
            return [
              { title: '❌ No folder (create projects directly in organization)', value: '' },
              { title: '➕ Create a new folder', value: '__CREATE_NEW__' },
              ...folders,
            ];
          },
          message: 'Which folder do you want to use? (optional)',
          initial: undefined,
        },
        {
          type: (_prev: unknown) => _prev === '__CREATE_NEW__' ? 'text' : null,
          name: 'newFolderName',
          message: 'Enter the name for the new folder:',
          validate: (value: string) => {
            if (!value || value.trim().length < 1) {
              return 'Folder name cannot be empty';
            }
            return true;
          },
        },
        {
          type: 'autocomplete',
          name: 'billingAccountId',
          choices: (_prev: unknown, values: Record<string, string | undefined>) => getBillingAccounts(values.organizationId ?? ''),
          message: 'Which billing account do you want to use?',
        },
      ],
      {
        onCancel: () => {
          process.exit(1);
        },
      }
    );

    const { region, prefix, billingAccountId, organizationId, folderId, newFolderName, parentFolderId, environment } =
      answers;

    // Create new folder if requested
    let finalFolderId = folderId;
    if (folderId === '__CREATE_NEW__' && newFolderName) {
      const isOrganization = !parentFolderId;
      const parentId = parentFolderId || organizationId;
      finalFolderId = createFolder(newFolderName.trim(), parentId, isOrganization);
    }

    const environmentsToSetup = [environment];

    console.log(
      `We will now setup the following environments in region ${region} tied to the billing account ${billingAccountId}: `
    );
    environmentsToSetup.forEach((environment) => {
      const project = projectName(prefix, projectUid, environment);
      const iam = `github-actions@${project}.iam.gserviceaccount.com`;
      console.log(`* Environment = ${environment}, project = ${project}, iam = ${iam}`);
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

    console.log('Setting up environments', environmentsToSetup);

    environmentsToSetup.forEach((environment) => {
      const project = projectName(prefix, projectUid, environment);
      const iam = `github-actions@${project}.iam.gserviceaccount.com`;
      const bucket = `${project}-terraform-state-${Math.random().toString(36).substring(2, 10)}`;

      safeExec(`tf infra setup-project ${project} ${billingAccountId} ${organizationId} ${finalFolderId}`, false);
      try {
        safeExec(`tf infra create-service-account ${iam}`, false);
        safeExec(`tf infra create-service-account-keys ${iam}`, false);
        safeExec(`tf infra create-terraform-bucket ${iam} ${bucket}`, false);
        safeExec(`tf infra create-turborepo-bucket ${iam}`, false);
        safeExec(`tf infra create-container-registry ${iam}`, false);
        /**
         * Setup terraform locally
         */
        safeExec(`tf infra configure-terraform-vars-locally ${iam} ${region} ${prefix}`, false);
        safeExec(`tf infra configure-terraform-bucket-locally ${iam} ${bucket}`, false);
      } catch (e) {
        console.error('Failed configuring project access, deleting created project');
        safeExec(`gcloud projects delete ${project} --quiet`, false);
        throw e;
      }
    });
    console.log('Setting up github variables and secrets');
    const [githubAuthToken] = safeExec('gh auth token');

    const commands = [];

    // Create environment-specific variables
    environmentsToSetup.forEach((environment) => {
      commands.push(
        `gh variable set PROJECT_UID_${environment.toUpperCase()} --body '${projectUid}'`,
        `gh variable set PROJECT_PREFIX_${environment.toUpperCase()} --body '${prefix}'`,
        `gh variable set PROJECT_REGION_${environment.toUpperCase()} --body '${region}'`
      );
    });

    // Add GitHub token secret
    commands.push(`gh secret set GH_TOKEN --app actions --body '${githubAuthToken}'`);

    commands.map((command) => safeExec(command));
    console.log(
      'Projects created, now set the correct project id in the .env file in the core-api project for the environment you are creating and run deploy from github actions.'
    );
  });
