@import 'lib/functions.js';

// Plugin variables
var pluginDomain = "com.sncr.sketch";
var parentGroupName = "SNCR";
var artboardDescGroupName = "Descriptions";
var artboardDescStyleName = "Wireframe/Artboard Description";
var artboardDescXOffset = 0;
var artboardDescYOffset = 24;
var artboardDescLinkKey = "linkedToArtboard";
var artboardDescLinkKeyQuery = "userInfo != nil && function(userInfo,'valueForKeyPath:',%@)." + artboardDescLinkKey + " != nil";
var artboardDescLinkPrefix = "🔗 ";

// String variables
var strArtboardDescLinkPluginName = "Link Artboard Description";
var strArtboardDescLinkProblem = "Select one artboard description and one artboard to link.";
var strArtboardDescLinked = " is now linked to ";
var strArtboardDescUnlinked = " artboard description is no longer linked to ";
var strArtboardDescsSelected = " artboard descriptions selected";
var strArtboardDescsUpdated = " artboard description(s) updated";
var strArtboardDescsUpdateUnlinked = " artboard description(s) were unlinked due to missing artboards";

// Function to link a artboard description and artboard
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

			// If the first item is a text layer and text style name matches the provided name, and the second item is an artboard
			if ((firstItem instanceof MSTextLayer && firstItem.sharedObject() && firstItem.sharedObject().name() == artboardDescStyleName) && secondItem instanceof MSArtboardGroup) {
				linkArtboardDesc(firstItem,secondItem);
			}
			// If the first item is an artboard, and the second item is a text layer and text style name matches the provided name
			else if (firstItem instanceof MSArtboardGroup && (secondItem instanceof MSTextLayer && secondItem.sharedObject() && secondItem.sharedObject().name() == artboardDescStyleName)) {
				linkArtboardDesc(secondItem,firstItem);
			}
			// If the selections do not contain a artboard description text layer and artboard
			else {
				// Display feedback
				displayDialog(strArtboardDescLinkPluginName,strArtboardDescLinkProblem);
			}

			break;
		// If there are not two selections...
		default:
			// Display feedback
			displayDialog(strArtboardDescLinkPluginName,strArtboardDescLinkProblem);
	}

	// Function to link a artboard description to an artboard
	function linkArtboardDesc(layer,artboard) {
		// Set stored value for linked artboard
		context.command.setValue_forKey_onLayer(artboard.objectID(),artboardDescLinkKey,layer);

		// Set parent group
		var parentGroup = findLayerByName(page,parentGroupName);

		// If parent group does not exist...
		if (!parentGroup) {
			// Create parent group
			var parentGroup = MSLayerGroup.new();
			parentGroup.setName(parentGroupName);
			parentGroup.frame().setX(0);
			parentGroup.frame().setY(0);

			// Add parent group to page
			page.addLayers([parentGroup]);
		}

		// Set/reset parent group values
		parentGroup.setIsLocked(true);
		parentGroup.setHasClickThrough(true);

		// Set annotation group
		var noteGroup = findLayerByName(parentGroup,artboardDescGroupName);

		// If annotation group does not exist...
		if (!noteGroup) {
			// Create annotation group
			var noteGroup = MSLayerGroup.new();
			noteGroup.setName(artboardDescGroupName);
			noteGroup.frame().setX(0 - parentGroup.frame().x());
			noteGroup.frame().setY(0 - parentGroup.frame().y());

			// Add note group to page
			parentGroup.addLayers([noteGroup]);
		}

		// Set/reset note group values
		noteGroup.setIsLocked(true);
		noteGroup.setHasClickThrough(true);

		// Set artboard description x/y in relation to artboard, with offsets
		layer.frame().setX(artboard.frame().x() + artboardDescXOffset);
		layer.frame().setY(artboard.frame().y() + artboard.frame().height() + artboardDescYOffset);

		// Set artboard description width
		layer.frame().setWidth(artboard.frame().width());

		// If the artboard description is not in the note group...
		if (layer.parentGroup() != noteGroup) {
			// Move the artboard description to the note group
			layer.moveToLayer_beforeLayer(noteGroup,nil);

			// Deselect the artboard description (for some reason moveToLayer_beforeLayer selects it)
			layer.select_byExpandingSelection(false,true);
		}

		// Resize note and parent groups to account for children
		noteGroup.resizeToFitChildrenWithOption(0);
		parentGroup.resizeToFitChildrenWithOption(0);

		// Set layer name
		var layerName = artboardDescLinkPrefix + artboard.name();

		// Update the layer name
		layer.setName(layerName);

		// Create a log event
		log(layerName + strArtboardDescLinked + artboard.name());

		// Display feedback
		doc.showMessage(layerName + strArtboardDescLinked + artboard.name());
	}
}

