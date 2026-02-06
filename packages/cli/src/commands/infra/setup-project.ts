import { Command } from '@commander-js/extra-typings';

import { safeExec } from '../../utils/safeExec';

export const setupProject = new Command()
  .command('setup-project')
  .description('Sets up the project in GCP')
  .argument('<project>', 'Project name')
  .argument('<billing-account-id>', 'What billing account to use (gcloud beta billing accounts list)')
  .argument('<organizationId>', 'Which organization to use')
  .argument('[folderId]', 'Which folder to use (optional)')
  .argument('[folderName]', 'Which folder to use')
  .action((project, billingAccountId, organizationId, folderId) => {
    console.log('Creating project', project);
    const parentFlag = folderId ? `--folder=${folderId}` : `--organization=${organizationId}`;
    safeExec(`gcloud projects create ${project} ${parentFlag}`);
    try {
      console.log('Configuring project');
      console.log('Linking billing account');
      safeExec(`gcloud billing projects link ${project} --billing-account=${billingAccountId}`);

      console.log('Enabling services');
      safeExec(`gcloud services enable cloudresourcemanager.googleapis.com --project=${project}`);
      safeExec(`gcloud services enable sqladmin.googleapis.com --project=${project}`);
      safeExec(`gcloud services enable secretmanager.googleapis.com --project=${project}`);
      safeExec(`gcloud services enable iam.googleapis.com --project=${project}`);
    } catch (e) {
      console.error('Failed configuring project, deleting created project');
      safeExec(`gcloud projects delete ${project} --quiet`, false);
      throw e;
    }
  });
