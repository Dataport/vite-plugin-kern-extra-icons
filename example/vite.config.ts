import { defineConfig } from 'vite'

import kernExtraIcons from '../src/index.js'

export default defineConfig({
	plugins: [
		kernExtraIcons(),
	],
})
