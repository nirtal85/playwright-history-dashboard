import { expect, test } from "@playwright/test";

test("smoke passing test appears in history", async () => {
  expect(1 + 1).toBe(2);
});

test("smoke failing test appears in history", async () => {
  expect("actual").toBe("expected");
});