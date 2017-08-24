@import 'lib/functions.js';

var pluginDomain = "com.sncr.sketch";

var strArtboardPrecludeKey = "createArtboardTitles";
var strArtboardPrecludeKeyValue = false;

// String variables
var strArtboardPrecludePluginName = "Preclude Selected Artboards";
var strArtboardPrecludeProblem = "Select artboard(s) to mark as precluded from Create Artboard Titles.";
var strArtboardPrecludeComplete = " is now precluded from Create Artboard Titles";
var strArtboardPrecludesComplete = " artboards are now precluded from Create Artboard Titles";

var strArtboardIncludePluginName = "Include Selected Artboards";
var strArtboardIncludeProblem = "Select artboard(s) to mark as included in Create Artboard Titles.";
var strArtboardIncludeComplete = " is now included in Create Artboard Titles";
var strArtboardIncludesComplete = " artboards are now included in Create Artboard Titles";

var strCreateTitlesPluginName = "Create Artboard Titles";
var strCreateTitlesCreatedTitles = " screen title(s) created!";
var strCreateTitlesNoArtboards = "There are no artboards on the current page, therefore no titles to create.";
var strCreateTitlesNoSettings = "There was a problem retrieving the settings required to create titles.";

// Group variables
var parentGroupName = "SNCR";
var titleGroupName = "Titles";

// Screen title style
var screenTitleStyleName = "Wireframe/Screen Title";
var screenTitleStyleData = {
	fontFace : "Neue Haas Grotesk Text Std 75 Bold",
	fontSize : 18,
	lineHeight : 48,
	textAlignment : 0
}

var preclude = function(context) {
	var doc = context.document;
	var selection = context.selection;

	var count = 0;

	if (selection.count()) {
		for (var i = 0; i < selection.count(); i++) {
			if (selection[i] instanceof MSArtboardGroup) {
				context.command.setValue_forKey_onLayer(strArtboardPrecludeKeyValue,strArtboardPrecludeKey,selection[i]);

				selection[i].select_byExpandingSelection(false,true);

				count++;

				log(selection[i].name() + strArtboardPrecludeComplete);
			}
		}

		if (selection.count() == 1) {
			doc.showMessage(selection[0].name() + strArtboardPrecludeComplete);
		} else {
			doc.showMessage(count + strArtboardPrecludesComplete);
		}
	} else {
		displayDialog(strArtboardPrecludePluginName,strArtboardPrecludeProblem);
	}
}

var include = function(context) {
	var doc = context.document;
	var selection = context.selection;

	var count = 0;

	if (selection.count()) {
		for (var i = 0; i < selection.count(); i++) {
			if (selection[i] instanceof MSArtboardGroup) {
				context.command.setValue_forKey_onLayer(nil,strArtboardPrecludeKey,selection[i]);

				selection[i].select_byExpandingSelection(false,true);

				count++;

				log(selection[i].name() + strArtboardIncludeComplete);
			}
		}

		if (selection.count() == 1) {
			doc.showMessage(selection[0].name() + strArtboardIncludeComplete);
		} else {
			doc.showMessage(count + strArtboardIncludesComplete);
		}
	} else {
		displayDialog(strArtboardIncludePluginName,strArtboardIncludeProblem);
	}
}

