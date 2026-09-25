// Deterministic path membership across path.win32 and path.posix (no runner OS oracle).
import assert from "node:assert/strict";
import path from "node:path";
import { describe, test } from "node:test";
import { isInside } from "../scripts/lib/fsx.mjs";

describe("path portability (win32 + posix)", () => {
  test("posix: child under root is inside; sibling and absolute escape are outside", () => {
    const root = "/tmp/sandbox/acceptance";
    assert.equal(
      isInside(root, "/tmp/sandbox/acceptance/run/product", path.posix),
      true,
    );
    assert.equal(isInside(root, "/tmp/sandbox/acceptance", path.posix), true);
    assert.equal(
      isInside(root, "/tmp/sandbox/other/project", path.posix),
      false,
    );
    assert.equal(isInside(root, "/outside/store", path.posix), false);
  });

  test("win32: child under root is inside; other drive and users path are outside", () => {
    const root = "C:\\Temp\\cw-r3\\acceptance";
    assert.equal(
      isInside(
        root,
        "C:\\Temp\\cw-r3\\acceptance\\run-abc\\product\\produto",
        path.win32,
      ),
      true,
    );
    assert.equal(
      isInside(root, "C:\\Temp\\cw-r3\\acceptance", path.win32),
      true,
    );
    assert.equal(
      isInside(root, "C:\\Users\\someone\\real-project", path.win32),
      false,
    );
    assert.equal(isInside(root, "D:\\outside\\store", path.win32), false);
    assert.equal(
      isInside(root, "C:/Temp/cw-r3/acceptance/run/x", path.win32),
      true,
    );
  });

  test("separators: forward slashes on win32 still resolve under the root", () => {
    assert.equal(
      isInside(
        "C:/Temp/sandbox",
        "C:/Temp/sandbox/nested/file.txt",
        path.win32,
      ),
      true,
    );
    assert.equal(
      isInside("C:/Temp/sandbox", "C:/Temp/other/file.txt", path.win32),
      false,
    );
  });

  test("absolute candidates never count as relative children of a root", () => {
    assert.equal(
      isInside("/sandbox", "/sandbox/../etc/passwd", path.posix),
      false,
    );
    assert.equal(
      isInside("C:\\sandbox", "C:\\sandbox\\..\\Windows", path.win32),
      false,
    );
  });
});
