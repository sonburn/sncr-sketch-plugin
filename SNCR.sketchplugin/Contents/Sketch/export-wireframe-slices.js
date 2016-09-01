@import 'lib/functions.js'

var onRun = function(context) {
	// Document variables
	var doc = context.document;
	var pages = [doc pages];

	// Slice variables
	var sliceList = [];
	var sliceCount = 0;

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
			// Increment slice counter
			sliceCount++;

			// File variables
			var fileName = "W" + sliceCount + " " + pageName;
			var filePath = [@"~/Downloads" stringByExpandingTildeInPath] + "/" + fileName + ".pdf";

			// Add to sliceList array
			sliceList.push({
					name: fileName,
					source: slice,
					path: filePath
			});
		}
	}

	// If sliceList array has slices...
	if (sliceList.length > 0) {
		// Have user confirm which slices to export
		var exportList = confirmSliceList(sliceList);

		// If sliceList array still has slices...
		if (exportList.length > 0) {
			// Export each slice to the provided file path
			for (var i = 0; i < exportList.length; i++) {
				[doc saveArtboardOrSlice:exportList[i]['source'] toFile:exportList[i]['path']];
			}

			// Feedback to user
			doc.showMessage(sliceList.length + " wireframes were exported to your downloads directory!");
		} else {
			// Feedback to user
			doc.showMessage("No wireframes were selected to export.");
		}
	} else {
		// Feedback to user
		doc.showMessage("No wireframes were found to export.");
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

function confirmSliceList(sliceList) {
	var exportList = sliceList;

	var alertWindow = COSAlertWindow.new();

	[alertWindow setMessageText:@'Export Wireframe Slices'];
	[alertWindow addTextLabelWithValue:@'Select which wireframes to export...'];

	//[alertWindow addAccessoryView: helpers.createCheckbox({name:"All/None",value:i},1,NSMakeRect(0,0,300,30))];

	for (var i = 0; i < exportList.length; i++) {
		[alertWindow addAccessoryView: helpers.createCheckbox({name:exportList[i]['name'],value:i},1,NSMakeRect(0,0,300,15))];
	}

	[alertWindow addTextLabelWithValue:@'The export process may take some time, be patient.'];

	[alertWindow addButtonWithTitle:@'Save'];
	[alertWindow addButtonWithTitle:@'Cancel'];

	var responseCode = alertWindow.runModal();

	if (responseCode == 1000) {
		// List of slices user does not want to print
		var slicesToRemove = [];

		//For each slice in the main exportList...
		for (var i = 0; i < exportList.length; i++) {
			// Shift the index to account for items before the list of checkboxes
			var indexShift = i + 1;

			// If the corresponding checkbox for this slice is unchecked...
			if ([[alertWindow viewAtIndex:indexShift] state] == 0) {
				// Add this item to the list of slices to remove
				slicesToRemove.push([[alertWindow viewAtIndex:indexShift] tag]);
			}
		}

		// Reverse the order of the list of items to remove, as not to create index mismatches while removing
		slicesToRemove.sort(function(a,b){ return b-a; });

		// For each item in the list of slices to remove...
		for (var i = 0; i < slicesToRemove.length; i++) {
			// Remove the slice from the main exportList
			exportList.splice(slicesToRemove[i],1);
		}
	} else {
		exportList = new Object();
	}

	return exportList;
}
