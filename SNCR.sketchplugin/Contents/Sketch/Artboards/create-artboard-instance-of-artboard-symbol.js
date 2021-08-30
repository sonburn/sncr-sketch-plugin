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

	if (selection.type != 'SymbolMaster') {
		sketch.UI.alert('Create Artboard Instance of Artboard Symbol','Artboard is not a symbol.');
		return false;
	}

	var artboard = new sketch.Artboard({
		name: selection.name,
		frame: new sketch.Rectangle(
			selection.frame.x + selection.frame.width + 100,
			selection.frame.y,
			selection.frame.width,
			selection.frame.height
		)
	});

	artboard = artboard.sketchObject;

	page.sketchObject.insertLayer_afterLayer(artboard,selection.sketchObject);

	var instance = selection.sketchObject.newSymbolInstance();
	instance.setHasFixedTop(1);
	instance.setHasFixedRight(1);
	instance.setHasFixedBottom(1);
	instance.setHasFixedLeft(1);

	artboard.addLayer(instance);
	artboard.setHasBackgroundColor(1);
	artboard.setResizesContent(1);
	artboard.exportOptions().setLayerOptions(2);

	var exportFormat = artboard.exportOptions().addExportFormat();
	exportFormat.setScale(2);
	exportFormat.setFileFormat('png');

	artboard.select_byExtendingSelection(1,0);

	sketch.UI.message('Instance of artboard created');
}
