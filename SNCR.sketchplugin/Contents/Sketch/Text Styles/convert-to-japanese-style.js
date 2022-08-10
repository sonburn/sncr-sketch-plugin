const sketch = require("sketch")
const document = sketch.getSelectedDocument()
const selections = document.selectedLayers
const sharedTextStyles = document.sharedTextStyles

var onRun = function(context) {
	let errorCount = 0
	let skipCount = 0
	let updateCount = 0

	let prefixes = ["JP"]
	let prefix = prefixes[0] + "/"

	if (!selections.length) {
		sketch.UI.alert(`Convert to Japanese Style`,`Nothing is selected.`)

		return
	}

	selections.forEach(selection => {
		if (selection.layers) {
			processGroup(selection.layers)
		} else {
			processLayer(selection)
		}
	})

	function processGroup(layers,loop) {
		if (!loop) {
			for (var i = layers.length - 1; i >= 0; i--) {
				processLayer(layers[i])
			}
		} else {
			layers.forEach(layer => processLayer(layer))
		}
	}

	function processLayer(layer) {
		// Process symbol instances
		if (layer.type == "SymbolInstance") {
			// Get textStyle overrides for selection
			let textStyleOverrides = layer.overrides.filter(o => o.editable && o.property == "textStyle")

			// Iterate textStyle overrides
			textStyleOverrides.forEach(o => {
				// Get shared style of textStyle override
				let sharedStyle = sharedTextStyles.find(s => s.id === o.value)

				// Bail out if shared style not found
				if (!sharedStyle) {
					console.error(`Unable to find the shared style for the text style override applied to ${o.affectedLayer.name}, could be orphan or belong to a disabled library`)

					// Incremenet error count
					errorCount++

					return
				}

				// Get library of shared style
				let sharedStyleLibrary = sharedStyle.getLibrary()

				// Bail out if shared style library not found
				if (!sharedStyleLibrary) {
					console.error(`Unable to retrieve the library for the text style override ${sharedStyle.name} applied to ${o.affectedLayer.name}, could be a disabled library`)

					// Incremenet error count
					errorCount++

					return
				}

				// Get text styles from shared library
				let libraryTextStyles = sharedStyleLibrary.getImportableTextStyleReferencesForDocument(document)

				// Get shared style of JP textStyle
				let sharedStyleJP = libraryTextStyles.find(s => s.name === prefix + sharedStyle.name)

				// Bail out if JP shared style not found, or JP style already applied
				if (!sharedStyleJP || sharedStyle.id === sharedStyleJP.id) {
					// Incremenet skip count
					skipCount++

					return
				}

				// Import shared style JP textStyle
				let sharedStyleJPReference = sharedStyleJP.import()

				// Apply JP textStyle override
				layer.setOverrideValue(o,sharedStyleJPReference.id)

				// Incremenet update count
				updateCount++
			})
		}
		// Process text layers
		else if (layer.type == "Text") {
			// Get shared style of text layer
			let sharedStyle = layer.sharedStyle

			// Bail out if shared style not found
			if (!sharedStyle) {
				console.error(`Unable to find a shared style for the text layer - ${layer.name} (${layer.id})`)

				// Incremenet error count
				errorCount++

				return
			}

			// Get library of shared style
			let sharedStyleLibrary = sharedStyle.getLibrary()

			// Bail out if shared style library not found
			if (!sharedStyleLibrary) {
				console.error(`Unable to retrieve the library for the text style override ${sharedStyle.name} applied to ${layer.name}, could be a disabled library`)

				// Incremenet error count
				errorCount++

				return
			}

			// Get text styles from shared library
			let libraryTextStyles = sharedStyleLibrary.getImportableTextStyleReferencesForDocument(document)

			// Get shared style of JP textStyle
			let sharedStyleJP = libraryTextStyles.find(s => s.name === prefix + sharedStyle.name)

			// Bail out if JP shared style not found, or JP style already applied
			if (!sharedStyleJP || sharedStyle.id === sharedStyleJP.id) {
				// Incremenet skip count
				skipCount++

				return
			}

			// Import shared style JP textStyle
			let sharedStyleJPReference = sharedStyleJP.import()

			// Apply JP textStyle
			layer.sharedStyle = sharedStyleJPReference

			// Sync with JP textStyle
			layer.style.syncWithSharedStyle(sharedStyleJPReference)

			// Incremenet update count
			updateCount++
		}

		// If symbol instance has layers, process them too
		if (layer.layers) processGroup(layer.layers,1)
	}

	// Output results to user
	sketch.UI.message(`${updateCount} styles updated, ${skipCount} styles skipped, ${errorCount} styles had problems`)
}