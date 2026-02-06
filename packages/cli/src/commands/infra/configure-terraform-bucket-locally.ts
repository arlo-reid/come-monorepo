import { Argument, Command } from '@commander-js/extra-typings';
import * as fs from 'fs';
import * as path from 'path';

import { createIamArgument } from './arguments/createIamArgument';

export const configureTerraformBucketLocally = new Command()
  .command('configure-terraform-bucket-locally')
  .description('Configures the local environment terraform remote state')
  .addArgument(createIamArgument())
  .addArgument(new Argument('<bucket>'))
  .action((iam, bucket) => {
    const filePath = path.resolve(__dirname, `../../../../../infra/envs/${iam.environment}/backend.tf`);
    fs.writeFileSync(
      filePath,
      `terraform {
  backend "gcs" {
    bucket = "${bucket}"
  }
}
    `
    );
  });
