// Strict argument parser: unknown options and unexpected positionals are errors.
import path from "node:path";
import { fileURLToPath } from "node:url";

export class UsageError extends Error {}

/** True when the module at `moduleUrl` is the script node was started with (not an import). */
export function isDirectRun(moduleUrl) {
  if (!process.argv[1]) return false;
  const invoked = path.resolve(process.argv[1]);
  const self = fileURLToPath(moduleUrl);
  return process.platform === "win32"
    ? invoked.toLowerCase() === self.toLowerCase()
    : invoked === self;
}

/**
 * @param {string[]} argv
 * @param {Record<string, {type: "boolean"|"string"|"list"}>} spec
 * @param {{positionals?: number}} [options]
 */
export function parseArgs(argv, spec, options = {}) {
  const maxPositionals = options.positionals ?? 0;
  const values = {};
  const positionals = [];
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--") continue;
    if (!arg.startsWith("--")) {
      positionals.push(arg);
      continue;
    }
    const eq = arg.indexOf("=");
    const name = eq === -1 ? arg.slice(2) : arg.slice(2, eq);
    const def = spec[name];
    if (!def) throw new UsageError(`Unknown option --${name}`);
    if (def.type === "boolean") {
      if (eq !== -1)
        throw new UsageError(`Option --${name} does not take a value`);
      values[name] = true;
      continue;
    }
    let value;
    if (eq !== -1) value = arg.slice(eq + 1);
    else {
      value = argv[i + 1];
      i += 1;
    }
    if (value === undefined || value === "" || value.startsWith("--")) {
      throw new UsageError(`Option --${name} requires a value`);
    }
    if (def.type === "list") {
      values[name] = [
        ...(values[name] ?? []),
        ...value
          .split(",")
          .map((v) => v.trim())
          .filter(Boolean),
      ];
    } else {
      if (name in values)
        throw new UsageError(`Option --${name} given more than once`);
      values[name] = value;
    }
  }
  if (positionals.length > maxPositionals) {
    throw new UsageError(
      `Unexpected argument "${positionals[maxPositionals]}". Paths must be passed with an explicit option such as --target <dir>.`,
    );
  }
  return { values, positionals };
}
