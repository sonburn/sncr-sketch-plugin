@import '../library.js';

var onRun = function(context) {
	sketch.UI.alert('Current Document ID',context.document.documentData().objectID());
}
