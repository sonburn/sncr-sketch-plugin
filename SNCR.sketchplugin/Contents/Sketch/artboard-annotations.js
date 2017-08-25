@import 'lib/functions.js';

// Plugin variables
var pluginDomain = "com.sncr.sketch";
var parentGroupName = "SNCR";
var artboardNoteGroupName = "Annotations";
var artboardNoteConnectionsGroupKey = "connectionsGroup";
var artboardNoteConnectionsGroupName = "Connections";
var artboardNoteXOffset = 48;
var artboardNoteYOffset = 0;
var artboardNoteWidth = 256;
var artboardNoteSeparation = 12;
var artboardNoteLinkKey = "linkedToObject";
var artboardNoteLinkTypeKey = "linkType";
var artboardNoteLinkTypeValue = "annotation";
var artboardNoteParentKey = "linkedParentArtboard";
var artboardNoteLinkPrefix = "🔗 ";
var artboardNoteStyleData = {
	fontFace : "SF UI Text",
	fontSize : 14,
	lineHeight : 18,
	textAlignment : 0
}
var artboardNoteArrowXOffset = -12;
var artboardNoteArrowYOffset = artboardNoteStyleData.lineHeight/2;

// String variables
var strNoteDesignatePluginName = "Designate Selected Annotations";
var strNoteDesignateProblem = "Select text layer(s) to designate as annotation(s). This is required in order to link an annotation to an artboard.";
var strNoteDesignateComplete = " is now designated as an annotation";
var strNoteDesignatesComplete = " text layers are now designated as annotations";

var strNoteLinkPluginName = "Link Artboard Annotation";
var strNoteLinkProblem = "Select one designated annotation and one artboard or object to link.";
var strNoteLinkComplete = " is now linked to ";

var strArtboardNoteUnlinked = " artboard annotation is no longer linked to ";

var strNoteLinksUpdated = " annotation(s) updated";
var strNoteLinksUpdateUnlinked = " annotation(s) were unlinked due to missing artboards";

var designate = function(context) {
	var doc = context.document;
	var selection = context.selection;

	var count = 0;

	if (selection.count()) {
		var noteName;

		for (var i = 0; i < selection.count(); i++) {
			if (selection[i] instanceof MSTextLayer) {
				context.command.setValue_forKey_onLayer(artboardNoteLinkTypeValue,artboardNoteLinkTypeKey,selection[i]);

				count++;

				noteName = selection[i].name().split(/\r\n|\r|\n/g)[0];

				log(noteName + strNoteDesignateComplete);
			}
		}

		if (selection.count() == 1) {
			doc.showMessage(noteName + strNoteDesignateComplete);
		} else {
			doc.showMessage(count + strNoteDesignatesComplete);
		}
	} else {
		displayDialog(strNoteDesignatePluginName,strNoteDesignateProblem);
	}
}