// Function to create artboard titles
var create = function(context) {
	// Document variables
	var doc = context.document;
	var command = context.command;
	var page = doc.currentPage();
	var artboards = page.artboards().filteredArrayUsingPredicate(NSPredicate.predicateWithFormat("userInfo == nil || function(userInfo,'valueForKeyPath:',%@)." + strArtboardPrecludeKey + " != " + strArtboardPrecludeKeyValue,pluginDomain));;
	var layers = page.layers();

	// If artboards exist on the page...
	if (artboards.count() > 0) {
		// Get user settings
		var titleSettings = showTitleSettings();

		// If user settings were retrieved...
		if (titleSettings) {
			// Screen title settings
			var screenTitleOffset = parseInt(titleSettings.titleOffset);

			// Remove screen title style (the old style)
			deleteTextStyle(context,'Layout/Screen Title');

			// Get screen title style (will add style if it doesn't exist) (the new style)
			var screenTitleStyle = getTextStyle(context,screenTitleStyleName,screenTitleStyleData);

			// Set parent group
			var parentGroup = getParentGroup(page,parentGroupName);

			// Find and remove screen titles group if it exists on the page (the old location)
			page.removeLayer(findLayerByName(page,titleGroupName));

			// Find and remove screen titles group if it exists in the parent group (the new location)
			parentGroup.removeLayer(findLayerByName(parentGroup,titleGroupName));

			// Create new screen title group
			var titleGroup = MSLayerGroup.new();
			titleGroup.setName(titleGroupName);
			titleGroup.frame().setX(0 - parentGroup.frame().x());
			titleGroup.frame().setY(0 - parentGroup.frame().y());
			titleGroup.setIsLocked(true);
			titleGroup.setHasClickThrough(true);

			// Iterate through the artboards...
			for (var i = 0; i < artboards.count(); i++) {
				// Current artboard
				var artboard = artboards.objectAtIndex(i);

				// Create a screen title
				var screenTitle = MSTextLayer.new();
				screenTitle.setStringValue(artboard.name());
				screenTitle.setName(artboard.name());
				screenTitle.setStyle(screenTitleStyle.newInstance());

				// Set screen title x/y position
				screenTitle.frame().setX(artboard.frame().x());
				screenTitle.frame().setY(artboard.frame().y() + artboard.frame().height() + screenTitleOffset);

				// If user wants screen title below artboards...
				if (titleSettings.titleType == 0) {
					// Adjust screen title y position
					screenTitle.frame().setY(artboard.frame().y() - (screenTitleStyleData.lineHeight + screenTitleOffset));
				}

				// Add screen title to title group
				titleGroup.addLayers([screenTitle]);
			}

			// Add title group to parent group
			parentGroup.addLayers([titleGroup]);

			// Resize title group to account for children
			titleGroup.resizeToFitChildrenWithOption(0);

			// Display feedback
			doc.showMessage(artboards.count() + strCreateTitlesCreatedTitles);
		}
		// If user settings were not retrieved...
		else {
			// Display feedback
			displayDialog(strCreateTitlesPluginName,strCreateTitlesNoSettings);
		}
	}
	// If no artboards exist on the page...
	else {
		// Display feedback
		displayDialog(strCreateTitlesPluginName,strCreateTitlesNoArtboards);
	}

	function showTitleSettings() {
		var titleType = 0;
		var titleOffset = '0';

		// Get cached settings
		try {
			if ([command valueForKey:"titleType" onDocument:context.document.documentData()]) {
				titleType = [command valueForKey:"titleType" onDocument:context.document.documentData()];
			}

			if ([command valueForKey:"titleOffset" onDocument:context.document.documentData()]) {
				titleOffset = [command valueForKey:"titleOffset" onDocument:context.document.documentData()];
			}
		}
		catch(err) {
			log("Unable to fetch settings.");
		}

		var alertWindow = COSAlertWindow.new();

		alertWindow.setMessageText('Create Artboard Titles');

		alertWindow.addAccessoryView(createRadioButtons(["Above artboards","Below artboards"],titleType));
		var fieldOne = alertWindow.viewAtIndex(0);

		alertWindow.addTextLabelWithValue('Vertical offset:');
		alertWindow.addAccessoryView(helpers.createField(titleOffset));
		var fieldTwo = alertWindow.viewAtIndex(2);

		alertWindow.addButtonWithTitle('OK');
		alertWindow.addButtonWithTitle('Cancel');

		// Set first responder and key order
		alertWindow.alert().window().setInitialFirstResponder(fieldOne);
		fieldOne.setNextKeyView(fieldTwo);

		var responseCode = alertWindow.runModal();

		if (responseCode == 1000) {
			try {
				[command setValue:[[[alertWindow viewAtIndex:0] selectedCell] tag] forKey:"titleType" onDocument:context.document.documentData()];
				[command setValue:[[alertWindow viewAtIndex:2] stringValue] forKey:"titleOffset" onDocument:context.document.documentData()];
			}
			catch(err) {
				log("Unable to save settings.");
			}

			return {
				titleType : [[[alertWindow viewAtIndex:0] selectedCell] tag],
				titleOffset : [[alertWindow viewAtIndex:2] stringValue]
			}
		} else return false;
	}
};
