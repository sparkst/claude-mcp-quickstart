import { describe, test, expect } from "vitest";
import { removeShebang } from "./vitest.config.js";

describe("removeShebang", () => {
  test("removes shebang from start of code", () => {
    const code = "#!/usr/bin/env node\nconsole.log('test')";
    const result = removeShebang(code);
    expect(result).toBe("console.log('test')");
  });

  test("removes node shebang specifically", () => {
    const code = "#!/usr/bin/env node\nconst fs = require('fs');";
    const result = removeShebang(code);
    expect(result).toBe("const fs = require('fs');");
  });

  test("removes bash shebang", () => {
    const code = "#!/bin/bash\necho 'hello'";
    const result = removeShebang(code);
    expect(result).toBe("echo 'hello'");
  });

  test("returns code unchanged when no shebang present", () => {
    const code = "console.log('no shebang here');";
    const result = removeShebang(code);
    expect(result).toBe("console.log('no shebang here');");
  });

  test("handles empty string", () => {
    const result = removeShebang("");
    expect(result).toBe("");
  });

  test("handles code with shebang but no following content", () => {
    const code = "#!/usr/bin/env node";
    const result = removeShebang(code);
    expect(result).toBe("");
  });

  test("handles multiline code preserving structure", () => {
    const code =
      "#!/usr/bin/env node\nconst x = 1;\nconst y = 2;\nconsole.log(x + y);";
    const result = removeShebang(code);
    expect(result).toBe("const x = 1;\nconst y = 2;\nconsole.log(x + y);");
  });

  test("only removes first line shebang, not mid-file hash comments", () => {
    const code =
      "#!/usr/bin/env node\n// # This is a comment\nconsole.log('test');";
    const result = removeShebang(code);
    expect(result).toBe("// # This is a comment\nconsole.log('test');");
  });

  test("handles Windows line endings", () => {
    const code = "#!/usr/bin/env node\r\nconsole.log('windows');";
    const result = removeShebang(code);
    expect(result).toBe("console.log('windows');");
  });
});
