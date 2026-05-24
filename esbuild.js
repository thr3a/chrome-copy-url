import { context } from 'esbuild';
import fs from 'fs-extra';
import { glob } from 'glob';

const isProduction = process.env.NODE_ENV === 'production';

(async () => {
  const ctx = await context({
    entryPoints: ['js', 'ts', 'tsx'].map((x) => `src/**/*.${x}`),
    bundle: true,
    sourcemap: !isProduction,
    outdir: 'dist',
    target: 'es2022',
    logLevel: 'info',
    minify: !!isProduction
  });
  // await fs.remove('./dist');
  await fs.copy('./manifest.json', './dist/manifest.json');
  await fs.copy('./src/popup/popup.html', './dist/popup/popup.html');
  await fs.copy('./src/icons', './dist/icons');
  await ctx.rebuild();
  if (isProduction) {
    ctx.dispose();
  } else {
    await ctx.watch();
  }
})();
