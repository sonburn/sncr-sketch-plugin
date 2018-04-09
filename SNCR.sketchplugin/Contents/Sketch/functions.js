var sncr = {
	init: function(context,command) {
		this.pluginDomain = "com.sncr.sketch";

		this.document = context.document || context.actionContext.document;
		this.selection = context.selection;
		this.command = context.command;
		this.pages = this.document.pages();
		this.page = this.document.currentPage();
		this.symbols = this.document.documentData().allSymbols();
		this.symbolsPage = this.document.documentData().symbolsPage();

		this.localeID = "en";
		this.stringsPath = context.plugin.urlForResourceNamed("strings/" + this.localeID + ".plist").path();
		this.strings = NSDictionary.dictionaryWithContentsOfFile(this.stringsPath);

		this.parentGroupName = "SNCR";
		this.artboardNoteGroupName = "Annotations";
		this.descriptionsGroupName = "Descriptions";
		this.titlesGroupName = "Titles";

		this.annotations.config = {
			connectionsGroupKey : "connectionsGroup",
			connectionsGroupName : "Connections",
			annotationXOffset : 48,
			annotationYOffset : 0,
			annotationWidth : 256,
			annotationSpacing : 12,
			annotationLinkKey : "linkedToObject",
			annotationLinkTypeKey : "linkType",
			annotationLinkTypeValue : "annotation",
			annotationParentKey : "linkedParentArtboard",
			annotationLinkPrefix : "🔗 ",
			annotationStyleData : {
				fontFace : "SF UI Text",
				fontSize : 14,
				lineHeight : 18,
				textAlignment : 0
			},
			annotationArrowXOffset : -12,
			annotationArrowYOffset : 9 // Half annotationStyleData lineHeight
		}

		this.descriptions.config = {
			descriptionStyleName : "Wireframe/Artboard Description",
			descriptionStyleData : {
				fontFace : "Neue Haas Grotesk Text Std 55 Roman",
				fontSize : 14,
				lineHeight : 18,
				textAlignment : 0
			},
			descriptionXOffset : 0,
			descriptionYOffset : 24,
			descriptionLinkKey : "linkedToArtboard",
			descriptionLinkTypeKey : "linkType",
			descriptionLinkTypeValue : "description",
			descriptionLinkPrefix : "🔗 "
		}

		this.layout.config = {
			featureKey : "layoutArtboards",
			pageNamePrefix : "🔹 "
		}

		this.sections.config = {
			symbolMasterKey : "sectionTitleSymbol",
			titleLinkKey : "sncrScreenTitleLinkedTo",
			titleLinkPrefix : "🔗 "
		}

		this.titles.config = {
			featureKey : "createArtboardTitles"
		}

		this.wireframes.config = {
			featureKey : "wireframeExport"
		}

		if (command) {
			switch (command) {
				case "annotations-create" :
					this.annotations.createSelected(context);
					break;
				case "annotations-designate" :
					this.annotations.designateSelected(context);
					break;
				case "annotations-link" :
					this.annotations.linkSelected(context);
					break;
				case "annotations-update" :
					this.annotations.updateAllOnPage(context);
					break;
				case "annotations-settings" :
					this.annotations.settings(context);
					break;
				case "descriptions-set" :
					this.descriptions.addEdit(context);
					break;
				case "descriptions-link" :
					this.descriptions.linkSelected(context);
					break;
				case "descriptions-unlink" :
					this.descriptions.unlinkSelected(context);
					break;
				case "descriptions-select" :
					this.descriptions.selectAllOnPage(context);
					break;
				case "descriptions-update" :
					this.descriptions.updateAllOnPage(context);
					break;
				case "descriptions-settings" :
					this.descriptions.settings(context);
					break;
				case "titles-create" :
					this.titles.create(context,"create");
					break;
				case "titles-include" :
					this.titles.include(context);
					break;
				case "titles-preclude" :
					this.titles.preclude(context);
					break;
				case "titles-settings" :
					this.titles.settings(context);
					break;
				case "wireframes-add" :
					this.wireframes.addNew(context);
					break;
				case "wireframes-include" :
					this.wireframes.include(context);
					break;
				case "wireframes-preclude" :
					this.wireframes.preclude(context);
					break;
				case "wireframes-export" :
					this.wireframes.export(context);
					break;
				case "layout-include-selected" :
					this.layout.includeSelected(context);
					break;
				case "layout-include-page" :
					this.layout.includePage(context);
					break;
				case "layout-preclude-selected" :
					this.layout.precludeSelected(context);
					break;
				case "layout-preclude-page" :
					this.layout.precludePage(context);
					break;
				case "layout-settings" :
					this.layout.settings(context);
					break;
				case "layout-update" :
					this.layout.update(context);
					break;
				case "sections-insert" :
					this.sections.insertTitle(context);
					break;
				case "sections-link" :
					this.sections.linkSelected(context);
					break;
				case "sections-unlink" :
					this.sections.unlinkSelected(context);
					break;
				case "sections-select" :
					this.sections.selectAllOnPage(context);
					break;
				case "sections-update" :
					this.sections.updateAllOnPage(context);
					break;
				case "sections-settings" :
					this.sections.settings(context);
					break;
				case "other-slice" :
					this.other.createSlice(context);
					break;
			}
		}
	}
}