// Function to select all linked artboard descriptions on page
var select = function(context) {
	// Context variables
	var doc = context.document;
	var page = doc.currentPage();

	// Deselect everything in the current page
	page.changeSelectionBySelectingLayers(nil);

	// Set a counter
	var count = 0;

	// Get the artboard descriptions and construct a loop
	var layers = page.children().filteredArrayUsingPredicate(NSPredicate.predicateWithFormat(artboardDescLinkKeyQuery,pluginDomain));
	var loop = layers.objectEnumerator(), layer;

	// Iterate through artboard descriptions...
	while (layer = loop.nextObject()) {
		// Select the artboard description while maintaining other selections
		layer.select_byExpandingSelection(true,true);

		// Iterate the counter
		count++;
	}

	// Display feedback
	doc.showMessage(count + strArtboardDescsSelected);
}

// Function to update all artboard descriptions on page
var update = function(context) {
	// Context variables
	var doc = context.document;
	var page = doc.currentPage();

	// Set counters
	var updateCount = 0;
	var removeCount = 0;

	// Set parent group
	var parentGroup = findLayerByName(page,parentGroupName);

	// If parent group does not exist...
	if (!parentGroup) {
		// Create parent group
		var parentGroup = MSLayerGroup.new();
		parentGroup.setName(parentGroupName);
		parentGroup.frame().setX(0);
		parentGroup.frame().setY(0);

		// Add parent group to page
		page.addLayers([parentGroup]);
	}

	// Set/reset parent group values
	parentGroup.setIsLocked(true);
	parentGroup.setHasClickThrough(true);

	// Set annotation group
	var noteGroup = findLayerByName(parentGroup,artboardDescGroupName);

	// If annotation group does not exist...
	if (!noteGroup) {
		// Create annotation group
		var noteGroup = MSLayerGroup.new();
		noteGroup.setName(artboardDescGroupName);

		// Add note group to page
		parentGroup.addLayers([noteGroup]);
	}

	// Set/reset note group values
	noteGroup.frame().setX(0 - parentGroup.frame().x());
	noteGroup.frame().setY(0 - parentGroup.frame().y());
	noteGroup.setIsLocked(true);
	noteGroup.setHasClickThrough(true);

	// Get the artboard descriptions and construct a loop
	var layers = page.children().filteredArrayUsingPredicate(NSPredicate.predicateWithFormat(artboardDescLinkKeyQuery,pluginDomain));
	var loop = layers.objectEnumerator(), layer;

	// Iterate through artboard descriptions...
	while (layer = loop.nextObject()) {
		// Get stored value for linked artboard
		var linkedArtboard = context.command.valueForKey_onLayer(artboardDescLinkKey,layer);

		// Get linked artboard object, if it resides on the artboard description page
		var artboard = page.artboards().filteredArrayUsingPredicate(NSPredicate.predicateWithFormat("objectID == %@",linkedArtboard,pluginDomain)).firstObject();

		// If artboard object exists...
		if (artboard) {
			// Set artboard description x/y in relation to artboard, with offsets
			layer.frame().setX(artboard.frame().x() + artboardDescXOffset);
			layer.frame().setY(artboard.frame().y() + artboard.frame().height() + artboardDescYOffset);

			// Set artboard description width
			layer.frame().setWidth(artboard.frame().width());

			// If the artboard description is not in the note group...
			if (layer.parentGroup() != noteGroup) {
				// Move the artboard description to the note group
				layer.moveToLayer_beforeLayer(noteGroup,nil);

				// Deselect the artboard description (for some reason moveToLayer_beforeLayer selects it)
				layer.select_byExpandingSelection(false,true);
			}

			// Set layer name
			var layerName = artboardDescLinkPrefix + artboard.name();

			// Update the layer name
			layer.setName(layerName);

			// Iterate counter
			updateCount++;
		}
		// If artboard object does not exist...
		else {
			// Remove stored value for linked artboard
			context.command.setValue_forKey_onLayer(nil,artboardDescLinkKey,layer);

			// Set layer name
			var layerName = layer.name().replace(artboardDescLinkPrefix,""));

			// Update the layer name
			layer.setName(layerName);

			// Create a log event
			log(layer.name() + strArtboardDescUnlinked + linkedArtboard);

			// Iterate counters
			updateCount++;
			removeCount++;
		}
	}

	// If note group is not empty...
	if (noteGroup.layers().count() > 0) {
		// Resize note group to account for children
		noteGroup.resizeToFitChildrenWithOption(0);
	}
	// If note group is empty...
	else {
		// Remove the note group
		noteGroup.removeFromParent();
	}

	// Resize parent group to account for children
	parentGroup.resizeToFitChildrenWithOption(0);

	// If any artboard links were removed
	if (removeCount > 0) {
		// Display feedback
		doc.showMessage(updateCount + strArtboardDescsUpdated + ", " + removeCount + strArtboardDescsUpdateUnlinked);
	} else {
		// Display feedback
		doc.showMessage(updateCount + strArtboardDescsUpdated);
	}
};
