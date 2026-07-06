/** @type {import("prettier").Config} */
const config = {
	useTabs: true,
	semi: true,
	singleQuote: false,
	trailingComma: "all",
	printWidth: 80,
	plugins: ["prettier-plugin-tailwindcss"],
	tailwindFunctions: ["cn", "cva"],
};

export default config;