sncr.annotations = {
	createSelected: function(context) {
		if (context.actionContext) {
			if (sncr.annotations.settings(context,"create").autoAnnotate == 1) {
				COScript.currentCOScript().scheduleWithInterval_jsFunction(2, function() {
					var selections = context.actionContext.document.selectedLayers().layers(),
						selectionLoop = selections.objectEnumerator(),
						selection;

					while (selection = selectionLoop.nextObject()) {
						createFlowAnnotation(selection);
					}
				});
			}
		} else {
			var selections = sncr.selection,
				selectionLoop = selections.objectEnumerator(),
				selection;

			if (selections.count() == 0) {
				displayMessage('Nothing is selected');

				return;
			}

			while (selection = selectionLoop.nextObject()) {
				if (selection instanceof MSArtboardGroup) {
					var predicate = NSPredicate.predicateWithFormat("flow != nil"),
						flowLayers = selection.children().filteredArrayUsingPredicate(predicate),
						flowLayerLoop = flowLayers.objectEnumerator(),
						flowLayer;

					while (flowLayer = flowLayerLoop.nextObject()) {
						createFlowAnnotation(flowLayer);
					}
				} else {
					if (selection.flow()) {
						createFlowAnnotation(selection);
					}
				}
			}
		}

		function createFlowAnnotation(flowLayer) {
			var destinationArtboardID = flowLayer.flow().destinationArtboardID(),
				destinationArtboardName = (destinationArtboardID == "back") ? "Back to originating screen" : sncr.document.documentData().artboardWithID_(destinationArtboardID).name()),
				parentGroup = getParentGroup(sncr.page,sncr.parentGroupName),
				noteGroup = getChildGroup(parentGroup,sncr.artboardNoteGroupName);

			var predicate = NSPredicate.predicateWithFormat("userInfo != nil && function(userInfo,'valueForKeyPath:',%@)." + sncr.annotations.config.annotationLinkKey + " == '" + flowLayer.objectID() + "'",sncr.pluginDomain),
				existingNote = noteGroup.children().filteredArrayUsingPredicate(predicate).firstObject();

			if (existingNote) {
				var existingString = existingNote.stringValue();

				if (existingString.indexOf("\n") != -1 || existingString.indexOf("\r") != -1) {
					var n = existingString.indexOf("\n"),
						r = existingString.indexOf("\r"),
						returnIndex,
						returnType;

					if (n != -1 && r != -1) {
						if (n < r) {
							returnIndex = n;
							returnType = "\n";
						} else {
							returnIndex = r;
							returnType = "\r";
						}
					} else if (n != -1) {
						returnIndex = n;
						returnType = "\n";
					} else {
						returnIndex = r;
						returnType = "\r";
					}

					var rangeBegin = returnIndex + 1,
						rangeEnd = existingString.length() - rangeBegin,
						newString = destinationArtboardName + "\n" + existingString.substr(rangeBegin,rangeEnd);

					existingNote.setStringValue(newString);
					existingNote.setFont(NSFont.fontWithName_size("HelveticaNeue-Bold",14));

					var rangeBegin = newString.indexOf("\n") + 1,
						rangeEnd = newString.length - rangeBegin,
						range = NSMakeRange(rangeBegin,rangeEnd),
						rangeFont = NSFont.fontWithName_size("Helvetica Neue",14);

					existingNote.addAttribute_value_forRange(NSFontAttributeName,rangeFont,range);
				} else {
					existingNote.setStringValue(destinationArtboardName);
					existingNote.setFont(NSFont.fontWithName_size("HelveticaNeue-Bold",14));
				}

				existingNote.setName(destinationArtboardName);
				existingNote.setLineHeight(18);
				existingNote.setTextColor(MSImmutableColor.colorWithSVGString("#000000"));
				existingNote.setTextBehaviour(1);
				existingNote.frame().setWidth(256);

				sncr.annotations.linkNoteToObject(context,existingNote,flowLayer);
			} else {
				var newNote = MSTextLayer.new();
				newNote.setStringValue(destinationArtboardName);
				newNote.setName(destinationArtboardName);
				newNote.setFont(NSFont.fontWithName_size("HelveticaNeue-Bold",14));
				newNote.setLineHeight(18);
				newNote.setTextColor(MSImmutableColor.colorWithSVGString("#000000"));
				newNote.setTextBehaviour(1);
				newNote.frame().setWidth(256);

				noteGroup.addLayers([newNote]);

				sncr.annotations.linkNoteToObject(context,newNote,flowLayer);
			}
		}
	},
	designateSelected: function(context,textLayer) {
		if (textLayer) {
			var noteName;

			sncr.command.setValue_forKey_onLayer(sncr.annotations.config.annotationLinkTypeValue,sncr.annotations.config.annotationLinkTypeKey,textLayer);

			noteName = textLayer.name().split(/\r\n|\r|\n/g)[0];

			log(noteName + sncr.strings["annotation-designate-complete"]);

			displayMessage(noteName + sncr.strings["annotation-designate-complete"]);
		} else {
			var count = 0;

			if (sncr.selection.count()) {
				var noteName;

				for (var i = 0; i < sncr.selection.count(); i++) {
					if (sncr.selection[i] instanceof MSTextLayer) {
						sncr.command.setValue_forKey_onLayer(sncr.annotations.config.annotationLinkTypeValue,sncr.annotations.config.annotationLinkTypeKey,sncr.selection[i]);

						count++;

						noteName = sncr.selection[i].name().split(/\r\n|\r|\n/g)[0];

						log(noteName + sncr.strings["annotation-designate-complete"]);
					}
				}

				if (sncr.selection.count() == 1) {
					displayMessage(noteName + sncr.strings["annotation-designate-complete"]);
				} else {
					displayMessage(count + sncr.strings["annotation-designates-complete"]);
				}
			} else {
				displayDialog(sncr.strings["annotation-designate-plugin"],sncr.strings["annotation-designate-problem"]);
			}
		}
	},
	linkSelected: function(context) {
		// Take action on selections...
		switch (sncr.selection.count()) {
			// If there are two selections...
			case 2:
				// Selection variables
				var firstItem = sncr.selection[0],
					secondItem = sncr.selection[1];

				// If the first item is a text layer with a linkType of annotation...
				if (firstItem.class() == "MSTextLayer" && secondItem.class() != "MSTextLayer") {
					// Designate the text layer as an annotation
					sncr.annotations.designateSelected(context,firstItem);

					sncr.annotations.linkNoteToObject(context,firstItem,secondItem);
				}
				// If the second is a text layer with a linkType of annotation...
				else if (firstItem.class() != "MSTextLayer" && secondItem.class() == "MSTextLayer") {
					// Designate the text layer as an annotation
					sncr.annotations.designateSelected(context,secondItem);

					sncr.annotations.linkNoteToObject(context,secondItem,firstItem);
				}
				// If the selections do not contain a text layer with a linkType of annotation...
				else {
					// Display feedback
					displayDialog(sncr.strings["annotation-link-plugin"],sncr.strings["annotation-link-problem-textlayer"]);
				}

				break;
			// If there are not two selections...
			default:
				// Display feedback
				displayDialog(sncr.strings["annotation-link-plugin"],sncr.strings["annotation-link-problem-selection"]);
		}
	},
	linkNoteToObject: function(context,note,object) {
		// Set parent group
		var parentGroup = getParentGroup(sncr.page,sncr.parentGroupName);

		// Set annotation group
		var noteGroup = getChildGroup(parentGroup,sncr.artboardNoteGroupName);

		// Set stored values on annotation
		sncr.command.setValue_forKey_onLayer(object.objectID(),sncr.annotations.config.annotationLinkKey,note);
		sncr.command.setValue_forKey_onLayer(sncr.annotations.config.annotationLinkTypeValue,sncr.annotations.config.annotationLinkTypeKey,note);
		sncr.command.setValue_forKey_onLayer(object.parentArtboard().objectID(),sncr.annotations.config.annotationParentKey,note);

		// Determine max X of artboard, or parent artboard
		var artboardMaxX = (object.class() != "MSArtboardGroup") ? CGRectGetMaxX(object.parentArtboard().rect()) : CGRectGetMaxX(object.rect());

		// Set annotation position including offsets
		note.absoluteRect().setX(artboardMaxX + sncr.annotations.config.annotationXOffset);
		note.absoluteRect().setY(object.absoluteRect().y() + object.frame().height()/2 + sncr.annotations.config.annotationYOffset - sncr.annotations.config.annotationStyleData.lineHeight/2);

		// Set annotation width
		note.frame().setWidth(sncr.annotations.config.annotationWidth);

		// Set annotation font information
		note.setFontSize(sncr.annotations.config.annotationStyleData.fontSize);
		note.setLineHeight(sncr.annotations.config.annotationStyleData.lineHeight);
		note.setTextAlignment(sncr.annotations.config.annotationStyleData.textAlignment);

		// If the annotation is not in the annotation group...
		if (note.parentGroup() != noteGroup) {
			// Move the annotation to the annotation group
			note.moveToLayer_beforeLayer(noteGroup,nil);

			// Deselect the annotation (moveToLayer_beforeLayer selects it)
			note.select_byExpandingSelection(false,true);
		}

		// Get siblings for parent
		var predicate = NSPredicate.predicateWithFormat("userInfo != nil && function(userInfo,'valueForKeyPath:',%@)." + sncr.annotations.config.annotationParentKey + " == '" + object.parentArtboard().objectID() + "' && function(userInfo,'valueForKeyPath:',%@)." + sncr.annotations.config.annotationLinkTypeKey + " == " + sncr.annotations.config.annotationLinkTypeValue,sncr.pluginDomain),
			siblings = noteGroup.children().filteredArrayUsingPredicate(predicate);

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
						nextSibling.frame().setY(nextSibling.frame().y() + CGRectGetMaxY(thisSibling.rect()) - CGRectGetMinY(nextSibling.rect()) + sncr.annotations.config.annotationSpacing);
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
		var noteName = sncr.annotations.config.annotationLinkPrefix + note.name().split(/\r\n|\r|\n/g)[0].replace(sncr.annotations.config.annotationLinkPrefix,"");

		// Update the annotation layer name
		note.setName(sncr.annotations.config.annotationLinkPrefix + object.name());

		// Create a log event
		log(noteName + sncr.strings["annotation-link-complete"] + object.name());

		// Update all sibling connections
		sncr.annotations.updateAllSiblings(context,object.parentArtboard());

		// Display feedback
		displayMessage(noteName + sncr.strings["annotation-link-complete"] + object.name());
	},
	redraw: function(context) {
		// Set connections group
		var predicate = NSPredicate.predicateWithFormat("userInfo != nil && function(userInfo,'valueForKeyPath:',%@)." + sncr.annotations.config.connectionsGroupKey + " == true", sncr.pluginDomain),
			connectionsGroup = sncr.page.children().filteredArrayUsingPredicate(predicate).firstObject();

		// If connections group exists...
		if (connectionsGroup) {
			// Remove connections group
			connectionsGroup.removeFromParent();
		}

		// Construct loop of annotations
		var predicate = NSPredicate.predicateWithFormat("userInfo != nil && function(userInfo,'valueForKeyPath:',%@)." + sncr.annotations.config.annotationLinkKey + " != nil", sncr.pluginDomain),
			annotations = sncr.page.children().filteredArrayUsingPredicate(predicate),
			loop = annotations.objectEnumerator(),
			note;

		// Initiate connections array
		var connections = [];

		// Iterate through the annotations...
		while (note = loop.nextObject()) {
			// Get stored value for linked object
			var linkedObjectID = sncr.command.valueForKey_onLayer_forPluginIdentifier(sncr.annotations.config.annotationLinkKey,note,sncr.pluginDomain);

			// Get linked object if it resides on the page
			var predicate = NSPredicate.predicateWithFormat("objectID == %@",linkedObjectID),
				linkedObject = sncr.page.children().filteredArrayUsingPredicate(predicate).firstObject();

			// If linked object exists...
			if (linkedObject) {
				// Create connection object
				var connection = {
					linkRect : linkedObject.parentArtboard() ? CGRectIntersection(linkedObject.absoluteRect().rect(),linkedObject.parentArtboard().absoluteRect().rect()) : linkedObject.absoluteRect().rect(),
					linkID : note.objectID(),
					dropPoint : {
						x : note.absoluteRect().x() + sncr.annotations.config.annotationArrowXOffset,
						y : note.absoluteRect().y() + sncr.annotations.config.annotationArrowYOffset
					}
				}

				// Add connection object to connections array
				connections.push(connection);
			}
		}

		// Set parent group
		var parentGroup = getParentGroup(sncr.page,sncr.parentGroupName);

		// Set annotation group
		var noteGroup = getChildGroup(parentGroup,sncr.artboardNoteGroupName);

		// Create new connections group
		connectionsGroup = MSLayerGroup.new();

		// Get connection shape layers, and add to connections group
		drawShapes(connections,connectionsGroup);

		// Move connections group to annotation group
		connectionsGroup.moveToLayer_beforeLayer(noteGroup,nil);

		// Resize connections group to account for children
		connectionsGroup.resizeToFitChildrenWithOption(0);

		// Deselection connections and annotations groups
		connectionsGroup.deselectLayerAndParent();

		// Set connections group name
		connectionsGroup.setName(sncr.annotations.config.connectionsGroupName);

		// Lock connections group
		connectionsGroup.setIsLocked(1);

		// Set stored value on connections group
		sncr.command.setValue_forKey_onLayer_forPluginIdentifier(true,sncr.annotations.config.connectionsGroupKey,connectionsGroup,sncr.pluginDomain);
	},
	updateAllOnPage: function(context) {
		// Construct loop of annotations
		var predicate = NSPredicate.predicateWithFormat("userInfo != nil && function(userInfo,'valueForKeyPath:',%@)." + sncr.annotations.config.annotationLinkKey + " != nil && function(userInfo,'valueForKeyPath:',%@)." + sncr.annotations.config.annotationLinkTypeKey + " == " + sncr.annotations.config.annotationLinkTypeValue,sncr.pluginDomain),
			annotations = sncr.page.children().filteredArrayUsingPredicate(predicate),
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
			var parentGroup = getParentGroup(sncr.page,sncr.parentGroupName);

			// Set annotation group
			var noteGroup = getChildGroup(parentGroup,sncr.artboardNoteGroupName);

			// Iterate through annotations...
			while (note = loop.nextObject()) {
				// Get stored value for linked object
				var linkedObjectID = sncr.command.valueForKey_onLayer(sncr.annotations.config.annotationLinkKey,note);

				// Get linked object if it resides on the page
				var predicate = NSPredicate.predicateWithFormat("objectID == %@",linkedObjectID,sncr.pluginDomain),
					linkedObject = sncr.page.children().filteredArrayUsingPredicate(predicate).firstObject();

				// If linked object exists...
				if (linkedObject) {
					// If linked object has a parent...
					if (linkedObject.parentArtboard()) {
						// Get siblings for this linked object (figure out how to exclude current object)
						var predicate = NSPredicate.predicateWithFormat("userInfo != nil && function(userInfo,'valueForKeyPath:',%@)." + sncr.annotations.config.annotationParentKey + " == '" + linkedObject.parentArtboard().objectID() + "' && function(userInfo,'valueForKeyPath:',%@)." + sncr.annotations.config.annotationLinkTypeKey + " == " + sncr.annotations.config.annotationLinkTypeValue,sncr.pluginDomain),
							siblings = noteGroup.children().filteredArrayUsingPredicate(predicate);

						// If there are siblings...
						if (siblings.count() > 1) {
							// Add parent objectID to array of parents with siblings
							parentsWithSiblings.push(linkedObject.parentArtboard().objectID());
						}
					}

					// Determine max X of artboard, or parent artboard
					var artboardMaxX = linkedObject.parentArtboard() ? CGRectGetMaxX(linkedObject.parentArtboard().rect()) : CGRectGetMaxX(linkedObject.rect());

					// Set annotation position including offsets
					note.absoluteRect().setX(artboardMaxX + sncr.annotations.config.annotationXOffset);
					note.absoluteRect().setY(linkedObject.absoluteRect().y() + linkedObject.frame().height()/2 + sncr.annotations.config.annotationYOffset - sncr.annotations.config.annotationStyleData.lineHeight/2);

					// Set annotation width
					note.frame().setWidth(sncr.annotations.config.annotationWidth);

					// Set annotation font information
					note.setFontSize(sncr.annotations.config.annotationStyleData.fontSize);
					note.setLineHeight(sncr.annotations.config.annotationStyleData.lineHeight);
					note.setTextAlignment(sncr.annotations.config.annotationStyleData.textAlignment);

					// If the annotation is not in the annotation group...
					if (note.parentGroup() != noteGroup) {
						// Move the annotation to the annotation group
						note.moveToLayer_beforeLayer(noteGroup,nil);

						// Deselect the annotation (moveToLayer_beforeLayer selects it)
						note.select_byExpandingSelection(false,true);
					}

					// Update the annotation layer name
					note.setName(sncr.annotations.config.annotationLinkPrefix + linkedObject.name());

					// Iterate counter
					updateCount++;
				}
				// If object does not exist...
				else {
					// Remove stored values for linked artboard
					sncr.command.setValue_forKey_onLayer(nil,sncr.annotations.config.annotationLinkKey,note);
					sncr.command.setValue_forKey_onLayer(nil,sncr.annotations.config.annotationLinkTypeKey,note);
					sncr.command.setValue_forKey_onLayer(nil,sncr.annotations.config.annotationParentKey,note);

					// Set annotation name
					var noteName = note.name().replace(sncr.annotations.config.annotationLinkPrefix,""));

					// Update the layer name
					note.setName(noteName);

					// Iterate counters
					updateCount++;
					removeCount++;

					// Create a log event
					log(noteName + sncr.strings["annotation-unlink-complete"] + linkedObjectID);
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
						var predicate = NSPredicate.predicateWithFormat("userInfo != nil && function(userInfo,'valueForKeyPath:',%@)." + sncr.annotations.config.annotationParentKey + " == '" + parentsWithSiblings[i] + "' && function(userInfo,'valueForKeyPath:',%@)." + sncr.annotations.config.annotationLinkTypeKey + " == " + sncr.annotations.config.annotationLinkTypeValue,sncr.pluginDomain),
							siblings = noteGroup.children().filteredArrayUsingPredicate(predicate);

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
									nextSibling.frame().setY(nextSibling.frame().y() + CGRectGetMaxY(thisSibling.rect()) - CGRectGetMinY(nextSibling.rect()) + sncr.annotations.config.annotationSpacing);
								}
							}
						}
					}
				}

				// Resize annotation and parent groups to account for children
				noteGroup.resizeToFitChildrenWithOption(0);
				parentGroup.resizeToFitChildrenWithOption(0);

				// Redraw all connections
				sncr.annotations.redraw(context);
			}
			// If annotation group is empty...
			else {
				// Remove the annotation group
				noteGroup.removeFromParent();

				// Resize parent group to account for children
				parentGroup.resizeToFitChildrenWithOption(0);
			}

			// Move parent group to the top of the layer list
			parentGroup.moveToLayer_beforeLayer(sncr.page,nil);

			// Deselect parent group (moveToLayer_beforeLayer selects it)
			parentGroup.select_byExpandingSelection(false,true);

			// If the function was not invoked by action...
			if (!context.actionContext) {
				// If any annotation links were removed
				if (removeCount > 0) {
					// Display feedback
					displayMessage(updateCount + sncr.strings["annotation-update-complete"] + ", " + removeCount + sncr.strings["annotation-update-complete-unlinked"]);
				} else {
					// Display feedback
					displayMessage(updateCount + sncr.strings["annotation-update-complete"]);
				}
			}
		}
		// If there are no annotations...
		else {
			// If the function was not invoked by action...
			if (!context.actionContext) {
				// Display feedback
				displayMessage(updateCount + sncr.strings["annotation-update-complete"]);
			}
		}
	},
	updateAllSiblings: function(context,artboard) {
		// Construct loop of annotations
		var predicate = NSPredicate.predicateWithFormat("userInfo != nil && function(userInfo,'valueForKeyPath:',%@)." + sncr.annotations.config.annotationParentKey + " == '" + artboard.objectID() + "'",sncr.pluginDomain),
			annotations = sncr.page.children().filteredArrayUsingPredicate(predicate),
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
			var parentGroup = getParentGroup(sncr.page,sncr.parentGroupName);

			// Set annotation group
			var noteGroup = getChildGroup(parentGroup,sncr.artboardNoteGroupName);

			// Iterate through annotations...
			while (note = loop.nextObject()) {
				// Get stored value for linked object
				var linkedObjectID = sncr.command.valueForKey_onLayer(sncr.annotations.config.annotationLinkKey,note);

				// Get linked object if it resides on the page
				var predicate = NSPredicate.predicateWithFormat("objectID == %@",linkedObjectID,sncr.pluginDomain),
					linkedObject = sncr.page.children().filteredArrayUsingPredicate(predicate).firstObject();

				// If linked object exists...
				if (linkedObject) {
					// If linked object has a parent...
					if (linkedObject.parentArtboard()) {
						// Get siblings for this linked object (figure out how to exclude current object)
						var predicate = NSPredicate.predicateWithFormat("userInfo != nil && function(userInfo,'valueForKeyPath:',%@)." + sncr.annotations.config.annotationParentKey + " == '" + linkedObject.parentArtboard().objectID() + "' && function(userInfo,'valueForKeyPath:',%@)." + sncr.annotations.config.annotationLinkTypeKey + " == " + sncr.annotations.config.annotationLinkTypeValue,sncr.pluginDomain),
							siblings = noteGroup.children().filteredArrayUsingPredicate(predicate);

						// If there are siblings...
						if (siblings.count() > 1) {
							// Add parent objectID to array of parents with siblings
							parentsWithSiblings.push(linkedObject.parentArtboard().objectID());
						}
					}

					// Determine max X of artboard, or parent artboard
					var artboardMaxX = linkedObject.parentArtboard() ? CGRectGetMaxX(linkedObject.parentArtboard().rect()) : CGRectGetMaxX(linkedObject.rect());

					// Set annotation position including offsets
					note.absoluteRect().setX(artboardMaxX + sncr.annotations.config.annotationXOffset);
					note.absoluteRect().setY(linkedObject.absoluteRect().y() + linkedObject.frame().height()/2 + sncr.annotations.config.annotationYOffset - sncr.annotations.config.annotationStyleData.lineHeight/2);

					// Set annotation width
					note.frame().setWidth(sncr.annotations.config.annotationWidth);

					// Set annotation font information
					note.setFontSize(sncr.annotations.config.annotationStyleData.fontSize);
					note.setLineHeight(sncr.annotations.config.annotationStyleData.lineHeight);
					note.setTextAlignment(sncr.annotations.config.annotationStyleData.textAlignment);

					// If the annotation is not in the annotation group...
					if (note.parentGroup() != noteGroup) {
						// Move the annotation to the annotation group
						note.moveToLayer_beforeLayer(noteGroup,nil);

						// Deselect the annotation (moveToLayer_beforeLayer selects it)
						note.select_byExpandingSelection(false,true);
					}

					// Update the annotation layer name
					note.setName(sncr.annotations.config.annotationLinkPrefix + linkedObject.name());

					// Iterate counter
					updateCount++;
				}
				// If object does not exist...
				else {
					// Remove stored values for linked artboard
					sncr.command.setValue_forKey_onLayer(nil,sncr.annotations.config.annotationLinkKey,note);
					sncr.command.setValue_forKey_onLayer(nil,sncr.annotations.config.annotationLinkTypeKey,note);
					sncr.command.setValue_forKey_onLayer(nil,sncr.annotations.config.annotationParentKey,note);

					// Set annotation name
					var noteName = note.name().replace(sncr.annotations.config.annotationLinkPrefix,""));

					// Update the layer name
					note.setName(noteName);

					// Iterate counters
					updateCount++;
					removeCount++;

					// Create a log event
					log(noteName + sncr.strings["annotation-unlink-complete"] + linkedObjectID);
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
						var predicate = NSPredicate.predicateWithFormat("userInfo != nil && function(userInfo,'valueForKeyPath:',%@)." + sncr.annotations.config.annotationParentKey + " == '" + parentsWithSiblings[i] + "' && function(userInfo,'valueForKeyPath:',%@)." + sncr.annotations.config.annotationLinkTypeKey + " == " + sncr.annotations.config.annotationLinkTypeValue,sncr.pluginDomain),
							siblings = noteGroup.children().filteredArrayUsingPredicate(predicate);

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
									nextSibling.frame().setY(nextSibling.frame().y() + CGRectGetMaxY(thisSibling.rect()) - CGRectGetMinY(nextSibling.rect()) + sncr.annotations.config.annotationSpacing);
								}
							}
						}
					}
				}

				// Resize annotation and parent groups to account for children
				noteGroup.resizeToFitChildrenWithOption(0);
				parentGroup.resizeToFitChildrenWithOption(0);

				// Redraw all connections
				sncr.annotations.redraw(context);
			}
			// If annotation group is empty...
			else {
				// Remove the annotation group
				noteGroup.removeFromParent();

				// Resize parent group to account for children
				parentGroup.resizeToFitChildrenWithOption(0);
			}

			// Move parent group to the top of the layer list
			parentGroup.moveToLayer_beforeLayer(sncr.page,nil);

			// Deselect parent group (moveToLayer_beforeLayer selects it)
			parentGroup.select_byExpandingSelection(false,true);

			// If the function was not invoked by action...
			if (!context.actionContext) {
				// If any annotation links were removed
				if (removeCount > 0) {
					// Display feedback
					displayMessage(updateCount + sncr.strings["annotation-update-complete"] + ", " + removeCount + sncr.strings["annotation-update-complete-unlinked"]);
				} else {
					// Display feedback
					displayMessage(updateCount + sncr.strings["annotation-update-complete"]);
				}
			}
		}
		// If there are no annotations...
		else {
			// If the function was not invoked by action...
			if (!context.actionContext) {
				// Display feedback
				displayMessage(updateCount + sncr.strings["annotation-update-complete"]);
			}
		}
	},
	settings: function(context,command) {
		// Setting variables
		var defaultSettings = {};
		defaultSettings.autoAnnotate = 1;

		// Update default settings with cached settings
		defaultSettings = getCachedSettings(context,sncr.document.documentData(),defaultSettings,sncr.pluginDomain);

		// If a command is not passed, operate in config mode...
		if (!command) {
			var alertWindow = COSAlertWindow.new();

			alertWindow.setMessageText(sncr.strings["annotation-settings"]);

			var autoAnnotate = createCheckbox({
				name : sncr.strings["annotation-settings-automatic"],
				value: 1
			},defaultSettings.autoAnnotate,NSMakeRect(0,0,300,54));

			alertWindow.addAccessoryView(autoAnnotate);

			var buttonOK = alertWindow.addButtonWithTitle(sncr.strings["general-button-ok"]);
			var buttonCancel = alertWindow.addButtonWithTitle(sncr.strings["general-button-cancel"]);

			// Set key order and first responder
			setKeyOrder(alertWindow,[
				autoAnnotate,
				buttonOK
			]);

			var responseCode = alertWindow.runModal();

			if (responseCode == 1000) {
				try {
					sncr.command.setValue_forKey_onLayer(autoAnnotate.state(),"autoAnnotate",sncr.document.documentData());
				}
				catch(err) {
					log(sncr.strings["general-save-failed"]);
				}
			} else return false;
		}
		// Otherwise operate in run mode...
		else {
			// Return updated settings
			return {
				autoAnnotate : defaultSettings.autoAnnotate
			}
		}
	}
}

