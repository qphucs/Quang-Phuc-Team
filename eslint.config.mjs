import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const FEATURES = ["auth", "members", "skills", "learning", "trends", "downloader", "notifications"];

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/consistent-type-imports": ["error", { fixStyle: "inline-type-imports" }],
    },
  },
  // 🔒 Design tokens only: no raw hex colors in UI code (docs/02-design-system.md §1.5).
  {
    files: ["src/components/**/*.tsx", "src/features/**/*.tsx", "src/app/**/*.tsx"],
    ignores: ["src/app/layout.tsx"],
    rules: {
      "no-restricted-syntax": [
        "error",
        {
          selector: "Literal[value=/#[0-9a-fA-F]{3,8}\\b/]",
          message: "Dùng design token (vd: bg-brand, text-ink) thay cho mã màu hex.",
        },
        {
          selector: "TemplateElement[value.raw=/#[0-9a-fA-F]{3,8}\\b/]",
          message: "Dùng design token (vd: bg-brand, text-ink) thay cho mã màu hex.",
        },
      ],
    },
  },
  // 🔒 features/* must not import from each other (docs/03-conventions.md §3).
  ...FEATURES.map((feature) => ({
    files: [`src/features/${feature}/**/*.{ts,tsx}`],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: FEATURES.filter((f) => f !== feature).map((f) => `@/features/${f}/**`),
              message: "Không import chéo giữa các feature. Đưa phần dùng chung lên lib/ hoặc components/ui/.",
            },
          ],
        },
      ],
    },
  })),
  globalIgnores([".next/**", "out/**", "build/**", "next-env.d.ts", "src/db/migrations/**"]),
]);

export default eslintConfig;
