@import '../library.js';

var document = sketch.getSelectedDocument();
var selections = document.selectedLayers.layers;

var onRun = function(context) {
	if (!selections.length) {
		sketch.UI.alert('Insert Mask in Selected Artboards','Select at least one artboard (or symbol).');
		return false;
	}

	var masks = [];

	selections.forEach(function(selection){
		if (selection.type == 'Artboard' || selection.type == 'SymbolMaster') {
			var mask = new sketch.Shape({
				frame: {
					x: 0,
					y: 0,
					width: selection.frame.width,
					height: selection.frame.height
				},
				parent: selection
			});

			mask.moveToBack();

			masks.push(mask);
		}
	});

	var reselect = selections.slice(0);

	masks.forEach(function(mask){
		mask.sketchObject.flatten();

		performAction('MSClippingMaskAction');
	});

	document.selectedLayers.clear();

	reselect.forEach(function(selection){
		selection.sketchObject.select_byExpandingSelection(1,1);
	})
}
