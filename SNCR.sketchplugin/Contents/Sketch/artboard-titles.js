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

var strProblemFetchingSettings = "Unable to fetch settings";

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
	com.sncr.artboardTitles.preclude(context);
}

var include = function(context) {
	com.sncr.artboardTitles.include(context);
}

var create = function(context) {
	com.sncr.artboardTitles.create(context);
};

var settings = function(context) {
	com.sncr.artboardTitles.settings(context);
}

com.sncr.artboardTitles = {
	preclude: function(context) {
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
	},
	include: function(context) {
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
	},
	create: function(context) {
		// Document variables
		var doc = context.document || context.actionContext.document;
		var command = context.command;
		var page = doc.currentPage();
		var artboards = page.artboards().filteredArrayUsingPredicate(NSPredicate.predicateWithFormat("userInfo == nil || function(userInfo,'valueForKeyPath:',%@)." + strArtboardPrecludeKey + " != " + strArtboardPrecludeKeyValue,pluginDomain));;
		var layers = page.layers();

		// If artboards exist on the page...
		if (artboards.count() > 0) {
			// Get user settings
			var titleSettings = getTitleSettings(context);

			// If user settings were retrieved...
			if (titleSettings) {
				// Screen title settings
				var screenTitleOffset = parseInt(titleSettings.titleOffset);

				// Remove screen title style (the old style)
				deleteTextStyle('Layout/Screen Title');

				// Get screen title style (will add style if it doesn't exist) (the new style)
				var screenTitleStyle = getTextStyle(screenTitleStyleName,screenTitleStyleData);

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

				// Resize title and parents groups to account for children
				titleGroup.resizeToFitChildrenWithOption(0);
				parentGroup.resizeToFitChildrenWithOption(0);

				// Move parent group to the top of the layer list
				parentGroup.moveToLayer_beforeLayer(page,nil);

				// Deselect parent group
				parentGroup.select_byExpandingSelection(false,true);

				// If the function was not invoked by action...
				if (!context.actionContext) {
					// Lock the parent group
					parentGroup.setIsLocked(true);

					// Display feedback
					doc.showMessage(artboards.count() + strCreateTitlesCreatedTitles);
				}
			}
		}
		// If no artboards exist on the page...
		else {
			// If the function was not invoked by action...
			if (!context.actionContext) {
				// Display feedback
				displayDialog(strCreateTitlesPluginName,strCreateTitlesNoArtboards);
			}
		}
	},
	settings: function(context) {
		// Get user settings
		var titleSettings = getTitleSettings(context,"config");

		// If user settings were retrieved...
		if (titleSettings) {
			// Create titles with new settings
			com.sncr.artboardTitles.create(context);
		}
	}
}

function getTitleSettings(context,type) {
	// Context variables
	var doc = context.document || context.actionContext.document;
	var page = doc.currentPage();

	// Setting variables
	var defaultSettings = {};
	defaultSettings.titleType = 0;
	defaultSettings.titleOffset = '0';

	// Update default settings with cached settings
	defaultSettings = getCachedSettings(context,page,defaultSettings);

	// If type is set and equal to "config", operate in config mode...
	if (type && type == "config") {
		var alertWindow = COSAlertWindow.new();
		alertWindow.setMessageText('Create Artboard Titles');

		var titleType = createRadioButtons(["Above artboards","Below artboards"],defaultSettings.titleType);
		alertWindow.addAccessoryView(titleType);

		alertWindow.addTextLabelWithValue('Vertical offset:');

		var titleOffset = createField(defaultSettings.titleOffset);
		alertWindow.addAccessoryView(titleOffset);

		// Buttons
		alertWindow.addButtonWithTitle('OK');
		alertWindow.addButtonWithTitle('Cancel');

		// Set key order and first responder
		setKeyOrder(alertWindow,[
			titleType,
			titleOffset
		]);

		var responseCode = alertWindow.runModal();

		if (responseCode == 1000) {
			try {
				context.command.setValue_forKey_onLayer([[titleType selectedCell] tag],"titleType",page);
				context.command.setValue_forKey_onLayer([titleOffset stringValue],"titleOffset",page);
			}
			catch(err) {
				log("Unable to save settings.");
			}

			return {
				titleType : [[titleType selectedCell] tag],
				titleOffset : [titleOffset stringValue]
			}
		} else return false;
	}
	// Otherwise operate in run mode...
	else {
		// Return updated settings
		return {
			titleType : defaultSettings.titleType,
			titleOffset : defaultSettings.titleOffset
		}
	}
}

function getCachedSettings(context,location,settings) {
	try {
		for (i in settings) {
			var value = context.command.valueForKey_onLayer_forPluginIdentifier(i,location,pluginDomain);
			if (value) settings[i] = value;
		}

		return settings;
	} catch(err) {
		log(strProblemFetchingSettings);
	}
}
