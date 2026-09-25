#!/usr/bin/env node
// Roteador mínimo da família Blender. Lê só o registry (metadados).
// Não carrega SKILL.md. "oi" devolve lista vazia.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const registry = JSON.parse(
  fs.readFileSync(path.join(here, "..", "references", "registry.json"), "utf8"),
);

function norm(value) {
  return value.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase().trim();
}

export function routeBlenderSkills(prompt) {
  const text = norm(prompt);
  if (/^(oi|ola|hello|hey|e ai)[.!?\s]*$/.test(text)) return [];
  if (/\b(spline|rive)\b/.test(text) && !/\b(blender|bpy)\b/.test(text))
    return [];

  const load = [];
  for (const [name, skill] of Object.entries(registry.skills)) {
    const hit = (skill.load_when || []).some((token) =>
      text.includes(norm(token)),
    );
    if (hit) load.push(name);
  }

  for (const rule of registry.suppress || []) {
    const pattern = new RegExp(rule.when || rule.when_all?.join("|") || "$^");
    if (rule.when && pattern.test(text)) {
      const index = load.indexOf(rule.skill);
      if (index >= 0) load.splice(index, 1);
    }
    if (
      rule.when_all &&
      rule.when_all.every((part) => new RegExp(part).test(text))
    ) {
      const index = load.indexOf(rule.skill);
      if (index >= 0) load.splice(index, 1);
    }
  }
  return load;
}

const selfTest = [
  ["oi", []],
  ["melhore o material", ["blender-materials"]],
  ["anime as asas", ["blender-animation"]],
  ["o rig está deformando", ["blender-rigging", "blender-debug"]],
  ["otimize este modelo para minha landing page", ["blender-web3d"]],
  ["exporte para GLB preservando as animações", ["blender-web3d"]],
  [
    "analise este personagem rigged e mostre a estrutura do rig sem modificar nada",
    ["blender-scene-inspection", "blender-rigging"],
  ],
  ["melhore a iluminação sem alterar materiais", ["blender-lighting"]],
  ["anime a esfera no spline", []],
  [
    "analise por que esta animação está artificial e corrija timing e spacing",
    ["blender-animation", "blender-debug"],
  ],
];

function same(a, b) {
  return a.length === b.length && a.every((item, i) => item === b[i]);
}

const isDirect =
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isDirect) {
  const arg = process.argv.slice(2).join(" ");
  if (!arg || arg === "--self-test") {
    const failures = [];
    for (const [prompt, expected] of selfTest) {
      const got = routeBlenderSkills(prompt);
      if (!same(got, expected))
        failures.push(`${prompt} => ${got.join(", ") || "(vazio)"}`);
    }
    if (failures.length) {
      console.error(failures.join("\n"));
      process.exit(1);
    }
    console.log("ok " + selfTest.length + " routes");
  } else {
    console.log(JSON.stringify(routeBlenderSkills(arg)));
  }
}
