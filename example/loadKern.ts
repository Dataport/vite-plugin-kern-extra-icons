import kernCss from '@kern-ux/native/dist/kern.min.css?raw'
import kernExtraIcons from 'virtual:kern-extra-icons'

export function loadKern () {
	const kernSheet = new CSSStyleSheet()
	kernSheet.replaceSync(kernCss)
	document.adoptedStyleSheets.push(kernSheet)

	// Don't forget to include the extra icons CSS!
	document.adoptedStyleSheets.push(kernExtraIcons)
}

if (import.meta.hot) {
	import.meta.hot.on('kern-extra-icons', ({ icons }: { icons: string[] }) => {
		icons.forEach((icon) => kernExtraIcons.insertRule(icon))
	})
}

loadKern()

// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
document.getElementById('app')!.innerHTML = `
	<h1 class="kern-heading-large">vite-plugin-kern-extra-icons Example</h1>
	<p class="kern-body">This is an example of how to use KERN-bundled icons.</p>
	<span class="kern-icon kern-icon--add"></span>
	<span class="kern-icon kern-icon--delete"></span>
	<p class="kern-body">This is an example of how to use the <code>vite-plugin-kern-extra-icons</code> plugin.</p>
	<span class="kern-icon kern-icon--fullscreen"></span>
	<span class="kern-icon kern-icon-fill--layers"></span>
`
