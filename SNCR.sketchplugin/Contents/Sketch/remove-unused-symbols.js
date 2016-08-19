var onRun = function(context) {
	var doc = context.document;
	var symbols = doc.documentData().allSymbols();
	var removedCount = 0;
	
	for (var i=0; i < symbols.count(); i++) {
		var symbol = symbols.objectAtIndex(i);
		
		if(!symbol.hasInstances()) {
			symbol.removeFromParent();
			removedCount++;
		}
	}
	
	doc.showMessage(removedCount + " unused symbols were removed.");
};