sncr.common = {
	linkObject : function(layer,destination,type) {
		switch (type) {
			case "condition" :
				sncr.command.setValue_forKey_onLayer(type,"linkType",layer);
				sncr.command.setValue_forKey_onLayer(destination.objectID(),"linkedObject",layer);
				sncr.command.setValue_forKey_onLayer(destination.parentArtboard().objectID(),"linkedParentArtboard",layer);

				break;
			case "section" :
				sncr.command.setValue_forKey_onLayer(type,"linkType",layer);
				sncr.command.setValue_forKey_onLayer(destination,sncr.sections.config.titleLinkKey,layer);

				break;
			default :
				log("sncr.common.linkObject: Invalid or missing link type");

				break;
		}
	}
}

sncr.conditions = {
	addEdit: function(context) {
		var selection = sncr.selection.firstObject();

		if (sncr.selection.count() != 1 || sncr.selection.count() == 1 && selection.class() == "MSArtboardGroup") {
			displayMessage("Select one layer which is not an artboard");

			return;
		}

		var predicate = NSPredicate.predicateWithFormat("userInfo != nil && function(userInfo,'valueForKeyPath:','" + sncr.pluginDomain + "').linkType == 'condition' && function(userInfo,'valueForKeyPath:','" + sncr.pluginDomain + "').linkedObject == '" + selection.objectID() + "'"),
			conditionGroup = sncr.page.artboards().filteredArrayUsingPredicate(predicate).firstObject();

		if (!conditionGroup) {
			var conditionGroup = MSArtboardGroup.new(),
				insertIndex = getLayerIndex(selection.parentArtboard()) + 1;

			sncr.common.linkObject(conditionGroup,selection,"condition");
			selection.parentArtboard().parentGroup().insertLayer_atIndex(conditionGroup,insertIndex);
		}

		conditionGroup.setName("-Conditions-");
		conditionGroup.setHasBackgroundColor(1);
		conditionGroup.setBackgroundColor(MSImmutableColor.colorWithSVGString("#F2F2F2"));

		sncr.layout.preclude(conditionGroup);

		conditionGroup.absoluteRect().setX(CGRectGetMaxX(selection.parentArtboard().rect()) + sncr.annotations.config.annotationXOffset);
		conditionGroup.absoluteRect().setY(selection.absoluteRect().y() + selection.frame().height() / 2 - 16);

		var predicate = NSPredicate.predicateWithFormat("className == %@","MSTextLayer"),
			conditions = conditionGroup.children().filteredArrayUsingPredicate(predicate);

		var alertWindow = COSAlertWindow.new();
		alertWindow.setMessageText("Conditions for " + selection.name());

		if (conditions.count() > 0) {
			for (var i = 0; i < conditions.count(); i++) {
				alertWindow.addAccessoryView(createLabel("Condition " + (i + 1),NSMakeRect(0,0,160,16)));
				alertWindow.addAccessoryView(createField(conditions[i].stringValue(),NSMakeRect(0,0,300,20)));
			}
		}

		alertWindow.addAccessoryView(createLabel("New Condition ",NSMakeRect(0,0,160,16)));
		alertWindow.addAccessoryView(createField("",NSMakeRect(0,0,300,20)));

		alertWindow.addButtonWithTitle(sncr.strings["general-button-ok"]);
		alertWindow.addButtonWithTitle(sncr.strings["general-button-cancel"]);
		alertWindow.addButtonWithTitle("Add Condition");

		var responseCode = alertWindow.runModal();

		if (responseCode == 1000) {
			// Do something
		} else if (responseCode == 1002) {
			// Add new condition to dialog
		} else return false;

		// Add in condition groups/texts
		// Resize to fit

		conditionGroup.frame().setWidth(200);
		conditionGroup.frame().setHeight(200);
	}
}

