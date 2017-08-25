@import 'lib/functions.js';

// Plugin variables
var pluginDomain = "com.sncr.sketch";
var parentGroupName = "SNCR";
var artboardDescGroupName = "Descriptions";
var artboardDescXOffset = 0;
var artboardDescYOffset = 24;
var artboardDescLinkKey = "linkedToArtboard";
var artboardDescLinkTypeKey = "linkType";
var artboardDescLinkTypeValue = "description";
var artboardDescLinkKeyQuery = "userInfo != nil && function(userInfo,'valueForKeyPath:',%@)." + artboardDescLinkKey + " != nil && function(userInfo,'valueForKeyPath:',%@)." + artboardDescLinkTypeKey + " == nil";
var artboardDescLinkPrefix = "🔗 ";
var artboardDescStyleName = "Wireframe/Artboard Description";
var artboardDescStyleData = {
	fontFace : "Neue Haas Grotesk Text Std 55 Roman",
	fontSize : 14,
	lineHeight : 18,
	textAlignment : 0
}

// String variables
var strArtboardDescLinkPluginName = "Link Artboard Description";
var strArtboardDescLinkProblem = "Select one artboard description (a text layer with \"" + artboardDescStyleName + "\" style applied) and one artboard to link.";
var strArtboardDescLinked = " is now linked to ";

var strArtboardDescUnlinkPluginName = "Unlink Artboard Description";
var strArtboardDescUnlinkProblem = "Select an artboard description to unlink.";
var strArtboardDescUnlinked = " artboard description is no longer linked to ";
var strArtboardDescsUnlinked = " artboard description(s) unlinked";

var strArtboardDescsSelected = " artboard description(s) selected";

var strArtboardDescSetPluginName = "Add/Edit Artboard Description";
var strArtboardDescSetProblem = "Select one artboard to add/edit a description.";
var strArtboardDescAdded = "Artboard description added";
var strArtboardDescUpdated = "Artboard description updated";

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

			// If the first item is a text layer and text style name matches the provided name, and the second item is an artboard...
			if ((firstItem instanceof MSTextLayer && firstItem.sharedObject() && firstItem.sharedObject().name() == artboardDescStyleName) && secondItem instanceof MSArtboardGroup) {
				linkArtboardDesc(firstItem,secondItem);
			}
			// If the first item is an artboard, and the second item is a text layer and text style name matches the provided name...
			else if (firstItem instanceof MSArtboardGroup && (secondItem instanceof MSTextLayer && secondItem.sharedObject() && secondItem.sharedObject().name() == artboardDescStyleName)) {
				linkArtboardDesc(secondItem,firstItem);
			}
			// If the selections do not contain a artboard description text layer and artboard...
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
		var parentGroup = getParentGroup(page,parentGroupName);

		// Set annotation group
		var descGroup = getChildGroup(parentGroup,artboardDescGroupName);

		// Set artboard description x/y in relation to artboard, with offsets
		layer.absoluteRect().setX(artboard.frame().x() + artboardDescXOffset);
		layer.absoluteRect().setY(artboard.frame().y() + artboard.frame().height() + artboardDescYOffset);

		// Set artboard description width
		layer.frame().setWidth(artboard.frame().width());

		// If the artboard description is not in the description group...
		if (layer.parentGroup() != descGroup) {
			// Move the artboard description to the description group
			layer.moveToLayer_beforeLayer(descGroup,nil);
		}

		// Deselect the artboard
		artboard.select_byExpandingSelection(false,true);

		// Resize description and parent groups to account for children
		descGroup.resizeToFitChildrenWithOption(0);
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

// Function to select all linked descriptions on page
var select = function(context) {
	// Context variables
	var doc = context.document;
	var page = doc.currentPage();

	// Deselect everything in the current page
	page.changeSelectionBySelectingLayers(nil);

	// Set a counter
	var count = 0;

	// Get the descriptions and construct a loop
	var layers = page.children().filteredArrayUsingPredicate(NSPredicate.predicateWithFormat(artboardDescLinkKeyQuery,pluginDomain));
	var loop = layers.objectEnumerator(), layer;

	// Iterate through descriptions...
	while (layer = loop.nextObject()) {
		// Select the artboard description while maintaining other selections
		layer.select_byExpandingSelection(true,true);

		// Iterate the counter
		count++;
	}

	// Display feedback
	doc.showMessage(count + strArtboardDescsSelected);
}

