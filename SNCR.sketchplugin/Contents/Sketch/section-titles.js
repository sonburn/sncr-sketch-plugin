@import 'lib/functions.js';

// Plugin variables
var pluginDomain = "com.sncr.sketch";
var sectionTitleSymbolMasterName = "Wireframe/Section";
var sectionTitleXOffset = 0;
var sectionTitleYOffset = -108;
var sectionTitleLinkKey = "sncrScreenTitleLinkedTo";
var sectionTitleLinkKeyQuery = "userInfo != nil && function(userInfo,'valueForKeyPath:',%@)." + sectionTitleLinkKey + " != nil";
var sectionTitleLinkPrefix = "🔗 ";

// String variables
var strSectionTitleAddPluginName = "Add/Insert Section Title";
var strSectionTitleAddSymbolProblem = "A symbol with the name \"" + sectionTitleSymbolMasterName + "\" is required.";
var strSectionTitleAdded = "Section title added";
var strSectionTitlesAdded = " section title(s) added";

var strSectionTitleLinkPluginName = "Link Section Title";
var strSectionTitleLinkProblem = "Select one section title and one artboard to link.";
var strSectionTitleLinked = " section title is now linked to ";

var strSectionTitleUnlinkPluginName = "Unlink Section Title";
var strSectionTitleUnlinkProblem = "Select a section title to unlink.";
var strSectionTitleUnlinked = " section title is no longer linked to ";
var strSectionTitlesUnlinked = " section title(s) unlinked";

var strSectionTitlesSelected = " section title(s) selected";

var strSectionTitlesUpdated = " section title(s) updated";
var strSectionTitlesUpdateUnlinked = " section title(s) were unlinked due to missing artboards";

// Function to add a section title
var add = function(context) {
	// Context variables
	var doc = context.document;
	var selection = context.selection;
	var page = doc.currentPage();
	var symbols = doc.documentData().allSymbols();

	// Get the symbol master
	var symbolMaster = getObjectByName(symbols,sectionTitleSymbolMasterName);

	// If the symbol master exists...
	if (symbolMaster) {
		// If there are selections...
		if (selection.count() > 0) {
			// Set a counter
			count = 0;

			// Iterate through selections...
			for (var i = 0; i < selection.count(); i++) {
				// Create a symbol instance
				var symbolInstance = symbolMaster.newSymbolInstance();

				// Set layer x/y in relation to artboard, with offsets
				symbolInstance.frame().setX(selection[i].frame().x() + sectionTitleXOffset);
				symbolInstance.frame().setY(selection[i].frame().y() + sectionTitleYOffset - symbolMaster.frame().height());

				// Insert the symbol instance below the selection
				selection[i].parentGroup().insertLayer_atIndex(symbolInstance,getLayerIndex(selection[i]));

				// If more than one item selected...
				if (selection.count() > 1) {
					// Deselect the selection
					selection[i].select_byExpandingSelection(false,true);
				}

				// Select the symbol instance, and maintain other selections
				symbolInstance.select_byExpandingSelection(true,true);

				// Iterate the counter
				count++;
			}

			// If adding one screen title...
			if (selection.count() == 1) {
				// Link the screen title to the artboard
				link(context);
			}
			// If adding more than one screen title...
			else {
				// Display feedback
				doc.showMessage(count + strSectionTitlesAdded);
			}
		}
		// If nothing is selected...
		else {
			// Create a symbol instance
			var symbolInstance = symbolMaster.newSymbolInstance();

			// Add the symbol instance to page
			page.addLayers([symbolInstance]);

			// Select the symbol instance
			symbolInstance.select_byExpandingSelection(true,false);

			// Display feedback
			doc.showMessage(strSectionTitleAdded);
		}
	}
	// If the symbol master does not exist...
	else {
		// Display feedback
		displayDialog(strSectionTitleAddPluginName,strSectionTitleAddSymbolProblem);
	}
}

// Function to link a section title and artboard
var link = function(context) {
	// Context variables
	var doc = context.document;
	var page = doc.currentPage();
	var selections = page.selectedLayers().layers();

	// Take action on selections...
	switch (selections.count()) {
		// If there are two selections...
		case 2:
			// Selection variables
			var firstItem = selections[0];
			var secondItem = selections[1];

			// If the first item is a symbol instance and symbol master name matches the provided name, and the second item is an artboard
			if ((firstItem instanceof MSSymbolInstance && firstItem.symbolMaster().name().trim() == sectionTitleSymbolMasterName) && secondItem instanceof MSArtboardGroup) {
				linkTitle(firstItem,secondItem);
			}
			// If the first item is an artboard, and the second item is a symbol instance and symbol master name matches the provided name
			else if (firstItem instanceof MSArtboardGroup && (secondItem instanceof MSSymbolInstance && secondItem.symbolMaster().name().trim() == sectionTitleSymbolMasterName)) {
				linkTitle(secondItem,firstItem);
			}
			// If the selections do not contain a section title symbol instance and artboard
			else {
				// Display feedback
				displayDialog(strSectionTitleLinkPluginName,strSectionTitleLinkProblem);
			}

			break;
		// If there are not two selections...
		default:
			// Display feedback
			displayDialog(strSectionTitleLinkPluginName,strSectionTitleLinkProblem);
	}

	// Function to link a section title to an artboard
	function linkTitle(title,artboard) {
		// Set stored value for linked artboard
		context.command.setValue_forKey_onLayer(artboard.objectID(),sectionTitleLinkKey,title);

		// Set the title name
		var titleName = (title.overrides()) ? sectionTitleLinkPrefix + title.overrides().allValues()[0] : sectionTitleLinkPrefix + title.name();

		// Update the title name
		title.setName(titleName);

		// Create a log event
		log(titleName + strSectionTitleLinked + artboard.name());

		// Display feedback
		doc.showMessage(titleName + strSectionTitleLinked + artboard.name());
	}
}