sncr.descriptions = {
	addEdit : function(context) {
		// If there is one artboard selected...
		if (sncr.selection.count() == 1 && sncr.selection[0] instanceof MSArtboardGroup) {
			// Artboard variable
			var artboard = sncr.selection[0];

			// Get existing artboard description for selected artboard
			var predicate = NSPredicate.predicateWithFormat("userInfo != nil && function(userInfo,'valueForKeyPath:',%@)." + sncr.descriptions.config.descriptionLinkKey + " == '" + artboard.objectID() + "'",sncr.pluginDomain),
				linkedDescription = sncr.page.children().filteredArrayUsingPredicate(predicate).firstObject();

			// Determine the initial artboard description value
			var artboardDescription = (linkedDescription) ? linkedDescription.stringValue() : "";

			// Present add/edit window with artboard description value
			artboardDescription = getArtboardDescription(artboard.name(),artboardDescription);

			// If artboard description value was returned
			if (artboardDescription) {
				// If artboard description already existed...
				if (linkedDescription) {
					// Update the artboard description with new value
					linkedDescription.setStringValue(artboardDescription);

					// Display feedback
					displayMessage(sncr.strings["description-update-complete"]);
				}
				// If artboard description did not exist...
				else {
					// Set parent group
					var parentGroup = getParentGroup(sncr.page,sncr.parentGroupName);

					// Set annotation group
					var descGroup = getChildGroup(parentGroup,sncr.descriptionsGroupName);

					// Set artboard description style
					var artboardDescStyle = getTextStyle(sncr.descriptions.config.descriptionStyleName,sncr.descriptions.config.descriptionStyleData);

					// Create new artboard description text layer
					var artboardDesc = MSTextLayer.new();
					artboardDesc.setStringValue(artboardDescription);
					artboardDesc.setName(sncr.descriptions.config.descriptionLinkPrefix + artboard.name());
					artboardDesc.setStyle(artboardDescStyle.newInstance());
					artboardDesc.setTextBehaviour(1);

					// Add artboard description to annotation group
					descGroup.addLayers([artboardDesc]);

					// Set artboard description x/y in relation to artboard, with offsets
					artboardDesc.absoluteRect().setX(artboard.frame().x() + sncr.descriptions.config.descriptionXOffset);
					artboardDesc.absoluteRect().setY(artboard.frame().y() + artboard.frame().height() + sncr.descriptions.config.descriptionYOffset);

					// Set artboard description width
					artboardDesc.frame().setWidth(artboard.frame().width());

					// Resize description and parent groups to account for children
					descGroup.resizeToFitChildrenWithOption(0);
					parentGroup.resizeToFitChildrenWithOption(0);

					// Set stored value for linked artboard
					sncr.command.setValue_forKey_onLayer(artboard.objectID(),sncr.descriptions.config.descriptionLinkKey,artboardDesc);

					// Display feedback
					displayMessage(sncr.strings["description-set-complete"]);
				}
			}

			function getArtboardDescription(artboardName,descriptionVal) {
				var alertWindow = COSAlertWindow.new();

				alertWindow.setMessageText(sncr.strings["description-set-plugin"]);

				alertWindow.addTextLabelWithValue("For " + artboardName + ":");

				var descriptionText = createField(descriptionVal,NSMakeRect(0,0,300,120));
				alertWindow.addAccessoryView(descriptionText);

				var buttonOK = alertWindow.addButtonWithTitle(sncr.strings["general-button-ok"]);
				var buttonCancel = alertWindow.addButtonWithTitle(sncr.strings["general-button-cancel"]);

				setKeyOrder(alertWindow,[
					descriptionText,
					buttonOK
				]);

				var responseCode = alertWindow.runModal();

				if (responseCode == 1000) {
					return descriptionText.stringValue();
				} else return false;
			}
		}
		// If there is not one artboard selected...
		else {
			// Display feedback
			displayDialog(sncr.strings["description-set-plugin"],sncr.strings["description-set-problem"]);
		}
	},
	linkSelected : function(context) {
		// Take action on selections...
		switch (sncr.selection.count()) {
			// If there are two selections...
			case 2:
				// Selection variables
				var firstItem = sncr.selection[0];
				var secondItem = sncr.selection[1];

				// If the first item is a text layer and text style name matches the provided name, and the second item is an artboard...
				if ((firstItem instanceof MSTextLayer && firstItem.sharedObject() && firstItem.sharedObject().name() == sncr.descriptions.config.descriptionStyleName) && secondItem instanceof MSArtboardGroup) {
					linkArtboardDesc(firstItem,secondItem);
				}
				// If the first item is an artboard, and the second item is a text layer and text style name matches the provided name...
				else if (firstItem instanceof MSArtboardGroup && (secondItem instanceof MSTextLayer && secondItem.sharedObject() && secondItem.sharedObject().name() == sncr.descriptions.config.descriptionStyleName)) {
					linkArtboardDesc(secondItem,firstItem);
				}
				// If the selections do not contain a artboard description text layer and artboard...
				else {
					// Display feedback
					displayDialog(sncr.strings["description-link-plugin"],sncr.strings["description-link-problem"]);
				}

				break;
			// If there are not two selections...
			default:
				// Display feedback
				displayDialog(sncr.strings["description-link-plugin"],sncr.strings["description-link-problem"]);
		}

		// Function to link a artboard description to an artboard
		function linkArtboardDesc(layer,artboard) {
			// Set stored value for linked artboard
			sncr.command.setValue_forKey_onLayer(artboard.objectID(),sncr.descriptions.config.descriptionLinkKey,layer);

			// Set parent group
			var parentGroup = getParentGroup(sncr.page,sncr.parentGroupName);

			// Set annotation group
			var descGroup = getChildGroup(parentGroup,sncr.descriptionsGroupName);

			// Set artboard description x/y in relation to artboard, with offsets
			layer.absoluteRect().setX(artboard.frame().x() + sncr.descriptions.config.descriptionXOffset);
			layer.absoluteRect().setY(artboard.frame().y() + artboard.frame().height() + sncr.descriptions.config.descriptionYOffset);

			// Set artboard description width
			layer.frame().setWidth(artboard.frame().width());

			// If the artboard description is not in the description group...
			if (layer.parentGroup() != descGroup) {
				// Move the artboard description to the description group
				layer.moveToLayer_beforeLayer(descGroup,nil);

				// Deselect the artboard description (moveToLayer_beforeLayer selects it)
				layer.select_byExpandingSelection(false,true);
			}

			// Deselect the artboard
			artboard.select_byExpandingSelection(false,true);

			// Resize description and parent groups to account for children
			descGroup.resizeToFitChildrenWithOption(0);
			parentGroup.resizeToFitChildrenWithOption(0);

			// Set layer name
			var layerName = sncr.descriptions.config.descriptionLinkPrefix + artboard.name();

			// Update the layer name
			layer.setName(layerName);

			// Create a log event
			log(layerName + sncr.strings["description-link-complete"] + artboard.name());

			// Display feedback
			displayMessage(layerName + sncr.strings["description-link-complete"] + artboard.name());
		}
	},
	unlinkSelected : function(context) {
		// If there are selections...
		if (sncr.selection.count() > 0) {
			// Set a counter
			var count = 0;

			// Iterate through selections...
			for (var i = 0; i < sncr.selection.count(); i++) {
				// Get stored value for linked artboard
				var linkedArtboard = sncr.command.valueForKey_onLayer(sncr.descriptions.config.descriptionLinkKey,sncr.selection[i]);

				// If selection is linked to an artboard...
				if (linkedArtboard) {
					// Set linked artboard value to nil
					sncr.command.setValue_forKey_onLayer(nil,sncr.descriptions.config.descriptionLinkKey,sncr.selection[i]);

					// Set the layer name
					var layerName = sncr.selection[i].name().replace(sncr.descriptions.config.descriptionLinkPrefix,""));

					// Update the title name
					sncr.selection[i].setName(layerName);

					// For logging purposes, get linked artboard object
					var artboard = findLayerByID(sncr.selection[i].parentGroup(),linkedArtboard);

					// If artboard exists, use artboard name for name, otherwise use artboard ID
					artboardName = (artboard) ? artboard.name() : linkedArtboard;

					// Create a log event
					log(layerName + sncr.strings["description-unlink-complete"] + artboardName);

					// Iterate the counter
					count++;
				}

				// Deselect current selection
				sncr.selection[i].select_byExpandingSelection(false,true);
			}

			// Display feedback
			displayMessage(count + sncr.strings["description-unlinks-complete"]);
		}
		// If there are no selections...
		else {
			// Display feedback
			displayDialog(sncr.strings["description-unlink-plugin"],sncr.strings["description-unlink-problem"]);
		}
	},
	selectAllOnPage : function(context) {
		// Deselect everything in the current page
		sncr.page.changeSelectionBySelectingLayers(nil);

		// Set a counter
		var count = 0;

		// Get the descriptions and construct a loop
		var predicate = NSPredicate.predicateWithFormat("userInfo != nil && function(userInfo,'valueForKeyPath:',%@)." + sncr.descriptions.config.descriptionLinkKey + " != nil && function(userInfo,'valueForKeyPath:',%@)." + sncr.descriptions.config.descriptionLinkTypeKey + " == nil",sncr.pluginDomain),
			layers = sncr.page.children().filteredArrayUsingPredicate(predicate),
			loop = layers.objectEnumerator(),
			layer;

		// Iterate through descriptions...
		while (layer = loop.nextObject()) {
			// Select the artboard description while maintaining other selections
			layer.select_byExpandingSelection(true,true);

			// Iterate the counter
			count++;
		}

		// Display feedback
		displayMessage(count + sncr.strings["description-selects-complete"]);
	},
	updateAllOnPage: function(context,command) {
		// If function was invoked by action, set command
		if (!command && context.actionContext) command = "action";

		logFunctionStart("Artboard Descriptions: Update",command);

		var settings = sncr.descriptions.settings(context,"update");

		// Get descriptions on current page
		var predicate = NSPredicate.predicateWithFormat("userInfo != nil && function(userInfo,'valueForKeyPath:',%@)." + sncr.descriptions.config.descriptionLinkKey + " != nil && function(userInfo,'valueForKeyPath:',%@)." + sncr.descriptions.config.descriptionLinkTypeKey + " == nil",sncr.pluginDomain),
			layers = sncr.page.children().filteredArrayUsingPredicate(predicate),
			loop = layers.objectEnumerator(),
			layer;

		// If there are descriptions...
		if (layers.count() > 0) {
			// Set counters
			var updateCount = 0;
			var removeCount = 0;

			// Set parent group
			var parentGroup = getParentGroup(sncr.page,sncr.parentGroupName);

			// Set annotation group
			var descGroup = getChildGroup(parentGroup,sncr.descriptionsGroupName);

			// Iterate through descriptions...
			while (layer = loop.nextObject()) {
				sncr.command.setValue_forKey_onLayer(sncr.descriptions.config.descriptionLinkTypeValue,sncr.descriptions.config.descriptionLinkTypeKey,layer);

				// Get stored value for linked artboard
				var linkedArtboard = sncr.command.valueForKey_onLayer(sncr.descriptions.config.descriptionLinkKey,layer);

				// Get linked artboard object, if it resides on the artboard description page
				var predicate = NSPredicate.predicateWithFormat("objectID == %@",linkedArtboard,sncr.pluginDomain),
					artboard = sncr.page.artboards().filteredArrayUsingPredicate(predicate).firstObject();

				// If artboard object exists...
				if (artboard) {
					// Determine layer width
					var layerWidth = (settings.descriptionWidth && settings.descriptionWidth != "") ? settings.descriptionWidth : artboard.frame().width();

					// Set artboard description width
					layer.frame().setWidth(layerWidth);

					// Set artboard description x/y in relation to artboard, with offsets
					if (settings.descriptionPosition == 1) { // Right
						layer.absoluteRect().setX(artboard.frame().x() + artboard.frame().width() + settings.descriptionXOffset);
						layer.absoluteRect().setY(artboard.frame().y() + settings.descriptionYOffset);
					} else if (settings.descriptionPosition == 2) { // Bottom
						layer.absoluteRect().setX(artboard.frame().x() + settings.descriptionXOffset);
						layer.absoluteRect().setY(artboard.frame().y() + artboard.frame().height() + settings.descriptionYOffset);
					} else if (settings.descriptionPosition == 3) { // Left
						layer.absoluteRect().setX(artboard.frame().x() + settings.descriptionXOffset - layerWidth);
						layer.absoluteRect().setY(artboard.frame().y() + settings.descriptionYOffset);
					} else { // Top
						layer.absoluteRect().setX(artboard.frame().x() + settings.descriptionXOffset);
						layer.absoluteRect().setY(artboard.frame().y() + settings.descriptionYOffset - layer.frame().height());
					}

					// If the artboard description is not in the description group...
					if (layer.parentGroup() != descGroup) {
						// Move the artboard description to the description group
						layer.moveToLayer_beforeLayer(descGroup,nil);

						// Deselect the artboard description (moveToLayer_beforeLayer selects it)
						layer.select_byExpandingSelection(false,true);
					}

					// Set layer name
					var layerName = sncr.descriptions.config.descriptionLinkPrefix + artboard.name();

					// Update the layer name
					layer.setName(layerName);

					// Iterate counter
					updateCount++;
				}
				// If artboard object does not exist...
				else {
					// Remove stored value for linked artboard
					sncr.command.setValue_forKey_onLayer(nil,sncr.descriptions.config.descriptionLinkKey,layer);

					// Set layer name
					var layerName = layer.name().replace(sncr.descriptions.config.descriptionLinkPrefix,""));

					// Update the layer name
					layer.setName(layerName);

					// Create a log event
					log(layerName + sncr.strings["description-unlink-complete"] + linkedArtboard);

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

			// Move parent group to the top of the layer list
			parentGroup.moveToLayer_beforeLayer(sncr.page,nil);

			// Deselect parent group
			parentGroup.select_byExpandingSelection(false,true);

			// If the function was not invoked by action...
			if (!context.actionContext) {
				// Lock the parent group
				parentGroup.setIsLocked(1);

				// If any artboard links were removed
				if (removeCount > 0) {
					// Display feedback
					displayMessage(updateCount + sncr.strings["description-updates-complete"] + ", " + removeCount + sncr.strings["description-updates-complete-unlinked"]);
				} else {
					// Display feedback
					displayMessage(updateCount + sncr.strings["description-updates-complete"]);
				}
			}
		}
	},
	settings : function(context,command) {
		var descriptionPositions = ["Top","Right","Bottom","Left"];

		// Setting variables
		var settings = {};
		settings.descriptionWidth = "";
		settings.descriptionPosition = 2;
		settings.descriptionXOffset = sncr.descriptions.config.descriptionXOffset;
		settings.descriptionYOffset = sncr.descriptions.config.descriptionYOffset;

		settings = getCachedSettings(context,sncr.document.documentData(),settings,sncr.pluginDomain);

		if (!command) {
			var alertWindow = COSAlertWindow.new();
			alertWindow.setMessageText(sncr.strings["description-settings-title"]);

			alertWindow.addTextLabelWithValue(sncr.strings["description-settings-width"]);

			var descriptionWidth = createField(settings.descriptionWidth,NSMakeRect(0,0,60,24));
			alertWindow.addAccessoryView(descriptionWidth);

			alertWindow.addTextLabelWithValue(sncr.strings["description-settings-position"]);

			var descriptionPosition = createSelect(descriptionPositions,settings.descriptionPosition,NSMakeRect(0,0,80,28));
			alertWindow.addAccessoryView(descriptionPosition);

			alertWindow.addTextLabelWithValue(sncr.strings["description-settings-offsetX"]);

			var descriptionXOffset = createField(settings.descriptionXOffset,NSMakeRect(0,0,60,24));
			alertWindow.addAccessoryView(descriptionXOffset);

			alertWindow.addTextLabelWithValue(sncr.strings["description-settings-offsetY"]);

			var descriptionYOffset = createField(settings.descriptionYOffset,NSMakeRect(0,0,60,24));
			alertWindow.addAccessoryView(descriptionYOffset);

			var buttonOK = alertWindow.addButtonWithTitle(sncr.strings["general-button-ok"]);
			var buttonCancel = alertWindow.addButtonWithTitle(sncr.strings["general-button-cancel"]);

			setKeyOrder(alertWindow,[
				descriptionWidth,
				descriptionPosition,
				descriptionXOffset,
				descriptionYOffset,
				buttonOK
			]);

			var responseCode = alertWindow.runModal();

			if (responseCode == 1000) {
				try {
					sncr.command.setValue_forKey_onLayer(descriptionWidth.stringValue(),"descriptionWidth",sncr.document.documentData());
					sncr.command.setValue_forKey_onLayer(descriptionPosition.indexOfSelectedItem(),"descriptionPosition",sncr.document.documentData());
					sncr.command.setValue_forKey_onLayer(Number(descriptionXOffset.stringValue()),"descriptionXOffset",sncr.document.documentData());
					sncr.command.setValue_forKey_onLayer(Number(descriptionYOffset.stringValue()),"descriptionYOffset",sncr.document.documentData());
				}
				catch(err) {
					log(sncr.strings["general-save-failed"]);
				}

				sncr.descriptions.updateAllOnPage(context,"settings");
			} else return false;
		} else {
			return {
				descriptionWidth : settings.descriptionWidth,
				descriptionPosition : settings.descriptionPosition,
				descriptionXOffset : settings.descriptionXOffset,
				descriptionYOffset : settings.descriptionYOffset
			}
		}
	}
}