// Function to link an annotation and object
var link = function(context) {
	// Context variables
	var doc = context.document;
	var selection = context.selection;

	// Take action on selections...
	switch (selection.count()) {
		// If there are two selections...
		case 2:
			// Selection variables
			var firstItem = selection[0];
			var secondItem = selection[1];

			// If the first item is a text layer with a linkType of annotation...
			if (firstItem instanceof MSTextLayer && context.command.valueForKey_onLayer(artboardNoteLinkTypeKey,firstItem) == artboardNoteLinkTypeValue) {
				linkNoteToObject(firstItem,secondItem);
			}
			// If the second is a text layer with a linkType of annotation...
			else if (secondItem instanceof MSTextLayer && context.command.valueForKey_onLayer(artboardNoteLinkTypeKey,secondItem) == artboardNoteLinkTypeValue) {
				linkNoteToObject(secondItem,firstItem);
			}
			// If the selections do not contain a text layer with a linkType of annotation...
			else {
				// Display feedback
				displayDialog(strNoteLinkPluginName,strNoteLinkProblem);
			}

			break;
		// If there are not two selections...
		default:
			// Display feedback
			displayDialog(strNoteLinkPluginName,strNoteLinkProblem);
	}

	// Function to link an annotation to an object
	function linkNoteToObject(note,object) {
		// Set parent group
		var parentGroup = getParentGroup(doc.currentPage(),parentGroupName);

		// Set annotation group
		var noteGroup = getChildGroup(parentGroup,artboardNoteGroupName);

		// Set stored values on annotation
		context.command.setValue_forKey_onLayer(object.objectID(),artboardNoteLinkKey,note);
		context.command.setValue_forKey_onLayer(artboardNoteLinkTypeValue,artboardNoteLinkTypeKey,note);
		context.command.setValue_forKey_onLayer(object.parentArtboard().objectID(),artboardNoteParentKey,note);

		// Determine max X of artboard, or parent artboard
		var artboardMaxX = (object.class() != "MSArtboardGroup") ? CGRectGetMaxX(object.parentArtboard().rect()) : CGRectGetMaxX(object.rect());

		// Set annotation position including offsets
		note.absoluteRect().setX(artboardMaxX + artboardNoteXOffset);
		note.absoluteRect().setY(object.absoluteRect().y() + object.frame().height()/2 + artboardNoteYOffset - artboardNoteStyleData.lineHeight/2);

		// Set annotation width
		note.frame().setWidth(artboardNoteWidth);

		// Set annotation font information
		note.setFontSize(artboardNoteStyleData.fontSize);
		note.setLineHeight(artboardNoteStyleData.lineHeight);
		note.setTextAlignment(artboardNoteStyleData.textAlignment);

		// If the annotation is not in the annotation group...
		if (note.parentGroup() != noteGroup) {
			// Move the annotation to the annotation group
			note.moveToLayer_beforeLayer(noteGroup,nil);
		}

		// Get siblings for parent
		var siblings = noteGroup.children().filteredArrayUsingPredicate(NSPredicate.predicateWithFormat("userInfo != nil && function(userInfo,'valueForKeyPath:',%@)." + artboardNoteParentKey + " == '" + object.parentArtboard().objectID() + "' && function(userInfo,'valueForKeyPath:',%@)." + artboardNoteLinkTypeKey + " == " + artboardNoteLinkTypeValue,pluginDomain));

		// If more than one sibling...
		if (siblings && siblings.count() > 1) {
			// Sort the siblings by Y position
			var sortByTopPosition = [NSSortDescriptor sortDescriptorWithKey:"absoluteRect.y" ascending:1];
			siblings = [siblings sortedArrayUsingDescriptors:[sortByTopPosition]];

			// Iterate through the siblings...
			for (var j = 0; j < siblings.length; j++) {
				// If there is a next sibling...
				if (j+1 < siblings.length) {
					// Sibling variables
					var thisSibling = siblings[j];
					var nextSibling = siblings[j+1];

					// If this sibling and the next intersect...
					if (CGRectGetMaxY(thisSibling.rect()) > CGRectGetMinY(nextSibling.rect())) {
						// Adjust the Y coordinate of the next sibling
						nextSibling.frame().setY(nextSibling.frame().y() + CGRectGetMaxY(thisSibling.rect()) - CGRectGetMinY(nextSibling.rect()) + artboardNoteSeparation);
					}
				}
			}
		}

		// Deselect the annotation and object
		note.select_byExpandingSelection(false,true);
		object.select_byExpandingSelection(false,true);

		// Resize annotation and parent groups to account for children
		noteGroup.resizeToFitChildrenWithOption(0);
		parentGroup.resizeToFitChildrenWithOption(0);

		// Determine note name
		var noteName = artboardNoteLinkPrefix + note.name().split(/\r\n|\r|\n/g)[0].replace(artboardNoteLinkPrefix,"");

		// Update the annotation layer name
		note.setName(artboardNoteLinkPrefix + object.name());

		// Create a log event
		log(noteName + strNoteLinkComplete + object.name());

		// Redraw all connections
		redraw(context);

		// Display feedback
		doc.showMessage(noteName + strNoteLinkComplete + object.name());
	}
}

