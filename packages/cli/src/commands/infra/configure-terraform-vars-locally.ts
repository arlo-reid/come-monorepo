import { Argument, Command } from '@commander-js/extra-typings';
import * as fs from 'fs';
import * as path from 'path';

import { createIamArgument } from './arguments/createIamArgument';

export const configureTerraformVarsLocally = new Command()
  .command('configure-terraform-vars-locally')
  .description('Configures the local environment terraform vars')
  .addArgument(createIamArgument())
  .addArgument(new Argument('<region>'))
  .addArgument(new Argument('<prefix>'))
  .action((iam, region, prefix) => {
    try {
      if (!path || !path.resolve) {
        throw new Error('Path module not properly loaded');
      }

      const filePath = path.resolve(__dirname, `../../../../../infra/envs/${iam.environment}/terraform.tfvars`);

      if (!filePath) {
        throw new Error('Failed to resolve file path');
      }

      fs.writeFileSync(
        filePath,
        `region  = "${region}"
        project = "${iam.project}"
        docker_tag = "latest"
        prefix = "${prefix}"
        `
      );
    } catch (error) {
      console.error('Error in configure-terraform-vars-locally:', error);
      throw error;
    }
  });
