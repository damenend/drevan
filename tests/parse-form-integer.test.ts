import assert from "node:assert/strict";
import { test } from "node:test";
import { parseFormInteger } from "../src/utils/parse-form-integer";

test("form numbers accept zero, digit strings, and the largest safe integer", () => {
  assert.equal(parseFormInteger(0), 0);
  assert.equal(parseFormInteger("0042"), 42);
  assert.equal(
    parseFormInteger(Number.MAX_SAFE_INTEGER),
    Number.MAX_SAFE_INTEGER,
  );
  assert.equal(
    parseFormInteger(String(Number.MAX_SAFE_INTEGER)),
    Number.MAX_SAFE_INTEGER,
  );
});

test("form numbers reject coercion, noninteger formats, and overflow", () => {
  const invalidValues = [
    undefined,
    null,
    true,
    ["1"],
    "",
    " 1 ",
    "1.0",
    "1e3",
    "-1",
    -1,
    1.5,
    Infinity,
    Number.MAX_SAFE_INTEGER + 1,
    String(Number.MAX_SAFE_INTEGER + 1),
  ];

  for (const value of invalidValues) {
    assert.equal(
      parseFormInteger(value),
      null,
      `unexpectedly accepted ${String(value)}`,
    );
  }
});
