import { defineConfig, type Plugin } from 'vite';
import { execSync } from 'node:child_process';

// Every build gets an id (git commit + time). It's baked into the game and written to
// version.json, so installed copies can tell when a newer version has been published.
function buildId() {
  let sha = 'local';
  try {
    sha = execSync('git rev-parse --short HEAD').toString().trim();
  } catch {
    /* not a git checkout */
  }
  return `${sha}-${Date.now().toString(36)}`;
}

const BUILD_ID = process.env.NODE_ENV === 'production' || process.argv.includes('build') ? buildId() : 'dev';

function versionFile(): Plugin {
  return {
    name: 'version-file',
    apply: 'build',
    generateBundle() {
      this.emitFile({ type: 'asset', fileName: 'version.json', source: JSON.stringify({ build: BUILD_ID }) });
    },
  };
}

export default defineConfig({
  base: './',
  server: { port: 5173 },
  build: { chunkSizeWarningLimit: 2000 },
  define: { __BUILD_ID__: JSON.stringify(BUILD_ID) },
  plugins: [versionFile()],
});