// Function to add/edit an artboard description
var set = function(context) {
	// Context variables
	var doc = context.document;
	var page = doc.currentPage();
	var selection = context.selection;

	// If there is one artboard selected...
	if (selection.count() == 1 && selection[0] instanceof MSArtboardGroup) {
		// Artboard variable
		var artboard = selection[0];

		// Initial artboard description value
		var artboardDescValue = "";

		// Get existing artboard description for selected artboard
		var linkedArtboardDesc = page.children().filteredArrayUsingPredicate(NSPredicate.predicateWithFormat("userInfo != nil && function(userInfo,'valueForKeyPath:',%@)." + artboardDescLinkKey + " == '" + artboard.objectID() + "'",pluginDomain)).firstObject();

		// If artboard description exists, update artboard description value
		if (linkedArtboardDesc) artboardDescValue = linkedArtboardDesc.stringValue();

		// Present add/edit window with artboard description value
		var artboardDescText = artboardDescText(artboard.name(),artboardDescValue);

		// If artboard description value was returned
		if (artboardDescText) {
			// If artboard description already existed...
			if (linkedArtboardDesc) {
				// Update the artboard description with new value
				linkedArtboardDesc.setStringValue(artboardDescText.stringValue);

				// Display feedback
				doc.showMessage(strArtboardDescUpdated);
			}
			// If artboard description did not exist...
			else {
				// Set parent group
				var parentGroup = getParentGroup(page,parentGroupName);

				// Set annotation group
				var descGroup = getChildGroup(parentGroup,artboardDescGroupName);

				// Set artboard description style
				var artboardDescStyle = getTextStyle(artboardDescStyleName,artboardDescStyleData);

				// Create new artboard description text layer
				var artboardDesc = MSTextLayer.new();
				artboardDesc.setStringValue(artboardDescText.stringValue);
				artboardDesc.setName(artboardDescLinkPrefix + artboard.name());
				artboardDesc.setStyle(artboardDescStyle.newInstance());
				artboardDesc.setTextBehaviour(1);

				// Add artboard description to annotation group
				descGroup.addLayers([artboardDesc]);

				// Set artboard description x/y in relation to artboard, with offsets
				artboardDesc.absoluteRect().setX(artboard.frame().x() + artboardDescXOffset);
				artboardDesc.absoluteRect().setY(artboard.frame().y() + artboard.frame().height() + artboardDescYOffset);

				// Set artboard description width
				artboardDesc.frame().setWidth(artboard.frame().width());

				// Resize description and parent groups to account for children
				descGroup.resizeToFitChildrenWithOption(0);
				parentGroup.resizeToFitChildrenWithOption(0);

				// Set stored value for linked artboard
				context.command.setValue_forKey_onLayer(artboard.objectID(),artboardDescLinkKey,artboardDesc);

				// Display feedback
				doc.showMessage(strArtboardDescAdded);
			}
		}

		function artboardDescText(artboardName,artboardDescValue) {
			var alertWindow = COSAlertWindow.new();

			alertWindow.setMessageText(strArtboardDescSetPluginName);

			alertWindow.addTextLabelWithValue('For ' + artboardName + ':');
			alertWindow.addAccessoryView(helpers.createField(artboardDescValue,NSMakeRect(0,0,300,120)));

			alertWindow.addButtonWithTitle('OK');
			alertWindow.addButtonWithTitle('Cancel');

			// Set first responder and key order
			var fieldOne = alertWindow.viewAtIndex(1);
			alertWindow.alert().window().setInitialFirstResponder(fieldOne);

			var responseCode = alertWindow.runModal();

			if (responseCode == 1000) {
				return {
					stringValue : [[alertWindow viewAtIndex:1] stringValue]
				}
			} else return false;
		}
	}
	// If there is not one artboard selected...
	else {
		// Display feedback
		displayDialog(strArtboardDescSetPluginName,strArtboardDescSetProblem);
	}
}

