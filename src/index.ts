import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { HmrContext, type Plugin } from 'vite'

const kernIconRegex = /kern-icon--([a-zA-Z0-9-]+)/g

const viteLoadedFiles = new Set<string>()
let currentKernIcons: string[] = []

function getUsedKernIconsByString (content: string): string[] {
	const iconMatches = content.matchAll(kernIconRegex)
	return [...new Set([...iconMatches].map((match) => match[1]))]
}

async function getUsedKernIcons () {
	const icons: Set<string> = new Set()
	for (const file of viteLoadedFiles) {
		const content = await readFile(file)
		getUsedKernIconsByString(content.toString()).forEach((icon) => icons.add(icon))
	}
	return [...icons]
}

async function loadKernIconCss (icon: string) {
	const iconBuffer = await readFile(
		fileURLToPath(
			import.meta.resolve(
				`@material-symbols/svg-400/rounded/${icon.replaceAll('-', '_')}.svg`,
			),
		),
	)
	const iconSvg = iconBuffer
		.toString()
		.replaceAll('width="48"', 'width=""')
		.replaceAll('height="48"', 'height=""')
	const iconUrl = 'data:image/svg+xml;base64,' + btoa(iconSvg)
	return `
		.kern-icon--${icon} {
			mask: url("${iconUrl}");
			background-color: var(--kern-color-layout-text-default, #171a2b);
		}
	`
}

export default function kernExtraIcons ({
	cssLayer = false,
}: {
	cssLayer?: string | false
} = {}): Plugin {
	const virtualId = 'virtual:kern-extra-icons'
	const resolvedVirtualId = '\0' + virtualId

	return {
		name: 'kern-extra-icons',
		enforce: 'pre',
		resolveId (id: string) {
			if (id === virtualId) {
				return resolvedVirtualId
			}
		},
		load (id: string) {
			if (id === resolvedVirtualId) {
				if (cssLayer) {
					return `const sheet = new CSSStyleSheet()
sheet.replaceSync(\`@layer ${cssLayer} {
	\${import.meta.kernExtraIcons}
}\`)
export default sheet`
				}
				return `const sheet = new CSSStyleSheet()
sheet.replaceSync(import.meta.kernExtraIcons)
export default sheet`
			} else if (
				!id.includes('node_modules') &&
				!id.startsWith('\0') &&
				['vue', 'ts', 'js', 'css'].some(suffix => id.endsWith(`.${suffix}`))
			) {
				const filename = id.split('?')[0]
				viteLoadedFiles.add(filename)
			}
		},
		async transform (code: string, id: string) {
			if (id === resolvedVirtualId) {
				currentKernIcons = await getUsedKernIcons()
				const cssRules: string[] = await Promise.all(
					currentKernIcons.map(async (icon) => await loadKernIconCss(icon)),
				)
				return {
					code: code.replace('import.meta.kernExtraIcons', JSON.stringify(cssRules.join('\n'))),
				}
			}
		},
		async handleHotUpdate ({ server, read }: HmrContext) {
			const icons = await Promise.all(
				getUsedKernIconsByString(await read())
					.filter((icon) => !currentKernIcons.includes(icon))
					.map(async (icon) => await loadKernIconCss(icon)),
			)
			server.ws.send({
				type: 'custom',
				event: 'kern-extra-icons',
				data: {
					icons,
				},
			})
		},
	}
}
