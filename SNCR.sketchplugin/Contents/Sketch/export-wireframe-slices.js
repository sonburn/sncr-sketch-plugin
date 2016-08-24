var onRun = function(context) {
	// Document variables
	var doc = context.document;
	var pages = [doc pages];

	// Export variables
	var exportCount = 0;

	// Iterate through each page in the document
	for (var i = 0; i < pages.count(); i++) {
		// Page variables
		var page = pages.objectAtIndex(i);
		var pageName = page.name().trim();

		// Strip leading dash from page name if one exists
		if (pageName.charAt(0) == "-") pageName = pageName.substr(1);

		// Find layer that matches page name, and is a slice
		var slice = findLayerByName(page,pageName,MSSliceLayer);

		// If slice exists...
		if (slice) {
			// Increment export counter
			exportCount++;

			// File variables
			var fileName = "/W" + exportCount + " " + pageName + ".pdf";
			var filePath = [@"~/Downloads" stringByExpandingTildeInPath] + fileName;

			// Save the slice as a PDF in the user's Downloads directory
			[doc saveArtboardOrSlice:slice toFile:filePath];
		}
	}

	// Feedback to user
	if (exportCount > 0) {
		doc.showMessage(exportCount + " wireframe slices were exported!");
	} else {
		doc.showMessage("No wireframe slices were found to export.");
	}

	function findLayerByName(scope,layerName,type) {
		var scope = scope.layers();

		if (scope) {
			for (var i = 0; i < scope.count(); i++) {
				var name = scope.objectAtIndex(i).name().trim();

				if ((!type && name == layerName) || (type && name == layerName && scope.objectAtIndex(i) instanceof type)) {
					return scope.objectAtIndex(i);
				}
			}
		}

		return false;
	}
};
