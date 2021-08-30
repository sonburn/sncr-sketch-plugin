@import '../library.js'
@import '../delegate.js'

const document = sketch.getSelectedDocument()
const selections = document.selectedLayers
const swatches = document.swatches

var onRun = function(context) {
	if (selections.length == 0) {
		sketch.UI.alert('Replace Override Fills with Swatch','Select at least one symbol instance')

		return
	}

	sketch.UI.getInputFromUser('Select the swatch to override with…',
		{
			type: sketch.UI.INPUT_TYPE.selection,
			possibleValues: swatches.map(s => s.name),
		},
		(err,val) => {
			if (err) {
				// User most likely canceled input
				return
			}

			let swatch = swatches.find(s => s.name == val)
			let swatchReference = swatch.sketchObject.makeReferencingColor()

			let updateCount = 0

			selections.layers.forEach(selection => {
				if (selection.overrides) {
					let uneditedOverrides = selection.overrides.filter(o => o.property == 'fillColor' && o.isDefault == true)
					//let editedOverrides = selection.overrides.filter(o => o.property == 'fillColor' && o.isDefault == false)

					uneditedOverrides.forEach(o => {
						o.value = swatchReference
						updateCount++
					})
				}
			})

			sketch.UI.message(`${updateCount} overrides have been updated`)
		}
	)
}
