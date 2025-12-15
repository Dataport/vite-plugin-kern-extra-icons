import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { HmrContext, type Plugin } from 'vite'

interface KernIcon {
	name: string
	style?: 'fill'
}

const kernIconRegex = /kern-icon(?:-(?<style>fill))?--(?<name>[a-zA-Z0-9-]+)/g

const viteLoadedFiles = new Set<string>()
let currentKernIcons: KernIcon[] = []

function getUsedKernIconsByString (content: string): KernIcon[] {
	const iconMatches = content.matchAll(kernIconRegex)
	return [...new Set([...iconMatches].map((match) => match.groups))] as unknown as KernIcon[]
}

async function getUsedKernIcons () {
	const icons: Set<KernIcon> = new Set()
	for (const file of viteLoadedFiles) {
		const content = await readFile(file)
		getUsedKernIconsByString(content.toString()).forEach((icon) => icons.add(icon))
	}
	return [...icons]
}

async function loadKernIconCss (icon: KernIcon) {
	const iconBuffer = await readFile(
		fileURLToPath(
			import.meta.resolve(
				`@material-symbols/svg-400/rounded/${icon.name.replaceAll('-', '_')}${icon.style ? `-${icon.style}` : ''}.svg`,
			),
		),
	)
	const iconSvg = iconBuffer
		.toString()
		.replaceAll('width="48"', 'width=""')
		.replaceAll('height="48"', 'height=""')
	const iconUrl = 'data:image/svg+xml;base64,' + btoa(iconSvg)
	return `
		.kern-icon${icon.style ? `-${icon.style}` : ''}--${icon.name} {
			mask: url("${iconUrl}");
			background-color: var(--kern-color-layout-text-default, #171a2b);
		}
	`
}

export default function kernExtraIcons ({
	cssLayer = false,
	ignoreFilename = () => false,
}: {
	cssLayer?: string | false
	ignoreFilename?: (filename: string) => boolean
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
				['vue', 'ts', 'js', 'css'].some(suffix => id.endsWith(`.${suffix}`)) &&
				!ignoreFilename(id)
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
					.filter((icon) => !currentKernIcons.some((currentIcon) =>
						icon.name === currentIcon.name && icon.style === currentIcon.style))
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