// Function to update all annotations on page
var update = function(context) {
	// Context variables
	var doc = MSDocument.currentDocument();
	var page = doc.currentPage();

	// Construct loop of annotations
	var annotations = page.children().filteredArrayUsingPredicate(NSPredicate.predicateWithFormat("userInfo != nil && function(userInfo,'valueForKeyPath:',%@)." + artboardNoteLinkKey + " != nil && function(userInfo,'valueForKeyPath:',%@)." + artboardNoteLinkTypeKey + " == " + artboardNoteLinkTypeValue,pluginDomain)),
		loop = annotations.objectEnumerator(),
		note;

	// Set counters
	var updateCount = 0;
	var removeCount = 0;

	// Initiate array of parents with siblings
	var parentsWithSiblings = [];

	// If there are annotations...
	if (annotations.count()) {
		// Set parent group
		var parentGroup = getParentGroup(page,parentGroupName);

		// Set annotation group
		var noteGroup = getChildGroup(parentGroup,artboardNoteGroupName);

		// Iterate through annotations...
		while (note = loop.nextObject()) {
			// Get stored value for linked object
			var linkedObjectID = context.command.valueForKey_onLayer(artboardNoteLinkKey,note);

			// Get linked object if it resides on the page
			var linkedObject = page.children().filteredArrayUsingPredicate(NSPredicate.predicateWithFormat("objectID == %@",linkedObjectID,pluginDomain)).firstObject();

			// If linked object exists...
			if (linkedObject) {
				// If linked object has a parent...
				if (linkedObject.parentArtboard()) {
					// Get siblings for this linked object (figure out how to exclude current object)
					var siblings = noteGroup.children().filteredArrayUsingPredicate(NSPredicate.predicateWithFormat("userInfo != nil && function(userInfo,'valueForKeyPath:',%@)." + artboardNoteParentKey + " == '" + linkedObject.parentArtboard().objectID() + "' && function(userInfo,'valueForKeyPath:',%@)." + artboardNoteLinkTypeKey + " == " + artboardNoteLinkTypeValue,pluginDomain));

					// If there are siblings...
					if (siblings.count() > 1) {
						// Add parent objectID to array of parents with siblings
						parentsWithSiblings.push(linkedObject.parentArtboard().objectID());
					}
				}

				// Determine max X of artboard, or parent artboard
				var artboardMaxX = linkedObject.parentArtboard() ? CGRectGetMaxX(linkedObject.parentArtboard().rect()) : CGRectGetMaxX(linkedObject.rect());

				// Set annotation position including offsets
				note.absoluteRect().setX(artboardMaxX + artboardNoteXOffset);
				note.absoluteRect().setY(linkedObject.absoluteRect().y() + linkedObject.frame().height()/2 + artboardNoteYOffset - artboardNoteStyleData.lineHeight/2);

				// Set annotation width
				note.frame().setWidth(artboardNoteWidth);

				// Set annotation font information
				note.setFontSize(artboardNoteStyleData.fontSize);
				note.setLineHeight(artboardNoteStyleData.lineHeight);
				note.setTextAlignment(artboardNoteStyleData.textAlignment);

				// If the annotation is not in the annotation group...
				if (note.parentGroup() != noteGroup) {
					// Move the annotation to the annotation group
					note.moveToLayer_beforeLayer(noteGroup,nil);

					// Deselect the annotation (for some reason moveToLayer_beforeLayer selects it)
					note.select_byExpandingSelection(false,true);
				}

				// Update the annotation layer name
				note.setName(artboardNoteLinkPrefix + linkedObject.name());

				// Iterate counter
				updateCount++;
			}
			// If object does not exist...
			else {
				// Remove stored values for linked artboard
				context.command.setValue_forKey_onLayer(nil,artboardNoteLinkKey,note);
				context.command.setValue_forKey_onLayer(nil,artboardNoteLinkTypeKey,note);
				context.command.setValue_forKey_onLayer(nil,artboardNoteParentKey,note);

				// Set annotation name
				var noteName = note.name().replace(artboardNoteLinkPrefix,""));

				// Update the layer name
				note.setName(noteName);

				// Iterate counters
				updateCount++;
				removeCount++;

				// Create a log event
				log(noteName + strArtboardNoteUnlinked + linkedObjectID);
			}
		}

		// If annotation group is not empty...
		if (noteGroup.layers().count() > 0) {
			// If any parents have siblings...
			if (parentsWithSiblings) {
				// Filter duplicates from parents with siblings array
				var parentsWithSiblings = parentsWithSiblings.filter(function(item,pos) {
					return parentsWithSiblings.indexOf(item) == pos;
				});

				// Iterate through the parents...
				for (var i = 0; i < parentsWithSiblings.length; i++) {
					// Get siblings for parent
					var siblings = noteGroup.children().filteredArrayUsingPredicate(NSPredicate.predicateWithFormat("userInfo != nil && function(userInfo,'valueForKeyPath:',%@)." + artboardNoteParentKey + " == '" + parentsWithSiblings[i] + "' && function(userInfo,'valueForKeyPath:',%@)." + artboardNoteLinkTypeKey + " == " + artboardNoteLinkTypeValue,pluginDomain));

					// Sort the siblings by Y position
					var sortByTopPosition = [NSSortDescriptor sortDescriptorWithKey:"absoluteRect.y" ascending:1];
					siblings = [siblings sortedArrayUsingDescriptors:[sortByTopPosition]];

					// Iterate through the siblings...
					for (var j = 0; j < siblings.length; j++) {
						// If there is a next sibling...
						if (j+1 < siblings.length) {
							// Sibling variables
							var thisSibling = siblings[j];
							var nextSibling = siblings[j+1];

							// If this sibling and the next intersect...
							if (CGRectGetMaxY(thisSibling.rect()) > CGRectGetMinY(nextSibling.rect())) {
								// Adjust the Y coordinate of the next sibling
								nextSibling.frame().setY(nextSibling.frame().y() + CGRectGetMaxY(thisSibling.rect()) - CGRectGetMinY(nextSibling.rect()) + artboardNoteSeparation);
							}
						}
					}
				}
			}

			// Resize annotation and parent groups to account for children
			noteGroup.resizeToFitChildrenWithOption(0);
			parentGroup.resizeToFitChildrenWithOption(0);

			// Redraw all connections
			redraw(context);
		}
		// If annotation group is empty...
		else {
			// Remove the annotation group
			noteGroup.removeFromParent();

			// Resize parent group to account for children
			parentGroup.resizeToFitChildrenWithOption(0);
		}

		// If the function was not invoked by action...
		if (!context.actionContext) {
			// Lock the annotation and parent groups
			noteGroup.setIsLocked(true);
			parentGroup.setIsLocked(true);

			// If any annotation links were removed
			if (removeCount > 0) {
				// Display feedback
				doc.showMessage(updateCount + strNoteLinksUpdated + ", " + removeCount + strNoteLinksUpdateUnlinked);
			} else {
				// Display feedback
				doc.showMessage(updateCount + strNoteLinksUpdated);
			}
		}
	}
	// If there are no annotations...
	else {
		// Display feedback
		doc.showMessage(updateCount + strNoteLinksUpdated);
	}
};

