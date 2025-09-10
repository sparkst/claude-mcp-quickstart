import { defineConfig } from "vitest/config";

export function removeShebang(code) {
  if (code.startsWith("#!")) {
    return code.replace(/^#!.*\r?\n?/, "");
  }
  return code;
}

export default defineConfig({
  plugins: [
    {
      name: "remove-shebang",
      transform(code, _id) {
        return removeShebang(code);
      },
    },
  ],
  test: {
    // Keep existing test behavior unchanged
  },
});