sncr.layout = {
	includeSelected: function(context) {
		var count = 0;

		if (sncr.selection.count()) {
			for (var i = 0; i < sncr.selection.count(); i++) {
				if (sncr.selection[i] instanceof MSArtboardGroup) {
					sncr.layout.include(sncr.selection[i]);

					count++;

					log(sncr.selection[i].name() + sncr.strings["layout-include-complete"]);
				}
			}

			if (sncr.selection.count() == 1) {
				displayMessage(sncr.selection[0].name() + sncr.strings["layout-include-complete"]);
			} else {
				displayMessage(count + sncr.strings["layout-includes-complete"]);
			}
		} else {
			displayDialog(sncr.strings["layout-include-plugin"],sncr.strings["layout-include-problem"]);
		}
	},
	includePage: function(context,feedback) {
		sncr.layout.include(sncr.page);

		sncr.layout.sanitizePages(context);

		if (!feedback) {
			displayMessage(sncr.page.name() + sncr.strings["layout-include-page-complete"]);
		}
	},
	include: function(object) {
		sncr.command.setValue_forKey_onLayer(true,sncr.layout.config.featureKey,object);
	},
	precludeSelected: function(context) {
		var count = 0;

		if (sncr.selection.count()) {
			for (var i = 0; i < sncr.selection.count(); i++) {
				if (sncr.selection[i] instanceof MSArtboardGroup) {
					sncr.layout.preclude(sncr.selection[i]);

					count++;

					log(sncr.selection[i].name() + sncr.strings["layout-preclude-complete"]);
				}
			}

			if (sncr.selection.count() == 1) {
				displayMessage(sncr.selection[0].name() + sncr.strings["layout-preclude-complete"]);
			} else {
				displayMessage(count + sncr.strings["layout-precludes-complete"]);
			}
		} else {
			displayDialog(sncr.strings["layout-preclude-plugin"],sncr.strings["layout-preclude-problem"]);
		}
	},
	precludePage: function(context) {
		sncr.layout.preclude(sncr.page);

		sncr.layout.sanitizePages(context);

		displayMessage(sncr.page.name() + sncr.strings["layout-preclude-page-complete"]);
	},
	preclude: function(object) {
		sncr.command.setValue_forKey_onLayer(false,sncr.layout.config.featureKey,object);
	},
	sanitizePages: function(context) {
		var loop = sncr.pages.objectEnumerator(),
			page,
			pageName;

		while (page = loop.nextObject()) {
			if (!sncr.command.valueForKey_onLayer(sncr.layout.config.featureKey,page)) {
				sncr.command.setValue_forKey_onLayer(false,sncr.layout.config.featureKey,page);
			} else {
				pageName = (sncr.command.valueForKey_onLayer(sncr.layout.config.featureKey,page) == true) ? sncr.layout.config.pageNamePrefix + page.name().replace(sncr.layout.config.pageNamePrefix,"") : page.name().replace(sncr.layout.config.pageNamePrefix,"");

				page.setName(pageName);
			}
		}
	},
	update: function(context) {
		if (!context.actionContext) {
			sncr.layout.includePage(context,false);
		} else {
			sncr.layout.sanitizePages(context);
		}

		if (sncr.command.valueForKey_onLayer_forPluginIdentifier(sncr.layout.config.featureKey,sncr.page,sncr.pluginDomain) != false) {
			var layoutArtboards = sncr.page.artboards().filteredArrayUsingPredicate(NSPredicate.predicateWithFormat("userInfo == nil || function(userInfo,'valueForKeyPath:',%@)." + sncr.layout.config.featureKey + " != " + false,sncr.pluginDomain)),
				layoutArtboardCount = layoutArtboards.count();

			// Run only if there are artboards
			if (layoutArtboardCount) {
				// Reset page origin
				var pageOrigin = CGPointMake(0,0);
				sncr.page.setRulerBase(pageOrigin);

				// Get layout settings
				var layoutSettings = sncr.layout.settings(context,"update");

				// Layout the artboards
				if (layoutSettings) {
					if (layoutSettings.sortOrder != 0) {
						var sortByName = [NSSortDescriptor sortDescriptorWithKey:"name" ascending:1];
						layoutArtboards = [layoutArtboards sortedArrayUsingDescriptors:[sortByName]];

						var layoutLayers = (layoutSettings.sortOrder == 2) ? [[layoutArtboards reverseObjectEnumerator] allObjects] : layoutArtboards;

						sortLayerList(layoutLayers,sncr.page);
					}

					var firstBoard = layoutArtboards.objectAtIndex(0);
					var lastBoard = layoutArtboards.objectAtIndex(layoutArtboardCount-1);
					var lastBoardPrefix = 0;

					var groupType = parseInt(firstBoard.name()) == parseInt(lastBoard.name()) ? 0 : 1;
					var groupCount = 1;
					var groupLayout = [];

					for (var i = 0; i < layoutArtboardCount; i++) {
						var artboard = layoutArtboards.objectAtIndex(i);
						var artboardName = artboard.name();

						var thisBoardPrefix = (groupType == 0) ? parseFloat(artboardName) : parseInt(artboardName);

						if (lastBoardPrefix != 0 && lastBoardPrefix != thisBoardPrefix) {
							groupCount++;
						}

						groupLayout.push({
							artboard: artboardName,
							prefix: thisBoardPrefix,
							group: groupCount
						});

						lastBoardPrefix = thisBoardPrefix;
					}

					var rowCount = layoutSettings.rowCount;
					var rowDensity = layoutSettings.rowDensity;
					var rowHeight = 0;
					var x = 0;
					var y = 0;
					var xPad = parseInt(layoutSettings.xPad);
					var yPad = parseInt(layoutSettings.yPad);
					var xCount = 0;

					var groupCount = 1;

					for (var i = 0; i < groupLayout.length; i++) {
						var artboard = layoutArtboards.objectAtIndex(i);
						var artboardFrame = artboard.frame();

						// If starting a new group, reset x and calculate the y position of the next row
						if (groupLayout[i]['group'] != groupCount) {
							var nextGroupTotal = groupCounter(groupCount+1,groupLayout);
							var rowSpace = rowCount - (xCount+1);

							if (rowDensity == 1 || rowSpace < nextGroupTotal) {
								x = 0;
								y += rowHeight + yPad;
								rowHeight = 0;
								xCount = 0;
							} else {
								x += artboardFrame.width() + xPad;
								xCount++;
							}

							groupCount++;
						}

						// If new line is detected but is continuation of group, give smaller vertical padding
						if (x == 0 && xCount != 0) {
							y += yPad/2;
						}

						// Position current artboard
						artboardFrame.x = x;
						artboardFrame.y = y;

						// Keep track if this artboard is taller than previous artboards in row
						if (artboardFrame.height() > rowHeight) {
							rowHeight = artboardFrame.height();
						}

						// Determine if this is the last artboard the row, reset x and calculate the y position of the next row
						if ((xCount + 1) % rowCount == 0) {
							x = 0;
							y += rowHeight;
							rowHeight = 0;
						} else {
							x += artboardFrame.width() + xPad;
						}

						xCount++;
					}

					sncr.sections.updateAllOnPage(context,"layout");
					sncr.titles.create(context,"layout");
					sncr.descriptions.updateAllOnPage(context,"layout");
					sncr.annotations.updateAllOnPage(context,"layout");

					// Collapse everything if run manually
					if (!context.actionContext) actionWithType(context,"MSCollapseAllGroupsAction").doPerformAction(nil);

					// Feedback to user
					displayMessage(sncr.strings["layout-artboards-complete"]);
				}
			}

			function groupCounter(group,obj) {
				var count = 0;

				for (var i = 0; i < obj.length; ++i) {
					if (obj[i]['group'] == group) {
						count++;
					}
				}

				return count;
			}

			function sortLayerList(artboards,output) {
				var loop = artboards.objectEnumerator(), artboard;

				while (artboard = loop.nextObject()) {
					artboard.moveToLayer_beforeLayer(output,nil);
					artboard.select_byExpandingSelection(false,true);
				}
			}
		}
	},
	settings: function(context,command) {
		var artboardsPerRow = ['4','6','8','10','12','14','100'];

		// Setting variables
		var defaultSettings = {};
		defaultSettings.artboardsPerRowDefault = 2;
		defaultSettings.rowDensity = 0;
		defaultSettings.sortOrder = 0;
		defaultSettings.xPad = '400';
		defaultSettings.yPad = '600';

		// Update default settings with cached settings
		defaultSettings = getCachedSettings(context,sncr.page,defaultSettings,sncr.pluginDomain);

		// If a command is not passed, operate in config mode...
		if (!command) {
			var alertWindow = COSAlertWindow.new();
			alertWindow.setMessageText(sncr.strings["layout-artboards-plugin"]);

			alertWindow.addTextLabelWithValue('How many artboards per row?');

			var perRow = createSelect(artboardsPerRow,defaultSettings.artboardsPerRowDefault,NSMakeRect(0,0,80,25));
			alertWindow.addAccessoryView(perRow);

			alertWindow.addTextLabelWithValue('Choose a layout type:');

			var rowDensity = createRadioButtons(['Dense layout','Loose layout'],defaultSettings.rowDensity);
			alertWindow.addAccessoryView(rowDensity);

			alertWindow.addTextLabelWithValue('Choose a sort type:');

			var sortOrder = createRadioButtons(['Do not sort anything','Sort layers and artboards','Sort layers and artboards, reverse layer order'],defaultSettings.sortOrder);
			alertWindow.addAccessoryView(sortOrder);

			alertWindow.addAccessoryView(createLabel('Advanced Settings',NSMakeRect(0,0,160,25)));

			alertWindow.addTextLabelWithValue('Horizontal spacing:');

			var xPad = createField(defaultSettings.xPad);
			alertWindow.addAccessoryView(xPad);

			alertWindow.addTextLabelWithValue('Vertical spacing:');

			var yPad = createField(defaultSettings.yPad);
			alertWindow.addAccessoryView(yPad);

			var buttonOK = alertWindow.addButtonWithTitle(sncr.strings["general-button-ok"]);
			var buttonCancel = alertWindow.addButtonWithTitle(sncr.strings["general-button-cancel"]);

			// Set key order and first responder
			setKeyOrder(alertWindow,[
				perRow,
				rowDensity,
				sortOrder,
				xPad,
				yPad,
				buttonOK
			]);

			var responseCode = alertWindow.runModal();

			if (responseCode == 1000) {
				try {
					sncr.command.setValue_forKey_onLayer(perRow.indexOfSelectedItem(),"artboardsPerRowDefault",sncr.page);
					sncr.command.setValue_forKey_onLayer(rowDensity.selectedCell().tag(),"rowDensity",sncr.page);
					sncr.command.setValue_forKey_onLayer(sortOrder.selectedCell().tag(),"sortOrder",sncr.page);
					sncr.command.setValue_forKey_onLayer(xPad.stringValue(),"xPad",sncr.page);
					sncr.command.setValue_forKey_onLayer(yPad.stringValue(),"yPad",sncr.page);
				}
				catch(err) {
					log(sncr.strings["general-save-failed"]);
				}

				sncr.layout.update(context);
			} else return false;
		}
		// Otherwise operate in run mode...
		else {
			// Return updated settings
			return {
				rowCount : artboardsPerRow[defaultSettings.artboardsPerRowDefault],
				rowDensity : defaultSettings.rowDensity,
				sortOrder : defaultSettings.sortOrder,
				xPad : defaultSettings.xPad,
				yPad : defaultSettings.yPad
			}
		}
	}
}

