@import '../library.js';

var onRun = function(context) {
	var oldID = context.document.documentData().objectID();
	var newID = context.document.documentData().generateObjectID();

	sketch.UI.alert('Generate New ID','A new document ID, ' + newID + ', has been created for the document (the old ID was ' + oldID + ').\n\nThe document must be saved for the change to take effect.');
}
