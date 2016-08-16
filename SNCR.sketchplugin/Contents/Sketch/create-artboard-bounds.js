//@import 'inventory.js';

var onRun = function(context) {
	// Document variables
	var doc = context.document;
	var page = [doc currentPage];
	var pages = [doc pages];
	var pageCount = [pages count];
	var artboards = [page artboards];
	var artboardCount = [artboards count];
	var layers = [page layers];
	var layerCount = [layers count];
	
	
	
	/////////////////////////////////////////////////////////////////////////////////////////////////////////////
	/////////////////////////////////////////////////////////////////////////////////////////////////////////////
	/////////////////////////////////////////////////////////////////////////////////////////////////////////////
	
	
	// Layout variables
	var firstBoard = [artboards objectAtIndex: 0];
	
	var rowCount = (firstBoard.frame().width() > 640) ? 8 : 10;
	var rowHeight = 0;
	var xPad = 400;
	var yPad = 300;
	
	// Slice variables
	var sliceName = [page name];
	var sliceLayer = findLayerByName(layers,sliceName);
	var sliceX = 200;
	var sliceY = 800;
	var sliceColor = MSColor.colorWithSVGString('#EFEFEF');
	
	if (sliceLayer) {
		sliceLayer.select_byExpandingSelection(true,false);
		sendAction('delete:');
	}
	
	var pageBounds = doc.currentPage().contentBounds();
	var sliceWidth = (firstBoard.frame().width() * rowCount) + (xPad * rowCount) + (sliceX * 2) - 100;
	
	var fooHeight = pageBounds.size.height + 500;
	var sliceHeight = (fooHeight < 4420) ? 4420 : fooHeight; // The hard-coded minimum handset height needs to be moved to variable and changed if tablet
	
	// Create slice if not found
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
	//[[doc currentPage] addLayers:sliceLayer];
	doc.currentPage().addLayers([sliceLayer]);
	
	// Move slice to bottom
	sliceLayer.select_byExpandingSelection(true,false);
	sendAction('moveToBack:');
	
	// Create PDF export option for slice
	var exportSize = sliceLayer.exportOptions().exportFormats()
	exportSize.removeAllObjects();
	exportSize = sliceLayer.exportOptions().addExportFormat();
	exportSize.setFileFormat("pdf");
	
	
	
	/////////////////////////////////////////////////////////////////////////////////////////////////////////////
	/////////////////////////////////////////////////////////////////////////////////////////////////////////////
	/////////////////////////////////////////////////////////////////////////////////////////////////////////////
	
	
	
	doc.showMessage("Bound generation complete!");
	
	
	
	/////////////////////////////////////////////////////////////////////////////////////////////////////////////
	/////////////////////////////////////////////////////////////////////////////////////////////////////////////
	/////////////////////////////////////////////////////////////////////////////////////////////////////////////
	
	
	
	// Common functions
	function findLayerByName(o,n) {
		for (var i = 0; i < o.count(); i++) {
			var layer = [o objectAtIndex: i];
			if ([layer name] == n) return layer;
		}
	}
	
	function sendAction(commandToPerform) {
		try {
			[NSApp sendAction:commandToPerform to:nil from:doc]
		} catch(e) {
			my.log(e)
		}
	}
};