sncr.other = {
	createSlice: function(context) {
		// Document variables
		var doc = context.document;
		var command = sncr.command;
		var page = doc.currentPage();
		var pages = doc.pages();
		var artboards = page.artboards();
		var layers = page.layers();

		// Selection variables
		var selection = context.selection;
		var selectedCount = selection.count();

		// User	variables
		var sliceSettings = showSliceSettings();
		var pageBounds = doc.currentPage().contentBounds();

		// Set variables per bound type
		if (sliceSettings.sliceType >= 0) {
			if (sliceSettings.sliceType == 1) {
				// Get layout values of selections
				var selectionSize = getSelectionSize(artboards);

				// Layout variables
				var margin = sliceSettings.sliceMargin;
				var sliceX = selectionSize.minX - margin;
				var sliceY = selectionSize.minY - margin;
				var sliceWidth = selectionSize.width + (margin*2);
				var sliceHeight = selectionSize.height + (margin*2);

				// Create slice
				createSlice('Artboards',sliceWidth,sliceHeight,sliceX,sliceY,sliceSettings,false,false);

				// Feedback to user
				doc.showMessage("Slice created around selections!");
			} else {
				if (selectedCount < 2) {
					var app = NSApplication.sharedApplication();
					app.displayDialog_withTitle("Please select two or more artboards.","Create Artboard Slice")
				} else {
					// Get layout values of selections
					var selectionSize = getSelectionSize(selection);

					// Layout variables
					var margin = 100;
					var sliceX = selectionSize.minX - margin;
					var sliceY = selectionSize.minY - margin;
					var sliceWidth = selectionSize.width + (margin*2);
					var sliceHeight = selectionSize.height + (margin*2);

					// Create slice
					createSlice('Selections',sliceWidth,sliceHeight,sliceX,sliceY,sliceSettings,false,false);

					// Feedback to user
					doc.showMessage("Slice created around selections!");
				}
			}
		}

		function createSlice(name,sliceWidth,sliceHeight,sliceX,sliceY,sliceSettings,isLocked,isUnique) {
			// Slice variables
			var sliceLayer;
			var sliceName = name;
			var sliceColor = MSColor.colorWithRed_green_blue_alpha(239/255,239/255,239/255,1.0);
			var exportScale = sliceSettings.exportScale;
			var exportFormat = sliceSettings.exportFormat.toLowerCase();

			// If slice should be unique
			if (isUnique) {
				// Find slice with provided name
				sliceLayer = findLayerByName(page,sliceName,MSSliceLayer);

				// Delete slice if one already exists
				if (sliceLayer) {
					sliceLayer.parentGroup().removeLayer(sliceLayer);
				}
			}

			// Create new slice
			sliceLayer = [MSSliceLayer new];
			sliceLayer.setName(sliceName);
			sliceLayer.setBackgroundColor(sliceColor);
			sliceLayer.setIsLocked(isLocked);
			sliceLayer.hasBackgroundColor = true;

			// Set slice dimensions
			sliceLayer.frame().setX(sliceX);
			sliceLayer.frame().setY(sliceY);
			sliceLayer.frame().setWidth(sliceWidth);
			sliceLayer.frame().setHeight(sliceHeight);

			// Insert slice into page
			doc.currentPage().addLayers([sliceLayer]);

			// Select the slice and move it to the bottom of the layer list
			sliceLayer.select_byExpandingSelection(true,false);
			actionWithType(context,"MSMoveToBackAction").doPerformAction(nil);

			// Replace default slice export format
			sliceLayer.exportOptions().removeAllExportFormats();

			var format = sliceLayer.exportOptions().addExportFormat();
			format.setScale(exportScale);
			format.setFileFormat(exportFormat);
		}

		function showSliceSettings() {
			// Setting variables
			var defaultSettings = {};
			defaultSettings.sliceType = 1;
			defaultSettings.sliceMargin = '100';
			defaultSettings.exportScales = ['.5x','1x','2x','3x'];
			defaultSettings.exportScale = 0;
			defaultSettings.exportFormats = ['JPG','PDF','PNG'];
			defaultSettings.exportFormat = 1;

			// Update default settings with cached settings
			defaultSettings = getCachedSettings(context,sncr.document.documentData(),defaultSettings,sncr.pluginDomain);

			var alertWindow = COSAlertWindow.new();
			alertWindow.setMessageText('Create Artboard Slice');

			var sliceTypeRadio = createRadioButtons(["Create slice around selections","Create slice around all artboards"],defaultSettings.sliceType);
			alertWindow.addAccessoryView(sliceTypeRadio);

			alertWindow.addTextLabelWithValue('Slice margin:');

			var sliceMarginSize = createField(defaultSettings.sliceMargin,NSMakeRect(0,0,60,20));
			alertWindow.addAccessoryView(sliceMarginSize);

			alertWindow.addTextLabelWithValue('Slice export density:');

			var sliceExportSelect = createSelect(defaultSettings.exportScales,defaultSettings.exportScale,NSMakeRect(0,0,100,25))
			alertWindow.addAccessoryView(sliceExportSelect);

			alertWindow.addTextLabelWithValue('Slice export format:');

			var sliceFormatSelect = createSelect(defaultSettings.exportFormats,defaultSettings.exportFormat,NSMakeRect(0,0,100,25))
			alertWindow.addAccessoryView(sliceFormatSelect);

			var buttonOK = alertWindow.addButtonWithTitle(sncr.strings["general-button-ok"]);
			var buttonCancel = alertWindow.addButtonWithTitle(sncr.strings["general-button-cancel"]);

			// Set key order and first responder
			setKeyOrder(alertWindow,[
				sliceTypeRadio,
				sliceMarginSize,
				sliceExportSelect,
				sliceFormatSelect,
				buttonOK
			]);

			var responseCode = alertWindow.runModal();

			if (responseCode == 1000) {
				try {
					context.command.setValue_forKey_onLayer(sliceTypeRadio.selectedCell().tag(),"sliceType",sncr.document.documentData());
					context.command.setValue_forKey_onLayer(sliceMarginSize.stringValue(),"sliceMargin",sncr.document.documentData());
					context.command.setValue_forKey_onLayer(sliceExportSelect.indexOfSelectedItem(),"exportScale",sncr.document.documentData());
					context.command.setValue_forKey_onLayer(sliceFormatSelect.indexOfSelectedItem(),"exportFormat",sncr.document.documentData());
				}
				catch(err) {
					log(sncr.strings["general-save-failed"]);
				}

				return {
					sliceType : sliceTypeRadio.selectedCell().tag(),
					sliceMargin : sliceMarginSize.stringValue(),
					exportScale : defaultSettings.exportScales[sliceExportSelect.indexOfSelectedItem()].slice(0,-1),
					exportFormat : defaultSettings.exportFormats[sliceFormatSelect.indexOfSelectedItem()]
				}
			} else return false;
		}

		function getSelectionSize(selection) {
			var minX,minY,maxX,maxY;
			minX=minY=Number.MAX_VALUE;
			maxX=maxY=-0xFFFFFFFF;

			for (var i = 0; i < selection.count(); i++) {
				var frame = selection.objectAtIndex(i).frame();

				minX = Math.min(minX,frame.minX());
				minY = Math.min(minY,frame.minY());
				maxX = Math.max(maxX,frame.maxX());
				maxY = Math.max(maxY,frame.maxY());
			}

			return {
				width: maxX-minX,
				height: maxY-minY,
				minX: minX,
				minY: minY
			};
		}
	}
}

sncr.sections = {
	linkSelected: function(context,command) {
		// Validate the selections to link
		var selections = sncr.sections.validateSelected(context);

		// If selections are valid...
		if (selections) {
			// Set stored value for linked artboard
			sncr.common.linkObject(selections.title,selections.artboard.objectID(),"section");

			// Get layer name
			var layerName = sncr.sections.getName(selections.title);

			// Update the layer name
			selections.title.setName(layerName);

			// Create a log event
			log(layerName + sncr.strings["section-link-complete"] + selections.artboard.name());

			// Update all section titles on the page
			sncr.sections.updateAllOnPage(context,"link");

			// Display feedback
			displayMessage(layerName + sncr.strings["section-link-complete"] + selections.artboard.name());
		}
	},
	unlinkSelected: function(context) {
		// If there are selections...
		if (sncr.selection.count() > 0) {
			// Iterative variables
			var titleName,
				artboardName,
				count = 0;

			// Iterate through selections...
			for (var i = 0; i < sncr.selection.count(); i++) {
				// Get stored value for linked artboard
				var linkedArtboard = sncr.command.valueForKey_onLayer(sncr.sections.config.titleLinkKey,sncr.selection[i]);

				// If selection is linked to an artboard...
				if (linkedArtboard) {
					// Set linked artboard value to nil
					sncr.command.setValue_forKey_onLayer(nil,sncr.sections.config.titleLinkKey,sncr.selection[i]);

					// Set the title name
					titleName = sncr.selection[i].name().replace(sncr.sections.config.titleLinkPrefix,""));

					// Update the title name
					sncr.selection[i].setName(titleName);

					// Unlock the section title
					sncr.selection[i].setIsLocked(0);

					// For logging purposes, get linked artboard object
					var artboard = findLayerByID(sncr.selection[i].parentGroup(),linkedArtboard);

					// If artboard exists, use artboard name for name, otherwise use artboard ID
					artboardName = (artboard) ? artboard.name() : linkedArtboard;

					// Create a log event
					log(titleName + sncr.strings["section-unlink-complete"] + artboardName);

					// Iterate the counter
					count++;
				}

				// Deselect current selection
				sncr.selection[i].select_byExpandingSelection(false,true);
			}

			// If there is only one selection...
			if (sncr.selection.count() == 1) {
				// Display feedback
				displayMessage(titleName + sncr.strings["section-unlink-complete"] + artboardName);
			}
			// If there is more than one selection...
			else {
				// Display feedback
				displayMessage(count + sncr.strings["section-unlinks-complete"]);
			}
		}
		// If there are no selections...
		else {
			// Display feedback
			displayDialog(sncr.strings["section-unlink-plugin"],sncr.strings["section-unlink-problem"]);
		}
	},
	validateSelected: function(context) {
		// Get latest selections, as they may have been changed by Insert
		var selections = sncr.page.selectedLayers().layers();

		// If there are two selections...
		if (selections.count() == 2) {
			// Selection variables
			var firstItem = selections[0],
				secondItem = selections[1];

			// If the first item is not an artboard and the second item is an artboard...
			if (firstItem.class() != "MSArtboardGroup" && secondItem.class() == "MSArtboardGroup") {
				return {
					title : firstItem,
					artboard : secondItem
				}
			}
			// If the first item is an artboard and the second item is not an artboard
			else if (firstItem.class() == "MSArtboardGroup" && secondItem.class() != "MSArtboardGroup") {
				return {
					title : secondItem,
					artboard : firstItem
				}
			}
			// If the selections are two artboards...
			else {
				// Display feedback
				displayDialog(sncr.strings["section-link-plugin"],sncr.strings["section-link-problem"]);

				return false;
			}
		}
		// If there are not two selections...
		else {
			// Display feedback
			displayDialog(sncr.strings["section-link-plugin"],sncr.strings["section-link-problem"]);

			return false;
		}
	},
	getName: function(object) {
		var name;

		if (object.class() == "MSSymbolInstance" && object.overrides().allValues().firstObject()) {
			name = sncr.sections.config.titleLinkPrefix + object.overrides().allValues().firstObject();
		} else if (object.class() == "MSTextLayer") {
			name = sncr.sections.config.titleLinkPrefix + object.stringValue();
		} else {
			name = sncr.sections.config.titleLinkPrefix + object.name().replace(sncr.sections.config.titleLinkPrefix,"");
		}

		return name;
	},
	selectAllOnPage: function(context) {
		// Deselect everything in the current page
		sncr.page.changeSelectionBySelectingLayers(nil);

		// Set a counter
		count = 0;

		// Get the section titles and construct a loop
		var predicate = NSPredicate.predicateWithFormat("userInfo != nil && function(userInfo,'valueForKeyPath:',%@)." + sncr.sections.config.titleLinkKey + " != nil",sncr.pluginDomain),
			layers = sncr.page.children().filteredArrayUsingPredicate(predicate),
			loop = layers.objectEnumerator(),
			layer;

		// Iterate through section titles...
		while (layer = loop.nextObject()) {
			// Select the section title while maintaining other selections
			layer.select_byExpandingSelection(true,true);

			// Iterate the counter
			count++;
		}

		// Display feedback
		displayMessage(count + sncr.strings["section-titles-selected"]);
	},
	updateAllOnPage: function(context,command) {
		// If function was invoked by action, set command
		if (!command && context.actionContext) command = "action";

		logFunctionStart("Section Titles: Update",command);

		var titleSettings = sncr.sections.settings(context,"update");

		// Set remove counter
		var removeCount = 0;

		// Get the section titles and construct a loop
		var predicate = NSPredicate.predicateWithFormat("userInfo != nil && function(userInfo,'valueForKeyPath:',%@)." + sncr.sections.config.titleLinkKey + " != nil",sncr.pluginDomain),
			layers = sncr.page.children().filteredArrayUsingPredicate(predicate),
			loop = layers.objectEnumerator(),
			layer;

		// Iterate through section titles...
		while (layer = loop.nextObject()) {
			// Get stored value for linked artboard
			var linkedArtboard = sncr.command.valueForKey_onLayer(sncr.sections.config.titleLinkKey,layer);

			// Get linked artboard object, if it resides on the artboard description page
			var predicate = NSPredicate.predicateWithFormat("objectID == %@",linkedArtboard,sncr.pluginDomain),
				artboard = sncr.page.artboards().filteredArrayUsingPredicate(predicate).firstObject();

			// If artboard object exists...
			if (artboard) {
				// Set screen title x/y in relation to artboard, with offsets
				layer.frame().setX(artboard.frame().x() + titleSettings.titleXOffset);
				layer.frame().setY(artboard.frame().y() + titleSettings.titleYOffset - layer.frame().height());

				if (titleSettings.titleWidth != "") {
					layer.frame().setWidth(titleSettings.titleWidth);
				}

				// Get layer name
				var layerName = sncr.sections.getName(layer);

				// Update the layer name
				layer.setName(layerName);

				// Lock the section title
				layer.setIsLocked(1);
			}
			// If artboard object does not exist...
			else {
				// Remove stored value for linked artboard
				sncr.command.setValue_forKey_onLayer(nil,sncr.sections.config.titleLinkKey,layer);

				// Set layer name
				var layerName = layer.name().replace(sncr.sections.config.titleLinkPrefix,"");

				// Update the layer name
				layer.setName(layerName);

				// Unlock the section title
				layer.setIsLocked(0);

				// Create a log event
				log(layerName + sncr.strings["section-unlink-complete"] + linkedArtboard);

				// Increment remove counter
				removeCount++;
			}
		}

		// Switch message and handling per method the function was invoked
		switch (command) {
			case "action":
				break;
			case "link":
				break;
			case "settings":
				// Display feedback
				displayMessage(sncr.strings["section-titles-updated"]);

				break;
			default:
				// If any artboard links were removed
				if (removeCount > 0) {
					// Display feedback
					displayMessage(sncr.strings["section-titles-updated"] + ", " + removeCount + sncr.strings["section-titles-updated-unlinked"]);
				} else {
					// Display feedback
					displayMessage(sncr.strings["section-titles-updated"]);
				}

				break;
		}
	},
	settings: function(context,command) {
		var defaultSettings = {};
		defaultSettings.sectionTitleWidth = "";
		defaultSettings.sectionTitleXOffset = 0;
		defaultSettings.sectionTitleYOffset = 0;

		defaultSettings = getCachedSettings(context,sncr.document.documentData(),defaultSettings,sncr.pluginDomain);

		if (!command) {
			var alertWindow = COSAlertWindow.new();
			alertWindow.setMessageText(sncr.strings["section-settings-plugin"]);

			alertWindow.addTextLabelWithValue(sncr.strings["section-settings-width"]);

			var titleWidth = createField(defaultSettings.sectionTitleWidth,NSMakeRect(0,0,60,24));
			alertWindow.addAccessoryView(titleWidth);

			alertWindow.addTextLabelWithValue(sncr.strings["section-settings-offsetX"]);

			var titleXOffset = createField(defaultSettings.sectionTitleXOffset,NSMakeRect(0,0,60,24));
			alertWindow.addAccessoryView(titleXOffset);

			alertWindow.addTextLabelWithValue(sncr.strings["section-settings-offsetY"]);

			var titleYOffset = createField(defaultSettings.sectionTitleYOffset,NSMakeRect(0,0,60,24));
			alertWindow.addAccessoryView(titleYOffset);

			var buttonOK = alertWindow.addButtonWithTitle(sncr.strings["general-button-ok"]);
			var buttonCancel = alertWindow.addButtonWithTitle(sncr.strings["general-button-cancel"]);

			setKeyOrder(alertWindow,[
				titleWidth,
				titleXOffset,
				titleYOffset,
				buttonOK
			]);

			var responseCode = alertWindow.runModal();

			if (responseCode == 1000) {
				try {
					sncr.command.setValue_forKey_onLayer(titleWidth.stringValue(),"sectionTitleWidth",sncr.document.documentData());
					sncr.command.setValue_forKey_onLayer(Number(titleXOffset.stringValue()),"sectionTitleXOffset",sncr.document.documentData());
					sncr.command.setValue_forKey_onLayer(Number(titleYOffset.stringValue()),"sectionTitleYOffset",sncr.document.documentData());
				}
				catch(err) {
					log(sncr.strings["general-save-failed"]);
				}

				sncr.sections.updateAllOnPage(context,"settings");
			} else return false;
		}
		// Otherwise operate in run mode...
		else {
			// Return updated settings
			return {
				titleWidth : defaultSettings.sectionTitleWidth,
				titleXOffset : defaultSettings.sectionTitleXOffset,
				titleYOffset : defaultSettings.sectionTitleYOffset
			}
		}
	}
}

