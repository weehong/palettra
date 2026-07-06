import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import storybook from "eslint-plugin-storybook";
import prettier from "eslint-config-prettier";

const eslintConfig = defineConfig([
	...nextVitals,
	...nextTs,
	...storybook.configs["flat/recommended"],
	// Allow the `const { foo, ...rest } = obj` discard idiom used to omit a key.
	{
		rules: {
			"@typescript-eslint/no-unused-vars": [
				"warn",
				{ ignoreRestSiblings: true },
			],
		},
	},
	// Disable stylistic rules that conflict with Prettier; keep this last.
	prettier,
	// Override default ignores of eslint-config-next.
	globalIgnores([
		".next/**",
		"out/**",
		"build/**",
		"coverage/**",
		"storybook-static/**",
		"playwright-report/**",
		"test-results/**",
		"next-env.d.ts",
	]),
]);

export default eslintConfig;
