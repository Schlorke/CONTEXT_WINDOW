import path from "node:path";
import {
  buildReplayTemplate,
  ensureDir,
  evalResultsDir,
  loadEvalMatrix,
  writeJson,
} from "./skill-eval-utils.mjs";

const environment = process.argv[2];
const outputArg = process.argv[3];

if (!environment) {
  console.error(
    "Usage: node scripts/init-skill-replay.mjs <environment> [output-file]",
  );
  process.exit(1);
}

const evalMatrix = loadEvalMatrix();
const outputPath = path.resolve(
  outputArg ?? path.join(evalResultsDir, `${environment}.json`),
);

ensureDir(path.dirname(outputPath));
writeJson(outputPath, buildReplayTemplate(evalMatrix, environment));

console.log(`Created replay template for ${environment} at ${outputPath}`);
