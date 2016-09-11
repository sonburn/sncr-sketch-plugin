var onRun = function(context) {
	var doc = context.document;

	// Deselect everything
	doc.currentPage().deselectAllLayers();

	// Recursive execute through all layers
	selectSliceRecursive(doc.currentPage());
};

function selectSliceRecursive(layer) {
	if (layer instanceof MSSymbolInstance) {
		layer.select_byExpandingSelection(true, true);

		return
	}

	try {
		var children = layer.layers();

		for (var i = 0; i < children.length; i++) {
			selectSliceRecursive(children.objectAtIndex(i));
		}
	} catch(e) { }
};
