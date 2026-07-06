import type { StorybookConfig } from "@storybook/nextjs";

const config: StorybookConfig = {
	stories: [
		"../components/**/*.stories.@(ts|tsx|mdx)",
		"../app/**/*.stories.@(ts|tsx|mdx)",
	],
	addons: ["@storybook/addon-docs"],
	framework: {
		name: "@storybook/nextjs",
		options: {},
	},
	staticDirs: ["../public"],
};

export default config;