// Function to unlink artboard description(s)
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
			var linkedArtboard = context.command.valueForKey_onLayer(artboardDescLinkKey,selection[i]);

			// If selection is linked to an artboard...
			if (linkedArtboard) {
				// Set linked artboard value to nil
				context.command.setValue_forKey_onLayer(nil,artboardDescLinkKey,selection[i]);

				// Set the layer name
				var layerName = selection[i].name().replace(artboardDescLinkPrefix,""));

				// Update the title name
				selection[i].setName(layerName);

				// For logging purposes, get linked artboard object
				var artboard = findLayerByID(selection[i].parentGroup(),linkedArtboard);

				// If artboard exists, use artboard name for name, otherwise use artboard ID
				artboardName = (artboard) ? artboard.name() : linkedArtboard;

				// Create a log event
				log(layerName + strArtboardDescUnlinked + artboardName);

				// Iterate the counter
				count++;
			}

			// Deselect current selection
			selection[i].select_byExpandingSelection(false,true);
		}

		// Display feedback
		doc.showMessage(count + strArtboardDescsUnlinked);
	}
	// If there are no selections...
	else {
		// Display feedback
		displayDialog(strArtboardDescUnlinkPluginName,strArtboardDescUnlinkProblem);
	}
}

// Function to update all descriptions on page
var update = function(context) {
	// Context variables
	var doc = MSDocument.currentDocument();
	var page = doc.currentPage();

	// Get descriptions on current page
	var layers = page.children().filteredArrayUsingPredicate(NSPredicate.predicateWithFormat(artboardDescLinkKeyQuery,pluginDomain));

	// If there are descriptions...
	if (layers.count() > 0) {
		var loop = layers.objectEnumerator(), layer;

		// Set counters
		var updateCount = 0;
		var removeCount = 0;

		// Set parent group
		var parentGroup = getParentGroup(page,parentGroupName);

		// Set annotation group
		var descGroup = getChildGroup(parentGroup,artboardDescGroupName);

		// Iterate through descriptions...
		while (layer = loop.nextObject()) {
			context.command.setValue_forKey_onLayer(artboardDescLinkTypeValue,artboardDescLinkTypeKey,layer);

			// Get stored value for linked artboard
			var linkedArtboard = context.command.valueForKey_onLayer(artboardDescLinkKey,layer);

			// Get linked artboard object, if it resides on the artboard description page
			var artboard = page.artboards().filteredArrayUsingPredicate(NSPredicate.predicateWithFormat("objectID == %@",linkedArtboard,pluginDomain)).firstObject();

			// If artboard object exists...
			if (artboard) {
				// Set artboard description x/y in relation to artboard, with offsets
				layer.absoluteRect().setX(artboard.frame().x() + artboardDescXOffset);
				layer.absoluteRect().setY(artboard.frame().y() + artboard.frame().height() + artboardDescYOffset);

				// Set artboard description width
				layer.frame().setWidth(artboard.frame().width());

				// If the artboard description is not in the description group...
				if (layer.parentGroup() != descGroup) {
					// Move the artboard description to the description group
					layer.moveToLayer_beforeLayer(descGroup,nil);

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
				log(layerName + strArtboardDescUnlinked + linkedArtboard);

				// Iterate counters
				updateCount++;
				removeCount++;
			}
		}

		// If description group is not empty...
		if (descGroup.layers().count() > 0) {
			// Resize description group to account for children
			descGroup.resizeToFitChildrenWithOption(0);
		}
		// If description group is empty...
		else {
			// Remove the description group
			descGroup.removeFromParent();
		}

		// Resize parent group to account for children
		parentGroup.resizeToFitChildrenWithOption(0);

		// If the function was not invoked by action...
		if (!context.actionContext) {
			// Lock the description and parent groups
			descGroup.setIsLocked(true);
			parentGroup.setIsLocked(true);

			// If any artboard links were removed
			if (removeCount > 0) {
				// Display feedback
				doc.showMessage(updateCount + strArtboardDescsUpdated + ", " + removeCount + strArtboardDescsUpdateUnlinked);
			} else {
				// Display feedback
				doc.showMessage(updateCount + strArtboardDescsUpdated);
			}
		}
	}
};
