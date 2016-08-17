var onRun = function(context) {
	// Document variables
	var doc = context.document;
	var page = [doc currentPage];
	var pages = [doc pages];
	var artboards = [page artboards];
	var artboardCount = [artboards count];
	
	
	
	// Deselect all layers on page
	page.deselectAllLayers()
	
	// Reset page origin
	var pageOrigin = CGPointMake(0,0);
	page.setRulerBase(pageOrigin);
	
	// Ask user for row count
	var rowOptions = ['6','8','10','12','14'];
	var userFeedback = createSelect('How many artboards per row?',rowOptions, 2);
	
	// If user provided a value
	if (userFeedback[0] == 1000) {
	    // Determine the user value
	    var rowCount = userFeedback[1];
	    rowCount = rowOptions[rowCount];
	    
	    // Layout the artboards
		artboardLayout(rowCount);
	}
	
	
	
	function artboardLayout(rowCount) {
		var firstBoard = [artboards objectAtIndex: 0];
	    var lastBoard = [artboards objectAtIndex: artboardCount-1];
	    var lastBoardPrefix = 0;
	    
	    var groupType = parseInt(firstBoard.name()) == parseInt(lastBoard.name()) ? 0 : 1;
	    var groupCount = 1;
	    var groupLayout = [];
	    
	    for (var i = 0; i < artboardCount; i++) {
	        var artboard = [artboards objectAtIndex: i];
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
	   
		var rowCount = rowCount;
		var rowHeight = 0;
		var x = 0;
		var y = 0;
		var xPad = 400;
		var yPad = 300;
		var xCount = 0;
		
		var groupCount = 1;
		
		for (var i = 0; i < groupLayout.length; i++) {
			var artboard = [artboards objectAtIndex: i];
			var artboardFrame = [artboard frame];
			
			// If starting a new group, reset x and calculate the y position of the next row
			if (groupLayout[i]['group'] != groupCount) {
				var nextGroupTotal = groupCounter(groupCount+1,groupLayout);
				var rowSpace = rowCount - 1 - (xCount+1);
				
				if (rowSpace < nextGroupTotal) {
					x = 0;
					y += rowHeight + yPad*2;
					rowHeight = 0;
					xCount = 0;
				} else {
					x += [artboardFrame width] + xPad;
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
	
	function groupCounter(group,obj) {
	    var count = 0;
	    
	    for (var i = 0; i < obj.length; ++i) {
	        if (obj[i]['group'] == group) {
	            count++;
	        }    
	    }
	    
	    return count;
	}
	
	function createSelect(msg, items, selectedItemIndex){
		selectedItemIndex = selectedItemIndex || 0
		
		var accessory = NSComboBox.alloc().initWithFrame(NSMakeRect(0,0,200,25))
		accessory.addItemsWithObjectValues(items)
		accessory.selectItemAtIndex(selectedItemIndex)
		
		var alert = NSAlert.alloc().init()
		alert.setMessageText(msg)
		alert.addButtonWithTitle('OK')
		alert.addButtonWithTitle('Cancel')
		alert.setAccessoryView(accessory)
		
		var responseCode = alert.runModal()
		var sel = accessory.indexOfSelectedItem()
		
		return [responseCode, sel]
	}
};