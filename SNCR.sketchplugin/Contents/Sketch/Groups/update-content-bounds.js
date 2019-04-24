@import '../library.js';

const document = sketch.getSelectedDocument();
const selection = document.selectedLayers;

var onRun = function(context) {
	if (!selection.length) {
		sketch.UI.alert('Update Group Content Bounds','Nothing is selected.');
		return false;
	}

	selection.forEach(layer => layer.sketchObject.fixGeometryWithOptions(0));

	sketch.UI.message('The bounds of the selected group(s) have been updated');
}
