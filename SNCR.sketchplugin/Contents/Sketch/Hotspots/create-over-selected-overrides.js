@import '../library.js'

var onRun = function(context) {
	const sketch = require('sketch')
	const document = sketch.getSelectedDocument()
	const selections = document.selectedLayers
	const selection = selections.layers[0]

	if (!selections.length || selections.length > 1 || selection.type !== 'SymbolInstance') {
		sketch.UI.alert('Create Hotspot Over Selected Overrides','Select one or many overrides within a single symbol instance.')
		return
	}

	let selectedOverrides = selection.overrides.filter(o => o.selected)

	if (!selectedOverrides) {
		sketch.UI.alert('Create Hotspot Over Selected Overrides','Select one or many overrides within a single symbol instance.')
		return
	}

	let parentArtboard = selection.getParentArtboard()
	let hotspotGroup = parentArtboard.layers.find(l => sketch.Settings.layerSettingForKey(l,'hotspotGroup') == true)
	let hotspotCount = 0

	if (!hotspotGroup) {
		hotspotGroup = new sketch.Group({
			name: 'Hotspots',
			locked: true,
			parent: parentArtboard
		})

		sketch.Settings.setLayerSettingForKey(hotspotGroup,'hotspotGroup',true)
	}

	selectedOverrides.forEach(o => {
		new sketch.HotSpot({
			name: 'Hotspot',
			frame: new sketch.Rectangle(
				o.getFrame().x - hotspotGroup.frame.x,
				o.getFrame().y - hotspotGroup.frame.y,
				o.getFrame().width,
				o.getFrame().height
			),
			parent: hotspotGroup
		})

		hotspotCount++
	})

	hotspotGroup.adjustToFit()

	sketch.UI.message(`${hotspotCount} hotspots created`)
}
