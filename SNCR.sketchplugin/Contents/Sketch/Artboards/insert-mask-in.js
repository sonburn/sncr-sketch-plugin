@import '../library.js'

var document = sketch.getSelectedDocument()
var selections = document.selectedLayers.layers

var onRun = function(context) {
	if (!selections.length) {
		sketch.UI.alert('Insert Mask in Selected Artboards','Select at least one artboard (or symbol).')
		return false
	}

	selections.forEach(selection => {
		if (selection.type == 'Artboard' || selection.type == 'SymbolMaster') {
			let mask = new sketch.ShapePath({
				frame: {
					x: 0,
					y: 0,
					width: selection.frame.width,
					height: selection.frame.height
				},
				name: 'Mask',
				parent: selection
			})

			mask.moveToBack()

			mask.sketchObject.setHasFixedTop(1)
			mask.sketchObject.setHasFixedRight(1)
			mask.sketchObject.setHasFixedBottom(1)
			mask.sketchObject.setHasFixedLeft(1)
			mask.sketchObject.setHasClippingMask(1)
		}
	})

	var reselect = selections.slice(0)

	document.selectedLayers.clear()

	reselect.forEach(selection => {
		selection.sketchObject.select_byExtendingSelection(1,1)
	})
}
