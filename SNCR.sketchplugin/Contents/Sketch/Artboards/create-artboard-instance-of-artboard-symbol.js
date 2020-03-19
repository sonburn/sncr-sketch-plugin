@import '../library.js';

var document = sketch.getSelectedDocument();
var selections = document.selectedLayers.layers;
var page = document.selectedPage;

var onRun = function(context) {
	if (!selections.length || selections.length > 1) {
		sketch.UI.alert('Create Artboard Instance of Artboard Symbol','Select one artboard symbol.');
		return false;
	}

	var selection = selections[0];
	var selectionFrame = selection.sketchObject.frame();

	var artboard = new sketch.Artboard({
		name: selection.name,
		frame: new sketch.Rectangle(
			selectionFrame.origin().x + selectionFrame.size().width + 100,
			selectionFrame.origin().y,
			selectionFrame.size().width,
			selectionFrame.size().height
		)
	});

	artboard = artboard.sketchObject;

	page.sketchObject.insertLayer_afterLayer(artboard,selection.sketchObject);

	artboard.setHasBackgroundColor(1);
	artboard.addLayer(selection.sketchObject.newSymbolInstance());
	artboard.select_byExtendingSelection(1,0);

	sketch.UI.message('Instance of artboard created');
}
