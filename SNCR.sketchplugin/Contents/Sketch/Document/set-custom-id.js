@import '../library.js';

var onRun = function(context) {
	var oldID = context.document.documentData().objectID();

	sketch.UI.getInputFromUser(
		"Custom ID for Document:",
		{
			initialValue: '',
		},
		(err,val) => {
			if (err) {
				// most likely the user canceled the input
				return
			}

			if (val) {
				context.document.documentData().setObjectID(val);

				sketch.UI.message(oldID + ' has been replaced with ' + val);
			}
		}
	);
}