// Function to redraw all connections
var redraw = function(context) {
	// Context variables
	var doc = context.document || context.actionContext.document;

	// Set connections group
	var connectionsGroup = doc.currentPage().children().filteredArrayUsingPredicate(NSPredicate.predicateWithFormat("userInfo != nil && function(userInfo,'valueForKeyPath:',%@)." + artboardNoteConnectionsGroupKey + " == true", pluginDomain)).firstObject();

	// If connections group exists...
	if (connectionsGroup) {
		// Remove connections group
		connectionsGroup.removeFromParent();
	}

	// Construct loop of annotations
	var annotations = doc.currentPage().children().filteredArrayUsingPredicate(NSPredicate.predicateWithFormat("userInfo != nil && function(userInfo,'valueForKeyPath:',%@)." + artboardNoteLinkKey + " != nil", pluginDomain)),
		loop = annotations.objectEnumerator(),
		note;

	// Initiate connections array
	var connections = [];

	// Iterate through the annotations...
	while (note = loop.nextObject()) {
		// Get stored value for linked object
		var linkedObjectID = context.command.valueForKey_onLayer_forPluginIdentifier(artboardNoteLinkKey,note,pluginDomain);

		// Get linked object if it resides on the page
		var linkedObject = doc.currentPage().children().filteredArrayUsingPredicate(NSPredicate.predicateWithFormat("objectID == %@",linkedObjectID)).firstObject();

		// If linked object exists...
		if (linkedObject) {
			// Create connection object
			var connection = {
				linkRect : linkedObject.parentArtboard() ? CGRectIntersection(linkedObject.absoluteRect().rect(),linkedObject.parentArtboard().absoluteRect().rect()) : linkedObject.absoluteRect().rect(),
				linkID : note.objectID(),
				dropPoint : {
					x : note.absoluteRect().x() + artboardNoteArrowXOffset,
					y : note.absoluteRect().y() + artboardNoteArrowYOffset
				}
			}

			// Add connection object to connections array
			connections.push(connection);
		}
	}

	// Set parent group
	var parentGroup = getParentGroup(doc.currentPage(),parentGroupName);

	// Set annotation group
	var noteGroup = getChildGroup(parentGroup,artboardNoteGroupName);

	// Get connection shape layers
	var connectionLayers = MSLayerArray.arrayWithLayers(drawShapes(connections,doc.currentPage()));

	// Create new connections group from shape layers
	connectionsGroup = MSLayerGroup.groupFromLayers(connectionLayers);

	// Move connections group to annotation group
	connectionsGroup.moveToLayer_beforeLayer(noteGroup,nil);

	// Deselection connections and annotations groups
	connectionsGroup.deselectLayerAndParent();

	// Set connections group name
	connectionsGroup.setName(artboardNoteConnectionsGroupName);

	// Lock connections group
	connectionsGroup.setIsLocked(1);

	// Set stored value on connections group
	context.command.setValue_forKey_onLayer_forPluginIdentifier(true,artboardNoteConnectionsGroupKey,connectionsGroup,pluginDomain);
}

