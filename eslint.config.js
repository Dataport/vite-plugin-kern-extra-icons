import mainConfig from '@dataport/eslint-config-geodev'
import jsonConfig from '@dataport/eslint-config-geodev/json'
import markdownConfig from '@dataport/eslint-config-geodev/markdown'
import nodeConfig from '@dataport/eslint-config-geodev/node'
import tsConfig from '@dataport/eslint-config-geodev/typescript'
import { defineConfig } from 'eslint/config'

export default defineConfig([
	{
		ignores: ['node_modules/', 'dist/'],
	},
	{
		files: ['**/*.js', '**/*.mjs', '**/*.cjs'],
		extends: [mainConfig, nodeConfig],
	},
	{
		files: ['**/*.ts'],
		extends: [mainConfig, nodeConfig, tsConfig],
	},
	{
		files: ['**/*.json'],
		ignores: ['package-lock.json'],
		extends: [jsonConfig],
	},
	{
		files: ['**/*.md'],
		extends: [markdownConfig],
	},
])
