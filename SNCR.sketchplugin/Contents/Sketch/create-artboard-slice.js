@import 'lib/functions.js'

var onRun = function(context) {
	// Document variables
	var doc = context.document;
	var page = [doc currentPage];
	var pages = [doc pages];
	var artboards = [page artboards];
	var layers = [page layers];

	// Selection variables
	var selection = context.selection;
	var selectedCount = selection.count();

	// Bound variables
	var boundType = showBoundSettings();
	var pageBounds = doc.currentPage().contentBounds();

	// Set variables per bound type
	if (boundType >= 0) {
		if (boundType == 1) {
			// Layout variables
			var margin = 100;
			var sliceX = pageBounds.origin.x - margin;
			var sliceY = pageBounds.origin.y - margin;
			var sliceWidth = pageBounds.size.width + (margin*2);
			var sliceHeight = pageBounds.size.height + (margin*2);

			// Create slice
			createSlice([page name],sliceWidth,sliceHeight,sliceX,sliceY,false,true);

			// Feedback to user
			doc.showMessage("Slice created around artboards!");
		} else if (boundType == 2) {
			// Layout variables
			var margin = 500;
			var minWidth = 7900;
			var minHeight = 4420;
			var sliceX = 200;
			var sliceY = 800;
			var sliceWidth = pageBounds.size.width + sliceX + margin;
			var sliceHeight = pageBounds.size.height + sliceY + margin;

			// Override with minimum slice sizes if necessary
			sliceWidth = (sliceWidth < minWidth) ? minWidth : sliceWidth;
			sliceHeight = (sliceHeight < minHeight) ? minHeight : sliceHeight;

			// Create slice
			createSlice([page name],sliceWidth,sliceHeight,-sliceX,-sliceY,true,true);

			// Feedback to user
			doc.showMessage("Slice created around artboards!");
		} else {
			if (selectedCount < 2) {
			  var app = NSApplication.sharedApplication();
				app.displayDialog_withTitle("Please select two or more artboards.","Create Slice Around Artboards")
			} else {
				// Get layout values of selections
				var selectionSize = getSelectionSize(selection);

				// Layout variables
				var margin = 100;
				var sliceX = selectionSize.minX - margin;
				var sliceY = selectionSize.minY - margin;
				var sliceWidth = selectionSize.width + (margin*2);
				var sliceHeight = selectionSize.height + (margin*2);

				// Create slice
				createSlice('Selections',sliceWidth,sliceHeight,sliceX,sliceY,false,false);

				// Feedback to user
				doc.showMessage("Slice created around selections!");
			}
		}
	}

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

	function createSlice(name,sliceWidth,sliceHeight,sliceX,sliceY,isLocked,isUnique) {
		// Slice variables
		var sliceName = name;
		var sliceColor = MSColor.colorWithSVGString('#EFEFEF');
		var sliceLayer;

		// If slice should be unique
		if (isUnique) {
			// Delete page slice if one already exists
			if (findLayerByName(sliceName,layers)) {
				sliceLayer.removeLayer();
			}
		}

		// Create new slice
		sliceLayer = [MSSliceLayer new];
		sliceLayer.setName(sliceName);
		sliceLayer.setBackgroundColor(sliceColor);
		sliceLayer.setIsLocked(isLocked);
		sliceLayer.hasBackgroundColor = true;

		// Set slice dimensions
		sliceLayer.frame().setX(sliceX);
		sliceLayer.frame().setY(sliceY);
		sliceLayer.frame().setWidth(sliceWidth);
		sliceLayer.frame().setHeight(sliceHeight);

		// Insert slice into page
		doc.currentPage().addLayers([sliceLayer]);

		// Select the slice and move it to the bottom of the layer list
		sliceLayer.select_byExpandingSelection(true,false);
		actionWithType("MSMoveToBackAction",context).moveToBack(null);

		// Replace default slice export format with PDF
		sliceLayer.exportOptions().removeAllExportFormats();
		sliceLayer.exportOptions().addExportFormat().setFileFormat("pdf");
	}

	function showBoundSettings() {
		var boundType;

		var settingsInput = COSAlertWindow.new();

		[settingsInput setMessageText:@'Create Slice Around Artboards'];

		[settingsInput addAccessoryView: createRadioButtons(["Create slice around selections","Create slice around all artboards","Create wireframe slice around all artboards"],1)];

		[settingsInput addButtonWithTitle:@'Save'];
		[settingsInput addButtonWithTitle:@'Cancel'];

		var responseCode = settingsInput.runModal();

		if (responseCode == 1000) {
				boundType = [[[settingsInput viewAtIndex:0] selectedCell] tag];
		}

		return boundType;
	}

	function createRadioButtons(options,selected) {
    // Set number of rows and columns
    var rows = options.length;
    var columns = 1;

		// Make a prototype cell
    var buttonCell = [[NSButtonCell alloc] init];
    [buttonCell setButtonType:NSRadioButton]

    // Make a matrix to contain the radio cells
    var buttonMatrix = [[NSMatrix alloc] initWithFrame: NSMakeRect(20,20,300,rows*25) mode:NSRadioModeMatrix prototype:buttonCell numberOfRows:rows numberOfColumns:columns];
    [buttonMatrix setCellSize: NSMakeSize(300,20)];

    // Create a cell for each option
    for (i = 0; i < options.length; i++) {
      [[[buttonMatrix cells] objectAtIndex: i] setTitle: options[i]];
      [[[buttonMatrix cells] objectAtIndex: i] setTag: i];
    }

    // Select the default cell
    [buttonMatrix selectCellAtRow:selected column:0]

    // Return the matrix
    return buttonMatrix;
	}

	function getSelectionSize(selection) {
	  var minX,minY,maxX,maxY;
	  minX=minY=Number.MAX_VALUE;
	  maxX=maxY=-0xFFFFFFFF;

	  for (var i = 0; i < selection.count(); i++) {
			var frame = selection.objectAtIndex(i).frame();

			minX = Math.min(minX,frame.minX());
			minY = Math.min(minY,frame.minY());
			maxX = Math.max(maxX,frame.maxX());
			maxY = Math.max(maxY,frame.maxY());
	  }

	  return {
	    width: maxX-minX,
	    height: maxY-minY,
			minX: minX,
			minY: minY
	  };
	}
};
