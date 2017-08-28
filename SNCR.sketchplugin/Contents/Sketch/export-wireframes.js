@import 'lib/functions.js';

var pluginDomain = "com.sncr.sketch";
var filenamePrefix = "W";
var functionKey = "wireframeExport";

var strIncludeSlicePluginName = "Include Selected Slice";
var strIncludeSliceProblem = "Select one slice to include in Export Wireframes.";
var strIncludeSliceComplete = " is now included in Export Wireframes";

var strPrecludeSlicePluginName = "Preclude Selected Slice";
var strPrecludeSliceProblem = "Select one slice to preclude from Export Wireframes.";
var strPrecludeSliceComplete = " is now precluded from Export Wireframes";

var strExportWireframesPluginName = "Export All Wireframes";
var strExportWireframesProblem = "No wireframes were found to export.";
var strExportWireframesComplete = " wireframes were exported to your Downloads directory";

var strExportDialogIntro = "Select which wireframes to export.";
var strExportDialogOutro = "The export process may take some time, be patient.";

var include = function(context) {
	com.sncr.wireframeExport.include(context);
}

var preclude = function(context) {
	com.sncr.wireframeExport.preclude(context);
}

var exportAll = function(context) {
	com.sncr.wireframeExport.export(context);
}

com.sncr.wireframeExport = {
	include: function(context) {
		var doc = context.document;
		var selection = context.selection;

		if (selection.count() == 1 && selection[0] instanceof MSSliceLayer) {
			context.command.setValue_forKey_onLayer(true,functionKey,selection[0]);

			doc.showMessage(selection[0].name() + strIncludeSliceComplete);
		} else {
			displayDialog(strIncludeSlicePluginName,strIncludeSliceProblem);
		}
	},
	preclude: function(context) {
		var doc = context.document;
		var selection = context.selection;

		if (selection.count() == 1 && selection[0] instanceof MSSliceLayer) {
			context.command.setValue_forKey_onLayer(false,functionKey,selection[0]);

			doc.showMessage(selection[0].name() + strPrecludeSliceComplete);
		} else {
			displayDialog(strPrecludeSlicePluginName,strPrecludeSliceProblem);
		}
	},
	export: function(context) {
		var doc = context.document;

		var wireframes = [];
		var count = 1;

		var pages = doc.pages(),
			loop = pages.objectEnumerator(),
			page;

		while (page = loop.nextObject()) {
			var predicate = NSPredicate.predicateWithFormat("className == 'MSSliceLayer' && userInfo != nil && function(userInfo,'valueForKeyPath:',%@)." + functionKey + " == " + true,pluginDomain);

			var slices = page.children().filteredArrayUsingPredicate(predicate),
				loop2 = slices.objectEnumerator(),
				slice;

			while (slice = loop2.nextObject()) {
				var filename = filenamePrefix + count + " " + slice.name();
				var filepath = [@"~/Downloads" stringByExpandingTildeInPath] + "/" + filename + ".pdf";

				wireframes.push({
					source : slice,
					name : filename,
					path : filepath
				});

				count++;
			}
		}

		if (wireframes.length) {
			var exportList = confirmExport(wireframes);

			if (exportList.length) {
				for (var i = 0; i < exportList.length; i++) {
					[doc saveArtboardOrSlice:exportList[i]['source'] toFile:exportList[i]['path']];
				}

				doc.showMessage(exportList.length + strExportWireframesComplete);
			}
		} else {
			displayDialog(strExportWireframesPluginName,strExportWireframesProblem);
		}
	}
}

function confirmExport(wireframes) {
	var alertWindow = COSAlertWindow.new();
	alertWindow.setMessageText(strExportWireframesPluginName);

	alertWindow.addTextLabelWithValue(strExportDialogIntro);

	for (var i = 0; i < wireframes.length; i++) {
		alertWindow.addAccessoryView(createCheckbox({name:wireframes[i]['name'],value:i},1,NSMakeRect(0,0,300,18)));
	}

	alertWindow.addTextLabelWithValue(strExportDialogOutro);

	alertWindow.addButtonWithTitle('OK');
	alertWindow.addButtonWithTitle('Cancel');

	var responseCode = alertWindow.runModal();

	if (responseCode == 1000) {
		var slicesToRemove = [];

		for (var i = 0; i < wireframes.length; i++) {
			if ([[alertWindow viewAtIndex:i+1] state] == 0) slicesToRemove.push([[alertWindow viewAtIndex:i+1] tag]);
		}

		slicesToRemove.sort(function(a,b){ return b-a; });

		for (var i = 0; i < slicesToRemove.length; i++) {
			wireframes.splice(slicesToRemove[i],1);
		}

		return wireframes;
	} else return false;
}
