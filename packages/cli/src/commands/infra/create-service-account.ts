import { Command } from '@commander-js/extra-typings';

import { safeExec } from '../../utils/safeExec';
import { createIamArgument } from './arguments/createIamArgument';

export const createServiceAccount = new Command()
  .command('create-service-account')
  .description('Creates a service account with the appropriate permissions')
  .addArgument(createIamArgument())
  .action((iam) => {
    const roles = [
      // Required for terraform to manage resource on GCP
      'roles/editor',
      // Required for terraform remote state bucket access as well as turborepo
      'roles/storage.objectAdmin',
      // Required for terraform to manage secrets
      'roles/secretmanager.admin',
      // Can create, update, and delete services and jobs, can get, list, delete job executions.
      // Can get and set IAM policies.
      // Can view, apply and dismiss recommendations.
      'roles/run.admin',
      // Giving permissiosn to create a token so that we can login to the artifact registry on github actions when using docker buildx (caching)
      'roles/iam.serviceAccountTokenCreator',
      // Gives access to manage IAM policies
      'roles/resourcemanager.projectIamAdmin',
      // Gives access to manage storage buckets
      'roles/storage.admin',
    ];
    console.log(`Creating service account ${iam.account} with roles ${roles} for ${iam.project}`);

    // Create the service account first
    safeExec(
      `gcloud iam service-accounts create ${iam.account} --project=${iam.project} --description="Github Actions service account for ${iam.project}"  --display-name="Github Actions service account for ${iam.project}"`
    );

    // Wait for service account to be fully created and available
    console.log(`Waiting for service account ${iam.iam} to be available...`);
    const maxRetries = 30;
    let retryCount = 0;
    let serviceAccountReady = false;

    while (retryCount < maxRetries && !serviceAccountReady) {
      try {
        safeExec(`gcloud iam service-accounts describe ${iam.iam} --project=${iam.project}`);
        serviceAccountReady = true;
        console.log(`Service account ${iam.iam} is ready`);
      } catch {
        retryCount++;
        if (retryCount >= maxRetries) {
          throw new Error(`Service account ${iam.iam} did not become available after ${maxRetries} attempts`);
        }
        console.log(`Service account not yet available, retrying in 2 seconds... (${retryCount}/${maxRetries})`);
        // Sleep for 2 seconds
        safeExec('sleep 2');
      }
    }

    // Now assign IAM policies
    console.log(`Assigning IAM policies to service account ${iam.iam}...`);
    roles.forEach((role) => {
      console.log(`Assigning role: ${role}`);
      safeExec(
        `gcloud projects add-iam-policy-binding ${iam.project} --member="serviceAccount:${iam.iam}" --role="${role}"`
      );
    });

    console.log(`Service account ${iam.iam} created successfully with all roles assigned`);
  });
