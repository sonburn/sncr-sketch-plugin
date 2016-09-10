@import 'lib/functions.js';

var onRun = function(context) {
	// Document variables
	var doc = context.document;
	var page = [doc currentPage];
	var pages = [doc pages];
	var artboards = [page artboards];
	var artboardCount = [artboards count];

	// Run only if there are artboards
	if (artboardCount) {
		// Reset page origin
		var pageOrigin = CGPointMake(0,0);
		page.setRulerBase(pageOrigin);

		// Get layout settings
		var layoutSettings = getLayoutSettings();

		// Layout the artboards
		if (layoutSettings) {
			var layoutArtboards = artboards;

			if (layoutSettings.sortOrder != 0) {
				var sortByName = [NSSortDescriptor sortDescriptorWithKey:"name" ascending:1];
				layoutArtboards = [layoutArtboards sortedArrayUsingDescriptors:[sortByName]];

				var layoutLayers = (layoutSettings.sortOrder == 2) ? [[layoutArtboards reverseObjectEnumerator] allObjects] : layoutArtboards;

				sortLayerList(layoutLayers);
			}

			var firstBoard = [layoutArtboards objectAtIndex: 0];
			var lastBoard = [layoutArtboards objectAtIndex: artboardCount-1];
			var lastBoardPrefix = 0;

			var groupType = parseInt(firstBoard.name()) == parseInt(lastBoard.name()) ? 0 : 1;
			var groupCount = 1;
			var groupLayout = [];

			for (var i = 0; i < artboardCount; i++) {
				var artboard = [layoutArtboards objectAtIndex: i];
				var artboardName = [artboard name];

				var thisBoardPrefix = (groupType == 0) ? parseFloat(artboardName) : parseInt(artboardName);

				if (lastBoardPrefix != 0 && lastBoardPrefix != thisBoardPrefix) {
					groupCount++;
				}

				groupLayout.push({
					artboard: artboardName,
					prefix: thisBoardPrefix,
					group: groupCount
				});

				lastBoardPrefix = thisBoardPrefix;
			}

			var rowCount = layoutSettings.rowCount;
			var rowDensity = layoutSettings.rowDensity;
			var rowHeight = 0;
			var x = 0;
			var y = 0;
			var xPad = 400;
			var yPad = 300;
			var xCount = 0;

			var groupCount = 1;

			for (var i = 0; i < groupLayout.length; i++) {
				var artboard = [layoutArtboards objectAtIndex: i];
				var artboardFrame = [artboard frame];

				// If starting a new group, reset x and calculate the y position of the next row
				if (groupLayout[i]['group'] != groupCount) {
					var nextGroupTotal = groupCounter(groupCount+1,groupLayout);
					var rowSpace = rowCount - (xCount+1);

					if (rowDensity == 1 || rowSpace < nextGroupTotal) {
						x = 0;
						y += rowHeight + yPad*2;
						rowHeight = 0;
						xCount = 0;
					} else {
						x += [artboardFrame width] + xPad;
						xCount++;
					}

					groupCount++;
				}

				// If new line is detected but is continuation of group, give smaller vertical padding
				if (x == 0 && xCount != 0) {
					y += yPad;
				}

				// Position current artboard
				artboardFrame.x = x;
				artboardFrame.y = y;

				// Keep track if this artboard is taller than previous artboards in row
				if ([artboardFrame height] > rowHeight) {
					rowHeight = [artboardFrame height];
				}

				// Determine if this is the last artboard the row, reset x and calculate the y position of the next row
				if ((xCount + 1) % rowCount == 0) {
					x = 0;
					y += rowHeight;
					rowHeight = 0;
				} else {
					x += [artboardFrame width] + xPad;
				}

				lastBoardPrefix = thisBoardPrefix;

				xCount++;
			}

			// Feedback to user
			doc.showMessage("Artboard layout complete!");
		}
	} else {
		// Feedback to user
		doc.showMessage("No artboards for layout.");
	}

	function groupCounter(group,obj) {
		var count = 0;

		for (var i = 0; i < obj.length; ++i) {
			if (obj[i]['group'] == group) {
				count++;
			}
		}

		return count;
	}

	function getLayoutSettings() {
		var artboardsPerRow = ['6','8','10','12','14','100'];
		var artboardsPerRowDefault = 2;

		var alertWindow = COSAlertWindow.new();

		[alertWindow setMessageText:@'Layout Artboards for Export'];

		[alertWindow addTextLabelWithValue:@'How many artboards per row?'];
		[alertWindow addAccessoryView: helpers.createSelect(artboardsPerRow,artboardsPerRowDefault,NSMakeRect(0,0,80,25))];

		[alertWindow addTextLabelWithValue:@'Choose a layout type:'];
		[alertWindow addAccessoryView: createRadioButtons(['Dense layout','Loose layout'],0)];

		[alertWindow addTextLabelWithValue:@'Choose a sort type:'];
		[alertWindow addAccessoryView: createRadioButtons(['Do not sort anything','Sort layers and artboards','Sort layers and artboards, reverse layer order'],0)];

		[alertWindow addButtonWithTitle:@'OK'];
		[alertWindow addButtonWithTitle:@'Cancel'];

		var responseCode = alertWindow.runModal();

		if (responseCode == 1000) {
			return {
				rowCount : artboardsPerRow[[[alertWindow viewAtIndex:1] indexOfSelectedItem]],
				rowDensity : [[[alertWindow viewAtIndex:3] selectedCell] tag],
				sortOrder : [[[alertWindow viewAtIndex:5] selectedCell] tag]
			}
		} else return false;
	}

	function sortLayerList(layoutArtboards) {
		var parent = page;
		var artboardIndices = [];
		var loop = [artboards objectEnumerator], artboard;

		while (artboard = [loop nextObject]) {
			artboardIndices.push(parent.indexOfLayer(artboard));
		}

		var removeLoop = [artboards objectEnumerator], artboardToRemove;

		while (artboardToRemove = [removeLoop nextObject]) {
			[artboardToRemove removeFromParent];
		}

		for (var i = 0; i < artboardIndices.length; i++) {
			var index = artboardIndices[i];
			var sortedArtboard = layoutArtboards[i];
			var layerArray = [NSArray arrayWithObject:sortedArtboard];
			[parent insertLayers:layerArray atIndex:index];
		}

		artboards = [page artboards];
	}
};
