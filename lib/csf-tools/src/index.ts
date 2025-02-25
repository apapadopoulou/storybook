import fs from 'fs-extra';
import mdx from '@mdx-js/mdx';

import { loadCsf } from './CsfFile';
import { createCompiler } from './mdx';

export const readCsfOrMdx = async (fileName: string) => {
  let code = (await fs.readFile(fileName, 'utf-8')).toString();
  if (fileName.endsWith('.mdx')) {
    code = await mdx(code, { compilers: [createCompiler({})] });
  }
  return loadCsf(code);
};

export * from './CsfFile';
