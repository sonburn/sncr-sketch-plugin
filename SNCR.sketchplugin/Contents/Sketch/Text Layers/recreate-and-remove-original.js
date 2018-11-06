@import '../library.js';

var onRun = function(context) {
	var documentData = context.document.documentData();

	var selection = context.selection;

	if (!selection.length) {
		sketch.UI.alert('Recreate and Remove Original…','Select at least one text layer.');
		return false;
	}

	selection.forEach(replaceTextLayer);

	function replaceTextLayer(textLayer) {
		var textLayerParent = textLayer.parentObject();
		var textLayerIndex = textLayerParent.indexOfLayer(textLayer);
		var textLayerString = textLayer.stringValue();
		var textLayerSharedStyleID = textLayer.sharedStyleID();
		var textLayerStyle = (textLayerSharedStyleID) ? documentData.textStyleWithID(textLayerSharedStyleID) : textLayer.style();

		var newTextLayer = MSTextLayer.new();
		
		newTextLayer.setStringValue(textLayerString);
		newTextLayer.setName(textLayerString);
		newTextLayer.setFrame(textLayer.frame());

		if (textLayerSharedStyleID) {
			newTextLayer.setSharedStyle(textLayerStyle);
		} else {
			newTextLayer.setStyle(textLayerStyle);
		}

		textLayerParent.insertLayer_atIndex(newTextLayer,textLayerIndex);
		textLayer.removeFromParent();
	}

	var message = 'The text layer has been recreated';

	if (selection.length > 1) {
		message = selection.length + ' text layers have been recreated';
	}

	sketch.UI.message(message);
}
