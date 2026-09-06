import { test } from "node:test";
import assert from "node:assert/strict";
import { PERSONAS } from "./personas.js";

test("persona list is non-empty and each entry has required fields", () => {
  assert.ok(PERSONAS.length >= 3, "expected at least 3 personas for the demo");

  for (const persona of PERSONAS) {
    assert.equal(typeof persona.name, "string");
    assert.ok(persona.name.length > 0);

    assert.equal(typeof persona.voice, "string");
    assert.ok(persona.voice.length > 0);

    assert.ok(Array.isArray(persona.priorities));
    assert.ok(persona.priorities.length > 0);
    for (const priority of persona.priorities) {
      assert.equal(typeof priority, "string");
      assert.ok(priority.length > 0);
    }
  }
});

test("persona names are unique", () => {
  const names = PERSONAS.map((p) => p.name);
  assert.equal(new Set(names).size, names.length);
});