// Function to select all linked section titles on page
var select = function(context) {
	// Context variables
	var doc = context.document;
	var page = doc.currentPage();

	// Deselect everything in the current page
	page.changeSelectionBySelectingLayers(nil);

	// Set a counter
	count = 0;

	// Get the section titles and construct a loop
	var layers = page.children().filteredArrayUsingPredicate(NSPredicate.predicateWithFormat(sectionTitleLinkKeyQuery,pluginDomain));
	var loop = layers.objectEnumerator(), layer;

	// Iterate through section titles...
	while (layer = loop.nextObject()) {
		// Select the section title while maintaining other selections
		layer.select_byExpandingSelection(true,true);

		// Iterate the counter
		count++;
	}

	// Display feedback
	doc.showMessage(count + strSectionTitlesSelected);
}

// Function to unlink section title(s)
var unlink = function(context) {
	// Context variables
	var doc = context.document;
	var selection = context.selection;

	// If there are selections...
	if (selection.count() > 0) {
		// Set a counter
		var count = 0;

		// Iterate through selections...
		for (var i = 0; i < selection.count(); i++) {
			// Get stored value for linked artboard
			var linkedArtboard = context.command.valueForKey_onLayer(sectionTitleLinkKey,selection[i]);

			// If selection is linked to an artboard...
			if (linkedArtboard) {
				// Set linked artboard value to nil
				context.command.setValue_forKey_onLayer(nil,sectionTitleLinkKey,selection[i]);

				// Set the title name
				var titleName = selection[i].name().replace(sectionTitleLinkPrefix,""));

				// Update the title name
				selection[i].setName(titleName);

				// For logging purposes, get linked artboard object
				var artboard = findLayerByID(selection[i].parentGroup(),linkedArtboard);

				// If artboard exists, use artboard name for name, otherwise use artboard ID
				artboardName = (artboard) ? artboard.name() : linkedArtboard;

				// Create a log event
				log(titleName + strSectionTitleUnlinked + artboardName);

				// Iterate the counter
				count++;
			}

			// Deselect current selection
			selection[i].select_byExpandingSelection(false,true);
		}

		// Display feedback
		doc.showMessage(count + strSectionTitlesUnlinked);
	}
	// If there are no selections...
	else {
		// Display feedback
		displayDialog(strSectionTitleUnlinkPluginName,strSectionTitleUnlinkProblem);
	}
}

// Function to update all section titles on page
var update = function(context) {
	// Context variables
	var doc = MSDocument.currentDocument();
	var page = doc.currentPage();

	// Set counters
	var updateCount = 0;
	var removeCount = 0;

	// Get the section titles and construct a loop
	var layers = page.children().filteredArrayUsingPredicate(NSPredicate.predicateWithFormat(sectionTitleLinkKeyQuery,pluginDomain));
	var loop = layers.objectEnumerator(), layer;

	// Iterate through section titles...
	while (layer = loop.nextObject()) {
		// Get stored value for linked artboard
		var linkedArtboard = context.command.valueForKey_onLayer(sectionTitleLinkKey,layer);

		// Get linked artboard object, if it resides on the artboard description page
		var artboard = page.artboards().filteredArrayUsingPredicate(NSPredicate.predicateWithFormat("objectID == %@",linkedArtboard,pluginDomain)).firstObject();

		// If artboard object exists...
		if (artboard) {
			// Set screen title x/y in relation to artboard, with offsets
			layer.frame().setX(artboard.frame().x() + sectionTitleXOffset);
			layer.frame().setY(artboard.frame().y() + sectionTitleYOffset - layer.frame().height());

			// Set layer name
			var layerName = (layer.overrides()) ? sectionTitleLinkPrefix + layer.overrides().allValues()[0] : sectionTitleLinkPrefix + artboard.name();

			// Update the layer name
			layer.setName(layerName);

			// Lock the section title
			layer.setIsLocked(1);

			// Iterate counter
			updateCount++;
		}
		// If artboard object does not exist...
		else {
			// Remove stored value for linked artboard
			context.command.setValue_forKey_onLayer(nil,sectionTitleLinkKey,layer);

			// Set layer name
			var layerName = (layer.overrides()) ? layer.overrides().allValues()[0] : layer.name().replace(sectionTitleLinkPrefix,"");

			// Update the layer name
			layer.setName(layerName);

			// Unlock the section title
			layer.setIsLocked(0);

			// Create a log event
			log(layerName + strSectionTitleUnlinked + linkedArtboard);

			// Iterate counters
			updateCount++;
			removeCount++;
		}
	}

	// If the function was not invoked by action...
	if (!context.actionContext) {
		// If any artboard links were removed
		if (removeCount > 0) {
			// Display feedback
			doc.showMessage(updateCount + strSectionTitlesUpdated + ", " + removeCount + strSectionTitlesUpdateUnlinked);
		} else {
			// Display feedback
			doc.showMessage(updateCount + strSectionTitlesUpdated);
		}
	}
};

// Function to manage section title settings
var settings = function(context) {
	var sectionTitleSettings = getSectionTitleSettings();

	function getSectionTitleSettings() {
		displayDialog("Section Title Settings","Coming soon...");
	}
}