sncr.titles = {
	include: function(context) {
		var count = 0;

		if (sncr.selection.count()) {
			for (var i = 0; i < sncr.selection.count(); i++) {
				if (sncr.selection[i] instanceof MSArtboardGroup) {
					sncr.command.setValue_forKey_onLayer(true,sncr.titles.config.featureKey,sncr.selection[i]);

					count++;

					log(sncr.selection[i].name() + sncr.strings["title-include-complete"]);
				}
			}

			sncr.titles.create(context,"include");

			if (sncr.selection.count() == 1) {
				displayMessage(sncr.selection[0].name() + sncr.strings["title-include-complete"]);
			} else {
				displayMessage(count + sncr.strings["title-includes-complete"]);
			}
		} else {
			displayDialog(sncr.strings["title-include-plugin"],sncr.strings["title-include-problem"]);
		}
	},
	preclude: function(context) {
		var count = 0;

		if (sncr.selection.count()) {
			for (var i = 0; i < sncr.selection.count(); i++) {
				if (sncr.selection[i] instanceof MSArtboardGroup) {
					sncr.command.setValue_forKey_onLayer(false,sncr.titles.config.featureKey,sncr.selection[i]);

					count++;

					log(sncr.selection[i].name() + sncr.strings["title-preclude-complete"]);
				}
			}

			sncr.titles.create(context,"preclude");

			if (sncr.selection.count() == 1) {
				displayMessage(sncr.selection[0].name() + sncr.strings["title-preclude-complete"]);
			} else {
				displayMessage(count + sncr.strings["title-precludes-complete"]);
			}
		} else {
			displayDialog(sncr.strings["title-preclude-plugin"],sncr.strings["title-preclude-problem"]);
		}
	},
	create: function(context,command) {
		// If function was invoked by action, set command
		if (!command && context.actionContext) command = "action";

		logFunctionStart("Artboard Titles: Create",command);

		var titleSettings = sncr.titles.settings(context,"create");

		if (sncr.page != sncr.symbolsPage) {
			// Set parent group
			var parentGroup = getParentGroup(sncr.page,sncr.parentGroupName);

			// Find and remove screen titles group if it exists on the page (the old location)
			sncr.page.removeLayer(findLayerByName(sncr.page,sncr.titlesGroupName));

			// Find and remove screen titles group if it exists in the parent group (the new location)
			parentGroup.removeLayer(findLayerByName(parentGroup,sncr.titlesGroupName));

			// Get a filtered list of artboards
			var predicate = NSPredicate.predicateWithFormat("userInfo == nil || function(userInfo,'valueForKeyPath:',%@)." + sncr.titles.config.featureKey + " != " + false,sncr.pluginDomain),
				artboards = sncr.page.artboards().filteredArrayUsingPredicate(predicate),
				loop = artboards.objectEnumerator(),
				artboard;

			// If artboards exist on the page...
			if (artboards.length) {
				// Screen title style
				var screenTitleStyleName = "Wireframe/Screen Title";
				var screenTitleStyleData = {
					fontFace : "Neue Haas Grotesk Text Std 75 Bold",
					fontSize : 18,
					lineHeight : 48,
					textAlignment : 0
				}

				// Screen title settings
				var screenTitleOffset = parseInt(titleSettings.titleOffset);

				// Remove screen title style (the old style)
				deleteTextStyle('Layout/Screen Title');

				// Get screen title style (will add style if it doesn't exist) (the new style)
				var screenTitleStyle = getTextStyle(screenTitleStyleName,screenTitleStyleData);

				// Create new screen title group
				var titleGroup = MSLayerGroup.new();
				titleGroup.setName(sncr.titlesGroupName);
				titleGroup.frame().setX(0 - parentGroup.frame().x());
				titleGroup.frame().setY(0 - parentGroup.frame().y());
				titleGroup.setHasClickThrough(true);

				// Iterate through the artboards...
				while (artboard = loop.nextObject()) {
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

				// Collapse the parent group
				parentGroup.setLayerListExpandedType(0);

				// Move parent group to the top of the layer list
				parentGroup.moveToLayer_beforeLayer(sncr.page,nil);

				// Deselect parent group (moveToLayer_beforeLayer selects it)
				parentGroup.select_byExpandingSelection(false,true);

				// Switch message and handling per method the function was invoked
				switch (command) {
					case "include":
						break;
					case "preclude":
						break;
					case "action":
						break;
					case "settings":
						break;
					case "layout":
						break;
					default:
						// Lock the parent group
						parentGroup.setIsLocked(1);

						// Display feedback
						displayMessage(sncr.strings["title-create-complete"]);

						break;
				}
			}
			// If no artboards exist on the page...
			else {
				// Switch message and handling per method the function was invoked
				switch (command) {
					case "include":
						break;
					case "preclude":
						break;
					case "action":
						break;
					case "settings":
						break;
					case "layout":
						break;
					default:
						// Display feedback
						displayDialog(sncr.strings["title-create-plugin"],sncr.strings["title-create-problem"]);

						break;
				}
			}
		}
	},
	settings: function(context,command) {
		// Setting variables
		var defaultSettings = {};
		defaultSettings.artboardTitleType = 0;
		defaultSettings.artboardTitleOffset = 0;
		defaultSettings.artboardTitleAuto = 0;

		// Update default settings with cached settings
		defaultSettings = getCachedSettings(context,sncr.document.documentData(),defaultSettings,sncr.pluginDomain);

		// If a command is not passed, operate in config mode...
		if (!command) {
			var alertWindow = COSAlertWindow.new();
			alertWindow.setMessageText('Create Artboard Titles');

			var titleType = createRadioButtons(["Above artboards","Below artboards"],defaultSettings.artboardTitleType);
			alertWindow.addAccessoryView(titleType);

			alertWindow.addTextLabelWithValue('Vertical offset:');

			var titleOffset = createField(defaultSettings.artboardTitleOffset,NSMakeRect(0,0,60,24));
			alertWindow.addAccessoryView(titleOffset);

			// Buttons
			var buttonOK = alertWindow.addButtonWithTitle(sncr.strings["general-button-ok"]);
			var buttonCancel = alertWindow.addButtonWithTitle(sncr.strings["general-button-cancel"]);

			// Set key order and first responder
			setKeyOrder(alertWindow,[
				titleType,
				titleOffset,
				buttonOK
			]);

			var responseCode = alertWindow.runModal();

			if (responseCode == 1000) {
				try {
					// Purge old settings in old location
					sncr.command.setValue_forKey_onLayer(nil,"titleType",sncr.page);
					sncr.command.setValue_forKey_onLayer(nil,"titleOffset",sncr.page);

					// Save new settings in new location
					sncr.command.setValue_forKey_onLayer(titleType.selectedCell().tag(),"artboardTitleType",sncr.document.documentData());
					sncr.command.setValue_forKey_onLayer(Number(titleOffset.stringValue()),"artboardTitleOffset",sncr.document.documentData());
				}
				catch(err) {
					log(sncr.strings["general-save-failed"]);
				}

				sncr.titles.create(context,"settings");
			} else return false;
		}
		// Otherwise operate in run mode...
		else {
			// Return updated settings
			return {
				titleType : defaultSettings.artboardTitleType,
				titleOffset : defaultSettings.artboardTitleOffset
			}
		}
	}
}

sncr.wireframes = {
	addNew: function(context) {
		var predicate = NSPredicate.predicateWithFormat("userInfo == nil || function(userInfo,'valueForKeyPath:',%@)." + sncr.layout.config.featureKey + " != " + false,sncr.pluginDomain),
			artboards = sncr.page.artboards().filteredArrayUsingPredicate(predicate),
			selectionSize = getSelectionSize(artboards);

		var margin = 400,
			sliceX = 400,
			sliceY = 1000,
			sliceWidth = selectionSize.width + sliceX + margin,
			sliceHeight = selectionSize.height + sliceY + margin,
			minWidth = 6680,
			minHeight = 4520;

		sliceWidth = (sliceWidth < minWidth) ? minWidth : sliceWidth;
		sliceHeight = (sliceHeight < minHeight) ? minHeight : sliceHeight;

		var sliceLayer = [MSSliceLayer new];
		sliceLayer.setName(sncr.page.name().replace(sncr.layout.config.pageNamePrefix,""));
		sliceLayer.setBackgroundColor(MSColor.colorWithRed_green_blue_alpha(239/255,239/255,239/255,1.0));
		sliceLayer.setIsLocked(1);
		sliceLayer.hasBackgroundColor = true;
		sliceLayer.frame().setX(-sliceX);
		sliceLayer.frame().setY(-sliceY);
		sliceLayer.frame().setWidth(sliceWidth);
		sliceLayer.frame().setHeight(sliceHeight);

		sncr.page.addLayers([sliceLayer]);

		sliceLayer.select_byExpandingSelection(true,false);
		actionWithType(context,"MSMoveToBackAction").doPerformAction(nil);

		var format = sliceLayer.exportOptions().addExportFormat();
		format.setScale(".5");
		format.setFileFormat("pdf");

		sncr.wireframes.include(context);

		displayMessage(sncr.strings["wireframe-add-complete"]);

		function getSelectionSize(selection) {
			var minX,minY,maxX,maxY;
			minX=minY=Number.MAX_VALUE;
			maxX=maxY=-0xFFFFFFFF;

			for (var i = 0; i < selection.count(); i++) {
				var frame = selection.objectAtIndex(i).frame();

				minX = Math.min(minX,frame.minX());
				minY = Math.min(minY,frame.minY());
				maxX = Math.max(maxX,frame.maxX());
				maxY = Math.max(maxY,frame.maxY());
			}

			return {
				width: maxX-minX,
				height: maxY-minY,
				minX: minX,
				minY: minY
			};
		}
	},
	include: function(context) {
		var selection = sncr.page.selectedLayers().layers();

		if (selection.count() == 1 && selection[0] instanceof MSSliceLayer) {
			sncr.command.setValue_forKey_onLayer(true,sncr.wireframes.config.featureKey,selection[0]);

			displayMessage(selection[0].name() + sncr.strings["wireframe-include-complete"]);
		} else {
			displayDialog(sncr.strings["wireframe-include-plugin"],sncr.strings["wireframe-include-problem"]);
		}
	},
	preclude: function(context) {
		if (sncr.selection.count() == 1 && sncr.selection[0] instanceof MSSliceLayer) {
			sncr.command.setValue_forKey_onLayer(false,sncr.wireframes.config.featureKey,sncr.selection[0]);

			displayMessage(sncr.selection[0].name() + sncr.strings["wireframe-preclude-complete"]);
		} else {
			displayDialog(sncr.strings["wireframe-preclude-plugin"],sncr.strings["wireframe-preclude-problem"]);
		}
	},
	export: function(context) {
		var loop = sncr.pages.objectEnumerator(),
			page,
			wireframes = [],
			count = 1;

		while (page = loop.nextObject()) {
			var predicate = NSPredicate.predicateWithFormat("className == 'MSSliceLayer' && userInfo != nil && function(userInfo,'valueForKeyPath:',%@)." + sncr.wireframes.config.featureKey + " == " + true,sncr.pluginDomain),
				slices = page.children().filteredArrayUsingPredicate(predicate),
				loop2 = slices.objectEnumerator(),
				slice;

			while (slice = loop2.nextObject()) {
				var filePrefix = "W",
					filename = filePrefix + count + " " + slice.name(),
					filepath = [@"~/Downloads" stringByExpandingTildeInPath] + "/" + filename + ".pdf";

				wireframes.push({
					source : slice,
					name : filename,
					path : filepath
				});

				count++;
			}
		}

		if (wireframes.length) {
			var exportList = sncr.wireframes.confirm(wireframes);

			if (exportList.length) {
				var doc = sncr.document;

				for (var i = 0; i < exportList.length; i++) {
					[doc saveArtboardOrSlice:exportList[i]['source'] toFile:exportList[i]['path']];
				}

				displayMessage(exportList.length + sncr.strings["wireframe-export-complete"]);
			}
		} else {
			displayDialog(sncr.strings["wireframe-export-plugin"],sncr.strings["wireframe-export-problem"]);
		}
	},
	confirm: function(wireframes) {
		var alertWindow = COSAlertWindow.new();

		alertWindow.setMessageText(sncr.strings["wireframe-export-plugin"]);

		alertWindow.addTextLabelWithValue(sncr.strings["wireframe-export-intro"]);

		var wireframeListHeader = NSView.alloc().initWithFrame(NSMakeRect(0,0,300,18)),
			wireframeListCheckbox = createCheckbox({name:"",value:1},1,NSMakeRect(0,0,18,18)),
			wireframeListLabel = createBoldLabel("Wireframes (" + wireframes.length + ")",12,NSMakeRect(22,0,300-22,18));

		wireframeListCheckbox.setAction("callAction:");
		wireframeListCheckbox.setCOSJSTargetFunction(function(sender) {
			for (var i = 0; i < wireframeListCheckboxes.length; i++) {
				wireframeListCheckboxes[i].state = sender.state();
			}
		});

		wireframeListHeader.addSubview(wireframeListCheckbox);
		wireframeListHeader.addSubview(wireframeListLabel);

		alertWindow.addAccessoryView(wireframeListHeader);

		var wireframeListItem = 24,
			wireframeListContent = NSView.alloc().initWithFrame(NSMakeRect(0,0,300,wireframes.length*wireframeListItem)),
			wireframeListCheckboxes = [],
			count = 0;

		wireframeListContent.setFlipped(1);
		wireframeListContent.setWantsLayer(1);
		wireframeListContent.layer().setBackgroundColor(CGColorCreateGenericRGB(255,255,255,1));

		for (var i = 0; i < wireframes.length; i++) {
			var wireframeCheckbox = createCheckbox({name:wireframes[i]['name'],value:i},1,NSMakeRect(4,count*wireframeListItem,300,wireframeListItem));

			wireframeListCheckboxes.push(wireframeCheckbox);
			wireframeListContent.addSubview(wireframeCheckbox);

			count++;
		}

		alertWindow.addAccessoryView(wireframeListContent);

		alertWindow.addTextLabelWithValue(sncr.strings["wireframe-export-outro"]);

		var buttonOK = alertWindow.addButtonWithTitle(sncr.strings["general-button-ok"]);
		var buttonCancel = alertWindow.addButtonWithTitle(sncr.strings["general-button-cancel"]);

		var responseCode = alertWindow.runModal();

		if (responseCode == 1000) {
			var slicesToRemove = [];

			for (var i = 0; i < wireframeListCheckboxes.length; i++) {
				if (wireframeListCheckboxes[i].state() == 0) {
					slicesToRemove.push(wireframeListCheckboxes[i].tag());
				}
			}

			slicesToRemove.sort(function(a,b){ return b-a; });

			for (var i = 0; i < slicesToRemove.length; i++) {
				wireframes.splice(slicesToRemove[i],1);
			}

			return wireframes;
		} else return false;
	}
}

function createBoldLabel(text,size,frame) {
	var label = NSTextField.alloc().initWithFrame(frame);

	label.setStringValue(text);
	label.setFont(NSFont.boldSystemFontOfSize(size));
	label.setBezeled(0);
	label.setDrawsBackground(0);
	label.setEditable(0);
	label.setSelectable(0);

	return label;
}

var createCheckbox = function(item,flag,frame) {
	flag = ( flag == false ) ? NSOffState : NSOnState;
	var checkbox = [[NSButton alloc] initWithFrame:frame];
	[checkbox setButtonType: NSSwitchButton];
	[checkbox setBezelStyle: 0];
	[checkbox setTitle: item.name];
	[checkbox setTag: item.value];
	[checkbox setState: flag];

	return checkbox;
}

function createSelect(items,selectedItemIndex,frame) {
	var comboBox = NSComboBox.alloc().initWithFrame(frame),
		selectedItemIndex = (selectedItemIndex > -1) ? selectedItemIndex : 0;

	comboBox.addItemsWithObjectValues(items);
	comboBox.selectItemAtIndex(selectedItemIndex);
	comboBox.setNumberOfVisibleItems(16);

	return comboBox;
}

var createField = function(value,size) {
	var size = (size) ? size : NSMakeRect(0,0,100,20);
	var field = [[NSTextField alloc] initWithFrame:size];
	[field setStringValue:value];

	return field;
}

var createLabel = function(text,frame) {
	var label = [[NSTextField alloc] initWithFrame:frame];
	[label setStringValue:text];
	[label setFont:[NSFont boldSystemFontOfSize:12]];
	[label setBezeled:false];
	[label setDrawsBackground:false];
	[label setEditable:false];
	[label setSelectable:false];

	return label;
}

function actionWithType(context,type) {
	var controller = context.document.actionsController();

	if (controller.actionWithName) {
		return controller.actionWithName(type);
	} else if (controller.actionWithID) {
		return controller.actionWithID(type);
	} else {
		return controller.actionForID(type);
	}
}

function createRadioButtons(options,selected) {
	// Set number of rows and columns
	var rows = options.length;
	var columns = 1;

	// Make a prototype cell
	var buttonCell = [[NSButtonCell alloc] init];
	[buttonCell setButtonType:NSRadioButton]

	// Make a matrix to contain the radio cells
	var buttonMatrix = [[NSMatrix alloc] initWithFrame: NSMakeRect(20,20,300,rows*25) mode:NSRadioModeMatrix prototype:buttonCell numberOfRows:rows numberOfColumns:columns];
	[buttonMatrix setCellSize: NSMakeSize(300,20)];

	// Create a cell for each option
	for (i = 0; i < options.length; i++) {
		[[[buttonMatrix cells] objectAtIndex: i] setTitle: options[i]];
		[[[buttonMatrix cells] objectAtIndex: i] setTag: i];
	}

	// Select the default cell
	[buttonMatrix selectCellAtRow:selected column:0]

	// Return the matrix
	return buttonMatrix;
}

function findLayerByID(scope,layerID,type) {
	var scope = scope.layers();

	if (scope) {
		for (var i = 0; i < scope.count(); i++) {
			var layer = scope.objectAtIndex(i);

			if ((!type && layer.objectID() == layerID) || (type && layer.objectID() == layerID && layer instanceof type)) {
				return layer;
			}
		}
	}

	return false;
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

function displayDialog(title,body) {
	NSApplication.sharedApplication().displayDialog_withTitle(body,title);
}

function displayMessage(message) {
	sncr.document.showMessage(message);
}

function getLayerIndex(layer) {
	var layers = layer.parentGroup().layers();

	for (var i = 0; i < layers.count(); i++) {
		if (layers.objectAtIndex(i) == layer) return i;
	}

	return false;
}

function getObjectByName(haystack,needle) {
	for (var i = 0; i < haystack.count(); i++) {
		var objectName = haystack.objectAtIndex(i).name();

		if (objectName && objectName.isEqualToString(needle)) {
			return haystack.objectAtIndex(i);
		}
	}

	return false;
}

function getTextStyle(styleName,styleData) {
	var layerTextStyles = MSDocument.currentDocument().documentData().layerTextStyles();

	var textStyle = getObjectByName(layerTextStyles.objects(),styleName);

	if (!textStyle) {
		var textLayer = MSTextLayer.alloc().initWithFrame(nil);
		textLayer.setFontSize(styleData.fontSize);
		textLayer.setLineHeight(styleData.lineHeight);
		textLayer.setTextAlignment(styleData.textAlignment);
		textLayer.setFontPostscriptName(styleData.fontFace);

		textStyle = layerTextStyles.addSharedStyleWithName_firstInstance(styleName,textLayer.style());
	}

	return textStyle;
}

function deleteTextStyle(styleName) {
	var layerTextStyles = MSDocument.currentDocument().documentData().layerTextStyles();
	var textStyle = getObjectByName(layerTextStyles.objects(),styleName);

	if (textStyle) layerTextStyles.removeSharedStyle(textStyle);
}

function getParentGroup(scope,name) {
	var group = findLayerByName(scope,name);

	if (!group) {
		var group = MSLayerGroup.new();
		group.setName(name);
		group.frame().setX(0);
		group.frame().setY(0);
		group.setIsLocked(1);

		scope.addLayers([group]);
	}

	group.setHasClickThrough(true);

	return group;
}

function getChildGroup(scope,name) {
	var group = findLayerByName(scope,name);

	if (!group) {
		var group = MSLayerGroup.new();
		group.setName(name);
		group.frame().setX(0 - scope.frame().x());
		group.frame().setY(0 - scope.frame().y());

		scope.addLayers([group]);
	}

	group.setHasClickThrough(true);

	return group;
}

function setKeyOrder(alert,order) {
	for (var i = 0; i < order.length; i++) {
		var thisItem = order[i];
		var nextItem = order[i+1];

		if (nextItem) thisItem.setNextKeyView(nextItem);
	}

	alert.alert().window().setInitialFirstResponder(order[0]);
}

function getCachedSettings(context,location,settings,domain) {
	try {
		for (i in settings) {
			var value = sncr.command.valueForKey_onLayer_forPluginIdentifier(i,location,domain);
			if (value) settings[i] = value;
		}

		return settings;
	} catch(err) {
		log("Unable to fetch settings");
	}
}

function drawShapes(connections,output) {
	var strokeWidth = 1,
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
	}
}

function logFunctionStart(output,command) {
	if (!command) command = "user";

	log(output + " - Initiated by " + command);
}
