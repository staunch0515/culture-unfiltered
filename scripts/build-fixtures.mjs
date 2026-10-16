// Builds a second copy of the site into dist-fixtures/ with test fixture content
// layered on top of the real content. Used only by the test suite.
import { execSync } from 'node:child_process';
execSync('npx astro build', {
  stdio: 'inherit',
  env: { ...process.env, CU_FIXTURES: '1', CU_OUT_DIR: './dist-fixtures' },
});
