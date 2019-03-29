@import '../library.js';

var onRun = function(context) {
	var document = sketch.getSelectedDocument();
	var page = document.selectedPage;
	var count = 0;

	page.sketchObject.symbols().forEach(function(symbol){
		var symbol = sketch.fromNative(symbol);

		if (symbol.overrides) {
			symbol.overrides.forEach(function(override){
				if (override.editable == 1 && override.property == 'layerStyle' || override.property == 'textStyle') {
					let overridePoint = override.sketchObject.overridePoint();

					symbol.sketchObject.setOverridePoint_editable(overridePoint,0);

					log(overridePoint + ' on ' + symbol.name + ' has been disabled');

					count++;
				}
			});
		}
	});

	document.sketchObject.reloadInspector();

	sketch.UI.message(count + ' style overrides were disabled');
}
