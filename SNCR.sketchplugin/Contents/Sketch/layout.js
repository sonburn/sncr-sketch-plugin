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
	
	
	
	// Deselect all artboards in all pages
	for (var i=0; i < pageCount; i++) {
		var pageObject = [pages objectAtIndex:i]
		[doc setCurrentPage:pageObject]
		[page deselectAllLayers]
	}
	
	var loop = [artboards objectEnumerator]
	
	while (artboard = loop.nextObject()) {
		[artboard select:true byExpandingSelection:true]
	}
	
	[doc setCurrentPage:page]
	
	// Deselect all artboards in current page
	[page deselectAllLayers]
	
	
	
	/////////////////////////////////////////////////////////////////////////////////////////////////////////////
	/////////////////////////////////////////////////////////////////////////////////////////////////////////////
	/////////////////////////////////////////////////////////////////////////////////////////////////////////////
	
	
	// Layout variables
	var firstBoard = [artboards objectAtIndex: 0];
	var lastBoard = [artboards objectAtIndex: artboardCount-1];
	var lastBoardPrefix = 0;
	
	var rowCount = (firstBoard.frame().width() > 640) ? 8 : 10;
	var rowHeight = 0;
	var x = 0;
	var y = 0;
	var xPad = 400;
	var yPad = 300;
	var xCount = 0;
	
	// Determine if we are grouping by majors (1) or minors (0)
	var groupType = parseInt(firstBoard.name()) == parseInt(lastBoard.name()) ? 0 : 1;
	
	/*
	var foo = addGroupTitle(doc.currentPage(),'Group Title','1.0',y);
	
	foo.select_byExpandingSelection(true,false);
	var moveCount = artboardCount + 1;
	for (var i = 0; i < moveCount; i++) {
		sendAction('moveBackward:');
	}
	*/
	
	// Layout artboards on current page
	for (var i = 0; i < artboardCount; i++) {
		var artboard = [artboards objectAtIndex: i];
		var artboardName = [artboard name];
		var artboardFrame = [artboard frame];
		
		// Set artboard prefix for group comparing, determined by grouping method (parseFloat will return 1.0, parseInt will return 1)
		var thisBoardPrefix = (groupType == 0) ? parseFloat(artboardName) : parseInt(artboardName);
		
		// If artboard prefix comparing indicates we should start a new group, reset x and calculate the y position of the next row
		if (lastBoardPrefix != 0 && lastBoardPrefix != thisBoardPrefix) {
			x = 0;
			y += rowHeight + yPad*2;
			rowHeight = 0;
			xCount = 0;
			
			/*
			var foo = addGroupTitle(doc.currentPage(),'Group Title',thisBoardPrefix,y);
			
			foo.select_byExpandingSelection(true,false);
			for (var j = 0; j < moveCount; j++) {
				sendAction('moveBackward:');
			}
			*/
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
		/*moveCount--;*/
	}
	
	
	
	/////////////////////////////////////////////////////////////////////////////////////////////////////////////
	/////////////////////////////////////////////////////////////////////////////////////////////////////////////
	/////////////////////////////////////////////////////////////////////////////////////////////////////////////
	
	
	
	doc.showMessage("Artboard layout complete!");
	
	
	
	/////////////////////////////////////////////////////////////////////////////////////////////////////////////
	/////////////////////////////////////////////////////////////////////////////////////////////////////////////
	/////////////////////////////////////////////////////////////////////////////////////////////////////////////
	
	
	
	function addGroupTitle(target,label,prefix,y) {
        var textLayer = target.addLayerOfType("text");
        textLayer.setStringValue(label)
        textLayer.setName(prefix + ' ' + label)
		textLayer.setIsLocked(true);
		textLayer.setFontSize(96);
		textLayer.setFontPostscriptName('Helvetica Neue Italic');
		
		if (y) {
			var frame = textLayer.frame();
			frame.setX(0);
			frame.setY(y-232);
		}
		
        return textLayer;
    }
	
	function sendAction(commandToPerform) {
		try {
			[NSApp sendAction:commandToPerform to:nil from:doc]
		} catch(e) {
			my.log(e)
		}
	}
};