function drawShapes(connections,output) {
	var connectionLayers = [],
		strokeWidth = 1,
		arrowRotation = 0,
		arrowOffsetX = 0,
		path,
		hitAreaLayer,
		linkRect,
		dropPoint,
		hitAreaBorder,
		startPoint,
		controlPoint1,
		controlPoint1Offset,
		controlPoint2OffsetX = 0,
		controlPoint2OffsetY = 0,
		linePath,
		lineLayer,
		hitAreaColor = MSImmutableColor.colorWithSVGString("#000000").newMutableCounterpart(),
		hitAreaBorderColor = MSImmutableColor.colorWithSVGString("#00AEEF").newMutableCounterpart();

	hitAreaColor.setAlpha(0);
	hitAreaBorderColor.setAlpha(1);

	for (var i=0; i < connections.length; i++) {
		connection = connections[i];
		linkRect = connection.linkRect;
		dropPoint = NSMakePoint(connection.dropPoint.x, connection.dropPoint.y);

		if (dropPoint.x < CGRectGetMinX(linkRect)) {
			dropPoint = NSMakePoint(dropPoint.x + 18, dropPoint.y - 30 );
			arrowRotation = 90;
			arrowOffsetX = 2;
			if (dropPoint.y < CGRectGetMinY(linkRect)) {
				startPoint = NSMakePoint(CGRectGetMidX(linkRect), CGRectGetMinY(linkRect) + 5);
				controlPoint1Offset = Math.max(Math.abs(dropPoint.y - startPoint.y)/2, 200);
				controlPoint1 = NSMakePoint(startPoint.x, startPoint.y - controlPoint1Offset);
			} else {
				startPoint = NSMakePoint(CGRectGetMidX(linkRect), CGRectGetMaxY(linkRect) - 5);
				controlPoint1Offset = Math.max(Math.abs(dropPoint.y - startPoint.y)/2, 200);
				controlPoint1 = NSMakePoint(startPoint.x, startPoint.y + controlPoint1Offset);
			}
			controlPoint2OffsetY = -160;
		} else {
			startPoint = NSMakePoint(CGRectGetMaxX(linkRect) - 8, CGRectGetMidY(linkRect));
			controlPoint1Offset = Math.max(Math.abs(dropPoint.x - startPoint.x)/2, 100);
			controlPoint1 = NSMakePoint(startPoint.x + controlPoint1Offset, startPoint.y);
			controlPoint2OffsetX = Math.max(Math.abs(dropPoint.x - startPoint.x)/2, 100);
		}

		// Draw the circle
		linkRect = NSInsetRect(NSMakeRect(startPoint.x, startPoint.y, 0, 0), -3, -3);
		path = NSBezierPath.bezierPathWithOvalInRect(linkRect);
		hitAreaLayer = MSShapeGroup.shapeWithBezierPath(path);
		hitAreaLayer.style().addStylePartOfType(0).setColor(hitAreaBorderColor);
		output.addLayers([hitAreaLayer]);
		connectionLayers.push(hitAreaLayer);

		// Draw the path
		linePath = NSBezierPath.bezierPath();
		linePath.moveToPoint(startPoint);
		linePath.curveToPoint_controlPoint1_controlPoint2(dropPoint, controlPoint1, NSMakePoint(dropPoint.x - controlPoint2OffsetX, dropPoint.y + controlPoint2OffsetY));
		lineLayer = MSShapeGroup.shapeWithBezierPath(linePath);
		hitAreaBorder = lineLayer.style().addStylePartOfType(1);
		hitAreaBorder.setColor(hitAreaBorderColor);
		hitAreaBorder.setThickness(strokeWidth);
		hitAreaBorder.setPosition(0);
		output.addLayers([lineLayer]);
		connectionLayers.push(lineLayer);

		// Draw the arrow
		var arrowSize = Math.max(8, strokeWidth*3);
		path = NSBezierPath.bezierPath();
		path.moveToPoint(NSMakePoint(dropPoint.x+(arrowSize*0.6), dropPoint.y));
		path.lineToPoint(NSMakePoint(dropPoint.x-arrowSize, dropPoint.y+(arrowSize*0.6)));
		path.lineToPoint(NSMakePoint(dropPoint.x-(arrowSize*0.6), dropPoint.y));
		path.lineToPoint(NSMakePoint(dropPoint.x-arrowSize, dropPoint.y-(arrowSize*0.6)));
		path.closePath();
		var arrow = MSShapeGroup.shapeWithBezierPath(path);
		arrow.style().addStylePartOfType(0).setColor(hitAreaBorderColor);
		arrow.setRotation(-arrowRotation);
		arrow.absoluteRect().setX(arrow.absoluteRect().x() + arrowOffsetX);
		output.addLayers([arrow]);
		connectionLayers.push(arrow);
	}

	return connectionLayers;
}
