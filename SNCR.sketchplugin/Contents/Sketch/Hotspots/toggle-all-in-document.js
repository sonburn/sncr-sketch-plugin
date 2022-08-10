@import '../library.js'

var onRun = function(context) {
	var sketch = require('sketch')
	var hotspotGroups = []

	sketch.getSelectedDocument().pages.forEach(getHotspotGroups)

	function getHotspotGroups(page) {
		page.sketchObject.children().forEach(function(layer){
			if (layer.class() == 'MSLayerGroup' && layer.name() == 'Hotspots') hotspotGroups.push(layer)
		})
	}

	var currentState = hotspotGroups[0].isVisible()

	hotspotGroups.forEach(function(group){
		group.setIsVisible(!currentState)
	})

	var message = (currentState == 0) ? 'visible 🙉' : 'hidden 🙈'

	sketch.UI.message('All document hotspots are now ' + message)
}
