var onRun = function(context) {
	// Document variables
	var doc = context.document;
	var page = [doc currentPage];
	var pages = [doc pages];
	var pageCount = [pages count];
	var selection = context.selection;
	var selectionCount = [selection count];
	
	if (selection.count() == 0) {
	    var app = NSApplication.sharedApplication();
	    app.displayDialog_withTitle("Please select a symbol master.","Find All Symbol Instances");
	} else if (selection.count() > 1) {
	    var app = NSApplication.sharedApplication();
	    app.displayDialog_withTitle("Please select just one symbol master.","Find All Symbol Instances");
	} else {
	    for (var i=0; i<selectionCount; i++) {
	        var layer = selection[i];
	        var symbolMaster = [layer name];
	    }
	    
	    if (layer instanceof MSSymbolMaster) {
	        var symbolInstances = [];
	        
	        for (var i=0; i < pageCount; i++) {
	            var pageObject = [pages objectAtIndex:i]
	            [doc setCurrentPage:pageObject]
	            
	            if (doc.currentPage().name() != 'Symbols') {
	                [page deselectAllLayers]
	            }
	            
	            getSymbolInstances(symbolMaster,doc.currentPage());
	        }
	    } else {
	        var app = NSApplication.sharedApplication();
	        app.displayDialog_withTitle("Please select a symbol master.","Find All Symbol Instances");
	    }
	}
	
	function getSymbolInstances(symbolMaster,scope) {
	    if (scope instanceof MSSymbolInstance && [scope symbolMaster].name() == symbolMaster) {
	        symbolInstances.push({
	            //page: doc.currentPage().name(),
	            path: getParentPath(scope)
	        });
	        
	        return symbolInstances;
	    }
	    try {
	        var children = scope.layers();
	        
	        for (var i = 0; i < children.length; i++) {
	            getSymbolInstances(symbolMaster,children.objectAtIndex(i))
	        }
	    } catch(e) {
	    }
	};
	
	function getParentPath(layer,path) {
	    var separator = "/";
	    var parentPath = (!path) ? '' : path;
	    var parentGroup = layer.parentGroup();
	    
	    if (parentGroup) {
	        parentPath = parentGroup.name() + separator + parentPath;
	        
	        //if (parentGroup.parentGroup() && parentGroup.parentGroup() != doc.currentPage()) {
	        if (parentGroup.parentGroup()) {
	            parentPath = getParentPath(parentGroup,parentPath);
	        }
	    }
	    
	    return parentPath;
	}
	
	if (symbolInstances && symbolInstances.length > 0) {
	    var output;
	    
	    for (var i=0; i < symbolInstances.length; i++) {
	        var thisPath = symbolInstances[i]['path'] + "\n";
	        output = (!output) ? thisPath : output + thisPath;
	    }
	    
	    var app = NSApplication.sharedApplication();
	    app.displayDialog_withTitle(output,symbolMaster + " was found " + symbolInstances.length + " times, in the following locations...");
	}
};