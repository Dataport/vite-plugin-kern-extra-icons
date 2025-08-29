# vite-plugin-kern-extra-icons

This Vite plugin allows using arbitrary Material icons with KERN UX.

KERN UX provides only a very limited icon set, e.g. `kern-icon--delete`.
To use an any icon not bundled with KERN, integrate this plugin and use any icon with the same syntax (e.g., `kern-icon--fullscreen`).

## Installation

Install this package using your favorite package manager, e.g.:
```bash
npm i -D vite-plugin-kern-extra-icons
```

Add the plugin to your Vite configuration:
```typescript
// vite.config.ts

import kernExtraIcons from 'vite-plugin-kern-extra-icons'
// ...

export default defineConfig({
	plugins: [
		kernExtraIcons(),
	],
	// ...
})
```

Import the generated CSS whereever you include the KERN CSS, too:
```typescript
// loadKern.ts

import kernCss from '@kern-ux/native/dist/kern.min.css?raw'
import kernExtraIcons from 'virtual:kern-extra-icons'

export function loadKern() {
	const kernSheet = new CSSStyleSheet()
	kernSheet.replaceSync(kernCss)
	document.adoptedStyleSheets.push(kernSheet)

	// Don't forget to include the extra icons CSS!
	document.adoptedStyleSheets.push(kernExtraIcons)
}

if (import.meta.hot) {
	import.meta.hot.on('kern-extra-icons', ({ icons }) => {
		icons.forEach((icon) => kernExtraIcons.insertRule(icon))
	})
}
```

## Options

You can configure this Vite plugin with options.

### Using CSS `@layer`

If your application uses `@layer` grouping, you can encapsulate the KERN icons as a separate CSS layer.
This is necessary if you encapsulate KERN itself into a CSS layer (remember to put the icons layer first!).

Example:
```typescript
// vite.config.ts

// ...
kernExtraIcons({
	cssLayer: 'kern-ux-icons',
}),
```

This example yields to the following CSS:
```css
/* virtual:kern-extra-icons */

@layer kern-ux-icons {
	/* ... */
}
```

## Current limitations / Known bugs
The used KERN icons are detected by a regex search.

This has two drawbacks:
 - If you write KERN icons in a comment (e.g., `// You could also use kern-icon--fullscreen`), these icons will be bundled too.
 - If you generate KERN icon CSS classes (e.g., `'kern-icon--' + (isInFullscreen ? 'fullscreen-exit' : 'fullscreen')`), these icons are not detected.