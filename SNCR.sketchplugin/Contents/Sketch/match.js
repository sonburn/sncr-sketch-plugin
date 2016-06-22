var onRun = function(context) {
	var selection = context.selection;

	for (var i = 0; i < selection.count(); i++) {
		var layer = selection[i];
		
		if ([layer class] === MSSymbolInstance) {
			layer.setName([layer symbolMaster].name());
		}
	}
};