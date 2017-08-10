@import 'lib/functions.js';

// String variables
var strSymbolMasterName = "Wireframe/Section";
var strSectionTitleAdded = "Section title added.";
var strSectionTitleAddPluginName = "Add/Insert Section Title";
var strSectionTitleAddProblem = "Select only one layer location, or none, to add a section title.";
var strSectionTitleAddSymbol = "No symbol with the name \"" + strSymbolMasterName + "\" was found.";
var strSectionTitleLinked = " section title is now linked to ";
var strSectionTitleLinkOverride = "First add an override to the selected screen title.";
var strSectionTitleLinkPluginName = "Link Section Title";
var strSectionTitleLinkProblem = "Select one section title and one artboard to link.";
var strSectionTitleUnlinked = " screen title is no longer linked to ";
var strSectionTitlesAdded = " section title(s) added.";
var strSectionTitlesSelected = " section titles selected.";
var strSectionTitlesUnlinked = " section title(s) unlinked.";
var strSectionTitlesUpdated = "Section titles updated.";
var strSectionTitleUnlinkProblem = "Select a section title to unlink.";

// Configuration variables
var sectionTitleXOffset = 0;
var sectionTitleYOffset = -280; // Would be better to programmatically get symbol height (currently 172), and add to desired spacing (108)

// Function to add a screen title
var add = function(context) {
	// Context variables
	var doc = context.document;
	var selection = context.selection;
	var page = doc.currentPage();

	// Get the symbol master
	var symbolMaster = getSymbolByName(context,strSymbolMasterName);

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
				symbolInstance.frame().setY(selection[i].frame().y() + sectionTitleYOffset);

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

			// Display feedback
			doc.showMessage(count + strSectionTitlesAdded);
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
		displayDialog(strSectionTitleAddPluginName,strSectionTitleAddSymbol);
	}
}

// Function to link a screen title and artboard
var link = function(context) {
	// Context variables
	var doc = context.document;
	var selection = context.selection;
	var page = doc.currentPage();

	// Take action on selections...
	switch (selection.count()) {
		// If there are two selections...
		case 2:
			// Selection variables
			var firstItem = selection[0];
			var secondItem = selection[1];

			// If the first item is a symbol instance and symbol master name matches the provided name, and the second item is an artboard
			if ((firstItem instanceof MSSymbolInstance && firstItem.symbolMaster().name().trim() == strSymbolMasterName) && secondItem instanceof MSArtboardGroup) {
				linkTitle(firstItem,secondItem);
			}
			// If the first item is an artboard, and the second item is a symbol instance and symbol master name matches the provided name
			else if (firstItem instanceof MSArtboardGroup && (secondItem instanceof MSSymbolInstance && secondItem.symbolMaster().name().trim() == strSymbolMasterName)) {
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

	// Function to link a screen title to an artboard
	function linkTitle(title,artboard) {
		// If screen title has an override...
		if (title.overrides()) {
			// Set stored value for linked artboard
			context.command.setValue_forKey_onLayer(artboard.objectID(),"sncrScreenTitleLinkedTo",title);

			// Set name of screen title before altering
			var titleName = title.name();

			// Update the layer name, and indicate if linked
			updateLayerName(title,true);

			// Create a log event
			log(titleName + strSectionTitleLinked + artboard.name() + ".");

			// Display feedback
			doc.showMessage(titleName + strSectionTitleLinked + artboard.name() + ".");
		}
		// If screen title does not have an override...
		else {
			// Display feedback
			displayDialog(strSectionTitleLinkPluginName,strSectionTitleLinkOverride);
		}
	}
}

// Function to select all screen titles
var select = function(context) {
	// Context variables
	var doc = context.document;
	var page = doc.currentPage();

	// Deselect everything in the current page
	page.changeSelectionBySelectingLayers(nil);

	// Set a counter
	count = 0;

	// Get the symbol master instances, and construct a loop
	var sectionTitles = getSymbolByName(context,strSymbolMasterName).allInstances();
	var sectionTitlesLoop = sectionTitles.objectEnumerator();
	var sectionTitle;

	// Iterate through symbol instances...
	while (sectionTitle = sectionTitlesLoop.nextObject()) {
		// If the symbol instance is on current page...
		if (sectionTitle.parentPage() == page) {
			// Select the symbol instance while maintaining other selections
			sectionTitle.select_byExpandingSelection(true,true);

			// Iterate the counter
			count++;
		}
	}

	// Display feedback
	doc.showMessage(count + strSectionTitlesSelected);
}

// Function to unlink a screen title
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
			var linkedArtboard = context.command.valueForKey_onLayer("sncrScreenTitleLinkedTo",selection[i]);

			// If selection is linked to an artboard...
			if (linkedArtboard) {
				// Set linked artboard value to nil
				context.command.setValue_forKey_onLayer(nil,"sncrScreenTitleLinkedTo",selection[i]);

				// Update the layer name, and indicate if linked
				updateLayerName(selection[i],false);

				// Get linked artboard object
				var artboard = findLayerByID(selection[i].parentGroup(),linkedArtboard);

				// If artboard exists, use artboard name for name, otherwise use artboard ID
				artboardName = (artboard) ? artboard.name() : linkedArtboard;

				// Create a log event
				log(selection[i].name() + strSectionTitleUnlinked + artboardName + ".");

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
		doc.showMessage(strSectionTitleUnlinkProblem);
	}
}

// Function to update all screen titles
var update = function(context) {
	// Context variables
	var doc = context.document;

	// Get the symbol master instances, and construct a loop
	var sectionTitles = getSymbolByName(context,strSymbolMasterName).allInstances();
	var sectionTitlesLoop = sectionTitles.objectEnumerator();
	var sectionTitle;

	// Iterate through symbol instances...
	while (sectionTitle = sectionTitlesLoop.nextObject()) {
		// Assume symbol instance is not linked
		var isLinked = false;

		// Get stored value for linked artboard
		var linkedArtboard = context.command.valueForKey_onLayer("sncrScreenTitleLinkedTo",sectionTitle);

		// If symbol instance is linked to an artboard...
		if (linkedArtboard) {
			// Get linked artboard object, if it resides on the symbol instance page
			var artboard = findLayerByID(sectionTitle.parentPage(),linkedArtboard);

			// If artboard object exists...
			if (artboard) {
				// Set symbol instance x/y in relation to artboard, with offsets
				sectionTitle.frame().setX(artboard.frame().x() + sectionTitleXOffset);
				sectionTitle.frame().setY(artboard.frame().y() + sectionTitleYOffset);

				// Set isLinked to true
				isLinked = true;
			}
			// If artboard object does not exist...
			else {
				// Remove stored value for linked artboard
				context.command.setValue_forKey_onLayer(nil,"sncrScreenTitleLinkedTo",sectionTitle);

				// Create a log event
				log(sectionTitle.name() + strSectionTitleUnlinked + linkedArtboard + ".");
			}
		}

		// Update the symbol instance name, and indicate if linked
		updateLayerName(sectionTitle,isLinked);

		// Lock the symbol instance
		sectionTitle.setIsLocked(1);
	}

	// Display feedback
	doc.showMessage(strSectionTitlesUpdated);
};

// Function to manage section title settings
var settings = function(context) {
	var sectionTitleSettings = getSectionTitleSettings();

	function getSectionTitleSettings() {
		displayDialog("Section Title Settings","Coming soon...");
	}
}
