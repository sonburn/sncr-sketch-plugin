@import '../library.js';

var onRun = function(context) {
	var documentData = context.document.documentData();
	var selections = context.selection;

	if (!selections.length) {
		sketch.UI.alert('Update Text to Match Style Name…','Select at least one text layer.');
		return false;
	}

	selections.forEach(updateLayerText);

	function updateLayerText(textLayer) {
		var textLayerSharedStyleID = textLayer.sharedStyleID();
		var textLayerStyle = documentData.textStyleWithID(textLayerSharedStyleID);
		var textLayerStyleName = textLayerStyle.name();

		textLayer.setStringValue(textLayerStyleName);
		textLayer.setName(textLayerStyleName);
	}

	var message = 'The text layer name has been updated';

	if (selections.length > 1) {
		message = selections.length + ' text layer names have been updated';
	}

	sketch.UI.message(message);
}
