import { Argument, InvalidArgumentError } from '@commander-js/extra-typings';

import { environments } from '../constants/environments';

type Iam = {
  account: string;
  project: string;
  environment: (typeof environments)[number];
  iam: string;
};

export const createIamArgument = () => {
  return new Argument('<iam>', 'IAM in the format of <account>@<project>.iam.gserviceaccount.com').argParser(
    (iam): Iam => {
      try {
        const [account, host] = iam.split('@');
        if (!host) {
          throw new InvalidArgumentError('Not a valid IAM.');
        }
        const [project] = host.split('.');
        if (!account || !project) {
          throw new InvalidArgumentError('Not a valid IAM.');
        }
        const environment = project.split('-')[2] as (typeof environments)[number];
        if (!environments.includes(environment)) {
          throw new InvalidArgumentError('Not a valid IAM.');
        }
        return { account, project, iam, environment };
      } catch (e) {
        console.error(e);
        throw new InvalidArgumentError('Not a valid IAM.');
      }
    }
  );
};
