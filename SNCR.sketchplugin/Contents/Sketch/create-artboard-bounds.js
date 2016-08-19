var onRun = function(context) {
	// Document variables
	var doc = context.document;
	var page = [doc currentPage];
	var pages = [doc pages];
	var artboards = [page artboards];
	var layers = [page layers];
	
	// Layout variables
	var outerPad = 500;
	var pageBounds = doc.currentPage().contentBounds();
	var minWidth = 7900;
	var minHeight = 4420;
	
	// Slice variables
	var sliceName = [page name];
	var sliceLayer = findLayerByName(sliceName,layers);
	var sliceX = 200;
	var sliceY = 800;
	var sliceColor = MSColor.colorWithSVGString('#EFEFEF');
	var sliceWidth = pageBounds.size.width + sliceX + outerPad;
	var sliceHeight = pageBounds.size.height + sliceY + outerPad;
	
	// Override with minimum slice sizes if necessary
	sliceWidth = (sliceWidth < minWidth) ? minWidth : sliceWidth;
	sliceHeight = (sliceHeight < minHeight) ? minHeight : sliceHeight;
	
	// Delete page slice if one already exists
	if (sliceLayer) {
		sliceLayer.removeLayer();
	}
	
	// Create a new slice
	sliceLayer = [MSSliceLayer new];
	[sliceLayer setName:sliceName];
	[sliceLayer setBackgroundColor:sliceColor];
	[sliceLayer setIsLocked:true];
	sliceLayer.hasBackgroundColor = true;
	
	// Set slice dimensions
	[[sliceLayer frame] setX:-sliceX];
	[[sliceLayer frame] setY:-sliceY];
	[[sliceLayer frame] setWidth:sliceWidth];
	[[sliceLayer frame] setHeight:sliceHeight];
	
	// Insert slice into page
	doc.currentPage().addLayers([sliceLayer]);
	
	// Select the slice and move it to the bottom of the layer list
	sliceLayer.select_byExpandingSelection(true,false);
    actionWithType("MSMoveToBackAction",context).moveToBack(null);

	// Remove default slice export format
	sliceLayer.exportOptions().removeAllExportFormats();
	
	// Set slice export format to PDF
	sliceLayer.exportOptions().addExportFormat().setFileFormat("pdf");
	
	// Feedback to user
	doc.showMessage("Bound creation complete!");
	
	function findLayerByName(n,o) {
		for (var i = 0; i < o.count(); i++) {
			var layer = [o objectAtIndex: i];
			if ([layer name] == n) return layer;
		}
	}

	function actionWithType(type,context) {
		var doc = context.document;
		var controller = doc.actionsController();
		
		if (controller.actionWithName) {
			return controller.actionWithName(type);
		} else if (controller.actionWithID) {
			return controller.actionWithID(type);
		}
	}
};