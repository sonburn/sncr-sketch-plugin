@import 'delegate.js';

var sketch = require("sketch");

var sncr = {
	init: function(context,command) {
		this.pluginDomain = "com.sncr.sketch";

		this.document = context.document || context.actionContext.document;
		this.selection = context.selection;
		this.command = context.command;
		this.pages = this.document.pages();
		this.page = this.document.currentPage();
		this.data = this.document.documentData();
		this.symbols = this.data.allSymbols();
		this.symbolsPage = this.data.symbolsPage();

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
			annotationWidth : 240,
			annotationSpacing : 8,
			annotationLinkKey : "linkedToObject",
			annotationLinkTypeKey : "linkType",
			annotationLinkTypeValue : "annotation",
			annotationParentKey : "linkedParentArtboard",
			annotationLinkPrefix : "🔗 ",
			annotationStyleData : {
				fontFace : "Helvetica Neue",
				fontSize : 14,
				fontColor : "#000000",
				lineHeight : 18,
				textAlignment : 0
			},
			annotationArrowName : "Arrow",
			annotationArrowStrokeWidth : 1,
			annotationArrowStrokeColor : "#00AEEF",
			annotationArrowStartType : 4, // 0 = None, 1 = Angled Arrow, 2 = Solid Arrow, 3 = Line, 4 = Empty Circle, 5 = Solid Circle, 6 = Empty Square, 7 = Solid Square
			annotationArrowStartXOffset : 0,
			annotationArrowStartYOffset : 0,
			annotationArrowEndType : 2, // 0 = None, 1 = Angled Arrow, 2 = Solid Arrow, 3 = Line, 4 = Empty Circle, 5 = Solid Circle, 6 = Empty Square, 7 = Solid Square
			annotationArrowEndXOffset : -12,
			annotationArrowEndYOffset : 9 // Half annotationStyleData lineHeight
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
				case "sections-link" :
					this.sections.linkSelected(context);
					break;
				case "sections-unlink" :
					this.sections.unlinkSelected(context);
					break;
				case "sections-update" :
					this.sections.updateAllOnPage(context);
					break;
				case "sections-settings" :
					this.sections.settings(context);
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
				case "descriptions-set" :
					this.descriptions.addEdit(context);
					break;
				case "descriptions-link" :
					this.descriptions.linkSelected(context);
					break;
				case "descriptions-unlink" :
					this.descriptions.unlinkSelected(context);
					break;
				case "descriptions-update" :
					this.descriptions.updateAllOnPage(context);
					break;
				case "descriptions-settings" :
					this.descriptions.settings(context);
					break;
				case "layout-update" :
					this.layout.update(context);
					break;
				case "layout-include-selected" :
					this.layout.includeSelected(context);
					break;
				case "layout-preclude-selected" :
					this.layout.precludeSelected(context);
					break;
				case "layout-include-page" :
					this.layout.includePage(context);
					break;
				case "layout-preclude-page" :
					this.layout.precludePage(context);
					break;
				case "layout-settings" :
					this.layout.settings(context);
					break;
				case "annotations-create" :
					this.annotations.annotateSelected(context);
					break;
				case "annotations-designate" :
					this.annotations.designateSelected();
					break;
				case "annotations-link" :
					this.annotations.linkSelected(context);
					break;
				case "annotations-update" :
					this.annotations.updateAnnotations(context);
					break;
				case "annotations-settings" :
					this.annotations.settings(context);
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
			}
		}
	}
}

sncr.annotations = {
	annotateSelected: function(context) {
		// This function can be called by AddFlow.finish, which is only triggered if user applies a flow directly to an
		// object (not by updating the flow of a nested hotspot). In this case, context.actionContext will be present.
		if (context.actionContext) {
			if (sncr.annotations.settings(context,"create").autoAnnotate == 1) {
				// Wait a couple seconds for processing to complete
				COScript.currentCOScript().scheduleWithInterval_jsFunction(2, function() {
					annotateSelections(context.actionContext.document.selectedLayers().layers());
				});
			} else return;
		} else {
			var selections = sncr.selection;

			if (!selections.length) {
				sketch.UI.message("Nothing is selected");

				return;
			}

			annotateSelections(selections);
		}

		function annotateSelections(layers) {
			var updatedArtboards = NSMutableArray.array();

			layers.forEach(function(layer) {
				var artboardID = layer.parentArtboard().objectID();

				if (!updatedArtboards.containsObject(artboardID)) {
					updatedArtboards.addObject(artboardID);
				}

				if (layer.flow() && layer.flow().destinationArtboardID() != "") {
					sncr.annotations.createAnnotation(layer,layer.flow().destinationArtboardID());
				}

				// If context.actionContext present (called by AddFlow.finish), don't bother drilling deeper as the
				// action is not triggered by updating the flow of a nested hotspot.
				if (!context.actionContext) {
					if (layer instanceof MSSymbolInstance && layer.overrides()) {
						var overrides = layer.availableOverrides();

						overrides.forEach(function(override) {
							var overridePoint = override.overridePoint(),
								overrideValue = override.overrideValue();

							if (overridePoint.property() == "flowDestination" && overrideValue && overrideValue != "") {
								sncr.annotations.createAnnotation(layer,overrideValue,overridePoint.layerID());
							}

							// if (overridePoint.property() == "symbolID") {
							// 	var nestedOverrides = layer.symbolMaster().layerWithID(overridePoint.layerID()).availableOverrides();
							//
							// 	nestedOverrides.forEach(function(nestedOverride) {
							// 		var nestedOverridePoint = nestedOverride.overridePoint(),
							// 			nestedOverrideValue = nestedOverride.overrideValue();
							//
							// 		if (nestedOverridePoint.property() == "flowDestination" && nestedOverrideValue != "") {
							// 			sncr.annotations.createAnnotation(layer,nestedOverrideValue,nestedOverridePoint.layerID(),layer.symbolMaster());
							// 		}
							// 	});
							// }
						});
					}

					if (layer.containsLayers()) {
						annotateSelections(layer.layers());
					}
				}
			});

			updatedArtboards.forEach(function(artboardID){
				sncr.annotations.updateAnnotations(context,artboardID);
			});
		}
	},
	designateSelected: function(annotation) {
		if (annotation) {
			sncr.command.setValue_forKey_onLayer(sncr.annotations.config.annotationLinkTypeValue,sncr.annotations.config.annotationLinkTypeKey,annotation);

			var annotationName = annotation.name().split(/\r\n|\r|\n/g)[0];

			log(annotationName + sncr.strings["annotation-designate-complete"]);

			sketch.UI.message(annotationName + sncr.strings["annotation-designate-complete"]);
		} else {
			if (!sncr.selection) {
				sketch.UI.alert(sncr.strings["annotation-designate-plugin"],sncr.strings["annotation-designate-problem"]);

				return;
			}

			var selectionLoop = sncr.selection.objectEnumerator(),
				selection,
				annotationName,
				count = 0;

			while (selection = selectionLoop.nextObject()) {
				sncr.command.setValue_forKey_onLayer(sncr.annotations.config.annotationLinkTypeValue,sncr.annotations.config.annotationLinkTypeKey,selection);

				annotationName = selection.name().split(/\r\n|\r|\n/g)[0];

				log(annotationName + sncr.strings["annotation-designate-complete"]);

				count++;
			}

			sketch.UI.message(((count == 1) ? annotationName : count) + sncr.strings["annotation-designate-complete"]);
		}
	},
	createAnnotation: function(linkedObject,destinationArtboardID,flowObjectID) {
		var parentGroup = getParentGroup(sncr.page,sncr.parentGroupName),
			noteGroup = getChildGroup(parentGroup,sncr.artboardNoteGroupName);

		var destinationArtboardName;

		if (destinationArtboardID == "back") {
			destinationArtboardName = "Back to originating screen";
		} else if (sncr.data.layerWithID(destinationArtboardID)) {
			destinationArtboardName = sncr.data.layerWithID(destinationArtboardID).name();
		} else {
			destinationArtboardName = "Unknown";
		}

		var artboardAnnotations = sncr.annotations.getAnnotations(linkedObject.parentArtboard().objectID());

		var predicate;

		if (flowObjectID) {
			predicate = NSPredicate.predicateWithFormat("userInfo != nil && function(userInfo,'valueForKeyPath:',%@)." + sncr.annotations.config.annotationLinkKey + " == '" + linkedObject.objectID() + "' && function(userInfo,'valueForKeyPath:',%@).flowObjectID == '" + flowObjectID + "'",sncr.pluginDomain,sncr.pluginDomain);
		} else {
			predicate = NSPredicate.predicateWithFormat("userInfo != nil && function(userInfo,'valueForKeyPath:',%@)." + sncr.annotations.config.annotationLinkKey + " == '" + linkedObject.objectID() + "' && function(userInfo,'valueForKeyPath:',%@).flowObjectID == nil",sncr.pluginDomain,sncr.pluginDomain);
		}

		var existingNote = artboardAnnotations.filteredArrayUsingPredicate(predicate).firstObject();

		if (!existingNote) {
			var annotation = MSTextLayer.new();
			annotation.setStringValue(destinationArtboardName);
			annotation.setName(destinationArtboardName);
			annotation.setFont(NSFont.fontWithName_size(sncr.annotations.config.annotationStyleData.fontFace + " Bold",sncr.annotations.config.annotationStyleData.fontSize));
			annotation.setLineHeight(sncr.annotations.config.annotationStyleData.lineHeight);
			annotation.setTextColor(MSImmutableColor.colorWithSVGString(sncr.annotations.config.annotationStyleData.fontColor));
			annotation.setTextBehaviour(1);
			annotation.frame().setWidth(sncr.annotations.config.annotationWidth);

			noteGroup.addLayers([annotation]);

			sncr.command.setValue_forKey_onLayer(linkedObject.objectID(),sncr.annotations.config.annotationLinkKey,annotation);
			sncr.command.setValue_forKey_onLayer(sncr.annotations.config.annotationLinkTypeValue,sncr.annotations.config.annotationLinkTypeKey,annotation);
			sncr.command.setValue_forKey_onLayer(linkedObject.parentArtboard().objectID(),sncr.annotations.config.annotationParentKey,annotation);

			if (flowObjectID) {
				sncr.command.setValue_forKey_onLayer(flowObjectID,"flowObjectID",annotation);
			}
		} else {
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
				existingNote.setFont(NSFont.fontWithName_size(sncr.annotations.config.annotationStyleData.fontFace + " Bold",sncr.annotations.config.annotationStyleData.fontSize));

				var rangeBegin = newString.indexOf("\n") + 1,
					rangeEnd = newString.length - rangeBegin,
					range = NSMakeRange(rangeBegin,rangeEnd),
					rangeFont = NSFont.fontWithName_size(sncr.annotations.config.annotationStyleData.fontFace,sncr.annotations.config.annotationStyleData.fontSize);

				existingNote.addAttribute_value_forRange(NSFontAttributeName,rangeFont,range);
			} else {
				existingNote.setStringValue(destinationArtboardName);
				existingNote.setFont(NSFont.fontWithName_size(sncr.annotations.config.annotationStyleData.fontFace + " Bold",sncr.annotations.config.annotationStyleData.fontSize));
			}

			existingNote.setName(destinationArtboardName);
			existingNote.setLineHeight(sncr.annotations.config.annotationStyleData.lineHeight);
			existingNote.setTextColor(MSImmutableColor.colorWithSVGString(sncr.annotations.config.annotationStyleData.fontColor));
			existingNote.setTextBehaviour(1);
			existingNote.frame().setWidth(sncr.annotations.config.annotationWidth);
		}
	},
	getAnnotations: function(artboardID) {
		var parentGroup = getParentGroup(sncr.page,sncr.parentGroupName),
			noteGroup = getChildGroup(parentGroup,sncr.artboardNoteGroupName);

		var predicate = NSPredicate.predicateWithFormat("userInfo != nil && function(userInfo,'valueForKeyPath:',%@)." + sncr.annotations.config.annotationLinkKey + " != nil && function(userInfo,'valueForKeyPath:',%@)." + sncr.annotations.config.annotationLinkTypeKey + " == " + sncr.annotations.config.annotationLinkTypeValue,sncr.pluginDomain),
			annotations = noteGroup.children().filteredArrayUsingPredicate(predicate);

		var annotationArray = NSMutableArray.array();

		annotations.forEach(function(annotation){
			var linkedObjectID = sncr.command.valueForKey_onLayer(sncr.annotations.config.annotationLinkKey,annotation),
				linkedObject = sncr.data.layerWithID(linkedObjectID);

			if (linkedObject && linkedObject.parentArtboard().objectID() == artboardID) {
				annotationArray.addObject(annotation);
			}
		});

		return annotationArray;
	},
	linkSelected: function(context) {
		// If nothing is selected, or two objects are not selected...
		if (!sncr.selection || sncr.selection.count() != 2) {
			// Display feedback
			sketch.UI.alert(sncr.strings["annotation-link-plugin"],sncr.strings["annotation-link-problem-selection"]);

			return;
		}

		// Selection variables
		var firstObject = sncr.selection.firstObject();
		var firstObjectClass = firstObject.class();
		var firstObjectAnnotation = sncr.command.valueForKey_onLayer(sncr.annotations.config.annotationLinkTypeKey,firstObject);
		var lastObject = sncr.selection.lastObject();
		var lastObjectClass = lastObject.class();
		var lastObjectAnnotation = sncr.command.valueForKey_onLayer(sncr.annotations.config.annotationLinkTypeKey,lastObject);
		var annotation;
		var source;

		// If only the first object is a text layer...
		if (firstObjectClass == "MSTextLayer" && lastObjectClass != "MSTextLayer") {
			annotation = firstObject;
			source = lastObject;
		}
		// If only the second object is a text layer...
		else if (firstObjectClass != "MSTextLayer" && lastObjectClass == "MSTextLayer") {
			annotation = lastObject;
			source = firstObject;
		}
		// If the first object is the annotation...
		else if (firstObjectAnnotation == 'annotation' && !lastObjectAnnotation) {
			annotation = firstObject;
			source = lastObject;
		}
		// If the second object is the annotation...
		else if (!firstObjectAnnotation && lastObjectAnnotation == 'annotation') {
			annotation = lastObject;
			source = firstObject;
		}
		// If neither object is a text layer, or both are...
		else {
			// Display feedback
			sketch.UI.alert(sncr.strings["annotation-link-plugin"],sncr.strings["annotation-link-problem-textlayer"]);

			return;
		}

		// Set values on annotation
		sncr.command.setValue_forKey_onLayer(source.objectID(),sncr.annotations.config.annotationLinkKey,annotation);
		sncr.command.setValue_forKey_onLayer(sncr.annotations.config.annotationLinkTypeValue,sncr.annotations.config.annotationLinkTypeKey,annotation);
		sncr.command.setValue_forKey_onLayer(source.parentArtboard().objectID(),sncr.annotations.config.annotationParentKey,annotation);

		// Update annotations for source parent artboard
		sncr.annotations.updateAnnotations(context,source.parentArtboard().objectID());

		// Determine annotation name
		var annotationName = sncr.annotations.config.annotationLinkPrefix + annotation.name().split(/\r\n|\r|\n/g)[0].replace(sncr.annotations.config.annotationLinkPrefix,"");

		// Create a log event
		log(annotationName + sncr.strings["annotation-link-complete"] + source.name());

		// Display feedback
		sketch.UI.message(annotationName + sncr.strings["annotation-link-complete"] + source.name());
	},
	updateAnnotations: function(context,artboardID) {
		var predicate = NSPredicate.predicateWithFormat("userInfo != nil && function(userInfo,'valueForKeyPath:',%@)." + sncr.annotations.config.annotationLinkKey + " != nil && function(userInfo,'valueForKeyPath:',%@)." + sncr.annotations.config.annotationLinkTypeKey + " == " + sncr.annotations.config.annotationLinkTypeValue,sncr.pluginDomain);
		var annotations = sncr.page.children().filteredArrayUsingPredicate(predicate);
		var parentGroup = getParentGroup(sncr.page,sncr.parentGroupName);
		var noteGroup = getChildGroup(parentGroup,sncr.artboardNoteGroupName);
		var updateCount = 0;
		var removeCount = 0;
		var artboardsWithAnnotations = NSMutableArray.array();

		// If there are no annotations...
		if (annotations.count() == 0) {
			// Display feedback if the function was not invoked by an action...
			if (!context.actionContext) sketch.UI.message(updateCount + sncr.strings["annotation-update-complete"]);
		}

		// Iterate through annotations...
		annotations.forEach(function(annotation){
			// Get linked object
			var linkedObjectID = sncr.command.valueForKey_onLayer(sncr.annotations.config.annotationLinkKey,annotation);
			var linkedObject = sncr.data.layerWithID(linkedObjectID);
			var targetRect = linkedObject.absoluteRect().rect();

			var annotationPosition = sncr.command.valueForKey_onLayer('position',annotation);
			annotationPosition = (annotationPosition) ? annotationPosition : 0;

			// If linked object exists on current page...
			if (linkedObject && linkedObject.parentPage() == sncr.page) {
				// Get ID of parent artboard of linked object
				var artboardWithAnnotation = linkedObject.parentArtboard().objectID();

				// If no artboardID was passed, or if artboardID was passed and it matches ID of parent artboard of linked object
				if (!artboardID || artboardID == artboardWithAnnotation) {
					// Get the flowObjectID, if one exists (used if annotation links to a flow layer)
					var flowObjectID = sncr.command.valueForKey_onLayer_forPluginIdentifier("flowObjectID",annotation,sncr.pluginDomain);

					// If a flowObjectID exists...
					if (flowObjectID) {
						// If the flow object still exists...
						if (linkedObject.symbolMaster().layerWithID(flowObjectID)) {
							// Get destinationArtboardID in order to update linked annotation destination
							var destinationArtboardID = sketch.fromNative(linkedObject).overrides.filter(o => o.path == flowObjectID)[0].value;

							// Update annotation destination
							sncr.annotations.createAnnotation(linkedObject,destinationArtboardID,flowObjectID);

							// Determine annotation Y position
							var flowLayerRect = createNewRectForFlowLayer(linkedObject,flowObjectID);
							targetRect = flowLayerRect;
							var annotationY = flowLayerRect.origin.y + flowLayerRect.size.height/2 + sncr.annotations.config.annotationYOffset - sncr.annotations.config.annotationStyleData.lineHeight/2;
						}
						// Otherwise...
						else {
							// Remove stored values for linked artboard
							sncr.command.setValue_forKey_onLayer(nil,sncr.annotations.config.annotationLinkKey,annotation);
							sncr.command.setValue_forKey_onLayer(nil,sncr.annotations.config.annotationLinkTypeKey,annotation);
							sncr.command.setValue_forKey_onLayer(nil,sncr.annotations.config.annotationParentKey,annotation);
							sncr.command.setValue_forKey_onLayer(nil,"flowObjectID",annotation);

							// Create annotation name
							var annotationName = annotation.name().replace(sncr.annotations.config.annotationLinkPrefix,"");

							// Update annotation layer name
							annotation.setName(annotationName);

							// Iterate counters
							updateCount++;
							removeCount++;

							// Create a log event
							log(annotationName + sncr.strings["annotation-unlink-complete"] + linkedObjectID);

							return false;
						}
					}
					// If annotation links to an object...
					else {
						// If object has a flow destination...
						if (linkedObject.flow()) {
							// Get destinationArtboardID in order to update linked annotation destination
							var destinationArtboardID = linkedObject.flow().destinationArtboardID();

							// Update annotation destination
							sncr.annotations.createAnnotation(linkedObject,destinationArtboardID);
						}

						// Determine annotation Y position
						var annotationY = linkedObject.absoluteRect().y() + linkedObject.frame().height()/2 + sncr.annotations.config.annotationYOffset - sncr.annotations.config.annotationStyleData.lineHeight/2;
					}

					// Get max X of artboard, or parent artboard
					var artboardMaxX = CGRectGetMaxX(linkedObject.parentArtboard().rect());
					var artboardMidX = CGRectGetMidX(linkedObject.parentArtboard().rect());
					var artboardMinX = CGRectGetMinX(linkedObject.parentArtboard().rect());

					if (CGRectGetMidX(targetRect) < artboardMidX && annotation.class() != "MSSymbolInstance" && annotationPosition != 1) {
						// Update annotation x position (left of artboard)
						annotation.absoluteRect().setX(artboardMinX - sncr.annotations.config.annotationWidth - sncr.annotations.config.annotationXOffset);
					} else {
						// Update annotation x position (right of artboard)
						annotation.absoluteRect().setX(artboardMaxX + sncr.annotations.config.annotationXOffset);
					}

					// Update annotation y position
					annotation.absoluteRect().setY(annotationY);

					// Update annotation width
					annotation.frame().setWidth(sncr.annotations.config.annotationWidth);

					// If annotation is a text layer...
					if (annotation.class() == "MSTextLayer") {
						// Update annotation style
						annotation.setFontSize(sncr.annotations.config.annotationStyleData.fontSize);
						annotation.setLineHeight(sncr.annotations.config.annotationStyleData.lineHeight);

						if (CGRectGetMidX(targetRect) < artboardMidX && annotationPosition != 1) {
							annotation.setTextAlignment(1);
						} else {
							annotation.setTextAlignment(sncr.annotations.config.annotationStyleData.textAlignment);
						}
					}

					// If annotation is a symbol instance...
					if (annotation.class() == "MSSymbolInstance") {
						// Get overrides in annotation...
						let overrides = sketch.fromNative(annotation).overrides.filter(o => o.editable);

						// Iterate through overrides...
						overrides.forEach(override => {
							if (override.property === 'flowDestination') {
								let group = override.path.substr(0,override.path.indexOf('/'));
								let text = overrides.find(o => o.id.substr(0,o.id.indexOf('/')) == group && o.property == 'stringValue');
								let destination = sketch.getSelectedDocument().getLayerWithID(override.value);
								let name = destination.name.substr(0,destination.name.indexOf(' '));

								text.value = name;
							}
						});

						// Adjust annotation size
						sketch.fromNative(annotation).resizeWithSmartLayout();
					}

					// Update annotation layer name
					annotation.setName(sncr.annotations.config.annotationLinkPrefix + linkedObject.name());

					// If the annotation is not in the annotation group...
					if (annotation.parentGroup() != noteGroup) {
						// Move the annotation to the annotation group
						annotation.moveToLayer_beforeLayer(noteGroup,nil);
					}

					// Select the annotation
					annotation.select_byExtendingSelection(1,1);

					// Move the annotation to the top of the annotation group
					MSLayerMovement.moveToFront([annotation]);

					// Deselect the annotation
					annotation.select_byExtendingSelection(0,1);

					// Iterate counter
					updateCount++;

					if (!artboardsWithAnnotations.containsObject(artboardWithAnnotation)) {
						artboardsWithAnnotations.addObject(artboardWithAnnotation);
					}
				}

				// Remove stored values no longer used
				sncr.command.setValue_forKey_onLayer(nil,sncr.annotations.config.annotationParentKey,annotation);
			}
			// If linked object does not exist...
			else {
				// Remove stored values for linked artboard
				sncr.command.setValue_forKey_onLayer(nil,sncr.annotations.config.annotationLinkKey,annotation);
				sncr.command.setValue_forKey_onLayer(nil,sncr.annotations.config.annotationLinkTypeKey,annotation);
				sncr.command.setValue_forKey_onLayer(nil,sncr.annotations.config.annotationParentKey,annotation);
				sncr.command.setValue_forKey_onLayer(nil,"flowObjectID",annotation);

				// Create annotation name
				var annotationName = annotation.name().replace(sncr.annotations.config.annotationLinkPrefix,"");

				// Update annotation layer name
				annotation.setName(annotationName);

				// Iterate counters
				updateCount++;
				removeCount++;

				// Create a log event
				log(annotationName + sncr.strings["annotation-unlink-complete"] + linkedObjectID);
			}
		});

		// If annotation group is not empty...
		if (noteGroup.layers().count() > 0) {
			artboardsWithAnnotations.forEach(function(artboardID){
				var siblings = sncr.annotations.getAnnotations(artboardID);

				if (siblings.count() > 1) {
					var sortByX = NSSortDescriptor.sortDescriptorWithKey_ascending("absoluteRect.x",1);
					var sortByY = NSSortDescriptor.sortDescriptorWithKey_ascending("absoluteRect.y",1);

					siblings = siblings.sortedArrayUsingDescriptors([sortByX,sortByY]);

					// Iterate through the siblings...
					for (var i = 0; i < siblings.length; i++) {
						// If there is a next sibling...
						if (i + 1 < siblings.length) {
							// Sibling variables
							var thisSibling = siblings[i];
							var nextSibling = siblings[i+1];

							// If this sibling and the next are on the same vertical plane, and intersect...
							if (CGRectGetMinX(thisSibling.rect()) == CGRectGetMinX(nextSibling.rect()) && CGRectGetMaxY(thisSibling.rect()) + sncr.annotations.config.annotationSpacing >= CGRectGetMinY(nextSibling.rect())) {
								// Adjust the Y coordinate of the next sibling
								nextSibling.frame().setY(CGRectGetMaxY(thisSibling.rect()) + sncr.annotations.config.annotationSpacing);
							}
						}
					}
				}
			});

			// Resize annotation and parent groups to account for children
			if (sketch.version.sketch > 52) {
				noteGroup.fixGeometryWithOptions(0);
				parentGroup.fixGeometryWithOptions(0);
			} else {
				noteGroup.resizeToFitChildrenWithOption(0);
				parentGroup.resizeToFitChildrenWithOption(0);
			}

			// Redraw all connections
			sncr.annotations.updateConnections();
		}
		// If annotation group is empty...
		else {
			// Remove the annotation group
			noteGroup.removeFromParent();

			// Resize parent group to account for children
			if (sketch.version.sketch > 52) {
				parentGroup.fixGeometryWithOptions(0);
			} else {
				parentGroup.resizeToFitChildrenWithOption(0);
			}
		}

		// Move parent group to the top of the layer list
		parentGroup.moveToLayer_beforeLayer(sncr.page,nil);

		// Deselect parent group (moveToLayer_beforeLayer selects it)
		parentGroup.select_byExtendingSelection(0,1);

		// If the function was not invoked by action...
		if (!context.actionContext) {
			// If any annotation links were removed
			if (removeCount > 0) {
				// Display feedback
				sketch.UI.message(updateCount + sncr.strings["annotation-update-complete"] + ", " + removeCount + sncr.strings["annotation-update-complete-unlinked"]);
			} else {
				// Display feedback
				sketch.UI.message(updateCount + sncr.strings["annotation-update-complete"]);
			}
		}
	},
	updateConnections: function() {
		// Connections variables
		var predicate = NSPredicate.predicateWithFormat("userInfo != nil && function(userInfo,'valueForKeyPath:',%@)." + sncr.annotations.config.connectionsGroupKey + " == true", sncr.pluginDomain);
		var connectionsGroup = sncr.page.children().filteredArrayUsingPredicate(predicate).firstObject();

		// Remove connections group if it exists...
		if (connectionsGroup) connectionsGroup.removeFromParent();

		// Create annotations loop
		var predicate = NSPredicate.predicateWithFormat("userInfo != nil && function(userInfo,'valueForKeyPath:',%@)." + sncr.annotations.config.annotationLinkKey + " != nil", sncr.pluginDomain);
		var annotations = sncr.page.children().filteredArrayUsingPredicate(predicate);

		// Connections variable
		var connections = [];

		// Loop through annotations...
		annotations.forEach(function(annotation){
			// Get ID for linked object
			var linkedObjectID = sncr.command.valueForKey_onLayer_forPluginIdentifier(sncr.annotations.config.annotationLinkKey,annotation,sncr.pluginDomain);

			// Get linked object on current page
			var predicate = NSPredicate.predicateWithFormat("objectID == %@",linkedObjectID);
			var linkedObject = sncr.page.children().filteredArrayUsingPredicate(predicate).firstObject();

			// If linked object exists...
			if (linkedObject) {
				var flowObjectID = sncr.command.valueForKey_onLayer_forPluginIdentifier("flowObjectID",annotation,sncr.pluginDomain);

				if (linkedObject.class() == "MSSymbolInstance" && flowObjectID) {
					// Create connection object
					var connection = {
						linkID : annotation.objectID(),
						linkRect : createNewRectForFlowLayer(linkedObject,flowObjectID),
						endPoint : {
							x : annotation.absoluteRect().x(),
							y : annotation.absoluteRect().y()
						}
					}
				} else {
					// Create connection object
					var connection = {
						linkID : annotation.objectID(),
						linkRect : linkedObject.parentArtboard() ? CGRectIntersection(linkedObject.absoluteRect().rect(),linkedObject.parentArtboard().absoluteRect().rect()) : linkedObject.absoluteRect().rect(),
						endPoint : {
							x : annotation.absoluteRect().x(),
							y : annotation.absoluteRect().y()
						}
					}
				}

				// Add connection object to connections array
				connections.push(connection);
			}
		});

		// Set parent group
		var parentGroup = getParentGroup(sncr.page,sncr.parentGroupName);

		// Set annotation group
		var noteGroup = getChildGroup(parentGroup,sncr.artboardNoteGroupName);

		// Create new connections group
		connectionsGroup = MSLayerGroup.new();

		// Iterate through the connections...
		connections.forEach(function(connection,i){
			var linkRect = connection.linkRect;
			var startPoint;
			var startPointX;
			var startPointY;
			var endPoint;
			var endPointX;
			var endPointY;

			if (CGRectGetMinX(linkRect) < connection.endPoint.x) {
				startPointX = CGRectGetMaxX(linkRect) + sncr.annotations.config.annotationArrowStartXOffset;
				startPointY = CGRectGetMidY(linkRect) + sncr.annotations.config.annotationArrowStartYOffset;
				endPointX = connection.endPoint.x + sncr.annotations.config.annotationArrowEndXOffset;
				endPointY = connection.endPoint.y + sncr.annotations.config.annotationArrowEndYOffset;
			} else {
				startPointX = CGRectGetMinX(linkRect) - sncr.annotations.config.annotationArrowStartXOffset;
				startPointY = CGRectGetMidY(linkRect) + sncr.annotations.config.annotationArrowStartYOffset;
				endPointX = connection.endPoint.x + sncr.annotations.config.annotationWidth - sncr.annotations.config.annotationArrowEndXOffset;
				endPointY = connection.endPoint.y + sncr.annotations.config.annotationArrowEndYOffset;
			}

			startPoint = NSMakePoint(Math.round(startPointX),Math.round(startPointY));
			endPoint = NSMakePoint(Math.round(endPointX),Math.round(endPointY));

			var linePath = NSBezierPath.bezierPath();
			linePath.moveToPoint(startPoint);

			if (startPoint.y == endPoint.y) {
				linePath.lineToPoint(endPoint);
			} else {
				var controlPoint1Offset = Math.max(Math.abs(endPoint.x - startPoint.x)/2, 24);
				var controlPoint2Offset = Math.max(Math.abs(endPoint.x - startPoint.x)/2, 24);
				var controlPoint1 = NSMakePoint(startPoint.x + controlPoint1Offset, startPoint.y);
				var controlPoint2 = NSMakePoint(endPoint.x - controlPoint2Offset, endPoint.y);

				linePath.curveToPoint_controlPoint1_controlPoint2(endPoint,controlPoint1,controlPoint2);
			}

			var lineLayer = MSShapePathLayer.layerWithPath(MSPath.pathWithBezierPath(linePath));
			lineLayer.setName(sncr.annotations.config.annotationArrowName + ' ' + i);
			lineLayer.style().setStartMarkerType(sncr.annotations.config.annotationArrowStartType);
			lineLayer.style().setEndMarkerType(sncr.annotations.config.annotationArrowEndType);

			var lineStyle = lineLayer.style().addStylePartOfType(1);
			lineStyle.setColor(MSImmutableColor.colorWithSVGString(sncr.annotations.config.annotationArrowStrokeColor).newMutableCounterpart());
			lineStyle.setThickness(sncr.annotations.config.annotationArrowStrokeWidth);
			lineStyle.setPosition(0);

			connectionsGroup.addLayers([lineLayer]);
		});

		// Move connections group to annotation group
		connectionsGroup.moveToLayer_beforeLayer(noteGroup,nil);

		// Resize connections group to account for children
		if (sketch.version.sketch > 52) {
			connectionsGroup.fixGeometryWithOptions(0);
		} else {
			connectionsGroup.resizeToFitChildrenWithOption(0);
		}

		// Deselection connections and annotations groups
		connectionsGroup.deselectLayerAndParent();

		// Set connections group name
		connectionsGroup.setName(sncr.annotations.config.connectionsGroupName);

		// Lock connections group
		connectionsGroup.setIsLocked(1);

		// Set stored value on connections group
		sncr.command.setValue_forKey_onLayer_forPluginIdentifier(true,sncr.annotations.config.connectionsGroupKey,connectionsGroup,sncr.pluginDomain);
	},
	settings: function(context,command) {
		// Setting variables
		var defaultSettings = {};
		defaultSettings.autoAnnotate = 0;

		// Update default settings with cached settings
		defaultSettings = getCachedSettings(context,sncr.data,defaultSettings,sncr.pluginDomain);

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
					sncr.command.setValue_forKey_onLayer(autoAnnotate.state(),"autoAnnotate",sncr.data);
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
			case "description" :
				sncr.command.setValue_forKey_onLayer(type,"linkType",layer);
				sncr.command.setValue_forKey_onLayer(destination,sncr.descriptions.config.descriptionLinkKey,layer);

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
			sketch.UI.message("Select one layer which is not an artboard");

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
		if (sncr.selection.count() == 1 && (sncr.selection[0] instanceof MSArtboardGroup || sncr.selection[0] instanceof MSSymbolMaster)) {
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
					sketch.UI.message(sncr.strings["description-update-complete"]);
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
					artboardDesc.setTextBehaviour(0);

					// Apply style to artboard description
					if (artboardDescStyle.newInstance) {
						artboardDesc.setStyle(artboardDescStyle.newInstance());
					} else {
						artboardDesc.setSharedStyle(artboardDescStyle);
					}

					// Add artboard description to annotation group
					descGroup.addLayers([artboardDesc]);

					// Set artboard description x/y in relation to artboard, with offsets
					artboardDesc.absoluteRect().setX(artboard.frame().x() + sncr.descriptions.config.descriptionXOffset);
					artboardDesc.absoluteRect().setY(artboard.frame().y() + artboard.frame().height() + sncr.descriptions.config.descriptionYOffset);

					// Set artboard description width
					artboardDesc.frame().setWidth(artboard.frame().width());
					artboardDesc.setTextBehaviour(1);

					// Resize description and parent groups to account for children
					if (sketch.version.sketch > 52) {
						descGroup.fixGeometryWithOptions(0);
						parentGroup.fixGeometryWithOptions(0);
					} else {
						descGroup.resizeToFitChildrenWithOption(0);
						parentGroup.resizeToFitChildrenWithOption(0);
					}

					// Set stored value for linked artboard
					sncr.command.setValue_forKey_onLayer(artboard.objectID(),sncr.descriptions.config.descriptionLinkKey,artboardDesc);

					// Display feedback
					sketch.UI.message(sncr.strings["description-set-complete"]);
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
			sketch.UI.alert(sncr.strings["description-set-plugin"],sncr.strings["description-set-problem"]);
		}
	},
	linkSelected : function(context) {
		// Validate the selections to link
		var selections = sncr.descriptions.validateSelected(context);

		// If selections are valid...
		if (selections) {
			// Set stored value for linked artboard
			sncr.common.linkObject(selections.description,selections.artboard.objectID(),"description");

			// Set parent group
			var parentGroup = getParentGroup(sncr.page,sncr.parentGroupName);

			// Set annotation group
			var descGroup = getChildGroup(parentGroup,sncr.descriptionsGroupName);

			// Set artboard description x/y in relation to artboard, with offsets
			selections.description.absoluteRect().setX(selections.artboard.frame().x() + sncr.descriptions.config.descriptionXOffset);
			selections.description.absoluteRect().setY(selections.artboard.frame().y() + selections.artboard.frame().height() + sncr.descriptions.config.descriptionYOffset);

			// Set artboard description text behavior
			selections.description.setTextBehaviour(0);

			// Set artboard description width
			selections.description.frame().setWidth(selections.artboard.frame().width());
			selections.description.setTextBehaviour(1);

			// If the artboard description is not in the description group...
			if (selections.description.parentGroup() != descGroup) {
				// Move the artboard description to the description group
				selections.description.moveToLayer_beforeLayer(descGroup,nil);

				// Deselect the artboard description (moveToLayer_beforeLayer selects it)
				selections.description.select_byExtendingSelection(0,1);
			}

			// Deselect the artboard
			selections.artboard.select_byExtendingSelection(0,1);

			// Resize description and parent groups to account for children
			if (sketch.version.sketch > 52) {
				descGroup.fixGeometryWithOptions(0);
				parentGroup.fixGeometryWithOptions(0);
			} else {
				descGroup.resizeToFitChildrenWithOption(0);
				parentGroup.resizeToFitChildrenWithOption(0);
			}

			// Set layer name
			var layerName = sncr.descriptions.config.descriptionLinkPrefix + selections.artboard.name();

			// Update the layer name
			selections.description.setName(layerName);

			// Create a log event
			log(layerName + sncr.strings["description-link-complete"] + selections.artboard.name());

			// Display feedback
			sketch.UI.message(layerName + sncr.strings["description-link-complete"] + selections.artboard.name());
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
				sncr.selection[i].select_byExtendingSelection(0,1);
			}

			// Display feedback
			sketch.UI.message(count + sncr.strings["description-unlinks-complete"]);
		}
		// If there are no selections...
		else {
			// Display feedback
			sketch.UI.alert(sncr.strings["description-unlink-plugin"],sncr.strings["description-unlink-problem"]);
		}
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

					// Set artboard description text behavior
					layer.setTextBehaviour(0);

					// Set artboard description width
					layer.frame().setWidth(layerWidth);
					layer.setTextBehaviour(1);

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
						layer.select_byExtendingSelection(0,1);
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
				if (sketch.version.sketch > 52) {
					descGroup.fixGeometryWithOptions(0);
				} else {
					descGroup.resizeToFitChildrenWithOption(0);
				}
			}
			// If description group is empty...
			else {
				// Remove the description group
				descGroup.removeFromParent();
			}

			// Resize parent group to account for children
			if (sketch.version.sketch > 52) {
				parentGroup.fixGeometryWithOptions(0);
			} else {
				parentGroup.resizeToFitChildrenWithOption(0);
			}

			// Move parent group to the top of the layer list
			parentGroup.moveToLayer_beforeLayer(sncr.page,nil);

			// Deselect parent group
			parentGroup.select_byExtendingSelection(0,1);

			// If the function was not invoked by action...
			if (!context.actionContext) {
				// Lock the parent group
				parentGroup.setIsLocked(1);

				// If any artboard links were removed
				if (removeCount > 0) {
					// Display feedback
					sketch.UI.message(updateCount + sncr.strings["description-updates-complete"] + ", " + removeCount + sncr.strings["description-updates-complete-unlinked"]);
				} else {
					// Display feedback
					sketch.UI.message(updateCount + sncr.strings["description-updates-complete"]);
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

		settings = getCachedSettings(context,sncr.data,settings,sncr.pluginDomain);

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
					sncr.command.setValue_forKey_onLayer(descriptionWidth.stringValue(),"descriptionWidth",sncr.data);
					sncr.command.setValue_forKey_onLayer(descriptionPosition.indexOfSelectedItem(),"descriptionPosition",sncr.data);
					sncr.command.setValue_forKey_onLayer(Number(descriptionXOffset.stringValue()),"descriptionXOffset",sncr.data);
					sncr.command.setValue_forKey_onLayer(Number(descriptionYOffset.stringValue()),"descriptionYOffset",sncr.data);
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
	},
	validateSelected: function(context) {
		// Get latest selections, as they may have been changed by Insert
		var selections = sncr.page.selectedLayers().layers();

		// If two objects are not selected...
		if (selections.count() != 2) {
			// Display feedback
			sketch.UI.alert(sncr.strings["description-link-plugin"],sncr.strings["description-link-problem"]);

			return false;
		}

		// Selection variables
		var firstObject = selections.firstObject(),
			lastObject = selections.lastObject();

		// If the first item is not an artboard and the second item is an artboard...
		if ((firstObject.class() != "MSArtboardGroup" || firstObject.class() != "MSSymbolMaster") && (lastObject.class() == "MSArtboardGroup" || lastObject.class() == "MSSymbolMaster")) {
			return {
				description : firstObject,
				artboard : lastObject
			}
		}
		// If the first item is an artboard and the second item is not an artboard
		else if ((firstObject.class() == "MSArtboardGroup" || firstObject.class() == "MSSymbolMaster") && (lastObject.class() != "MSArtboardGroup" || lastObject.class() != "MSSymbolMaster")) {
			return {
				description : lastObject,
				artboard : firstObject
			}
		}
		// If the selections are two artboards...
		else {
			// Display feedback
			sketch.UI.alert(sncr.strings["description-link-plugin"],sncr.strings["description-link-problem"]);

			return false;
		}
	}
}

sncr.layout = {
	update: function(context) {
		if (!context.actionContext) {
			sncr.layout.includePage(context,false);
		} else {
			sncr.layout.sanitizePages(context);
		}

		if (sncr.command.valueForKey_onLayer_forPluginIdentifier(sncr.layout.config.featureKey,sncr.page,sncr.pluginDomain) != false) {
			// Get artboards to layout
			var predicate = NSPredicate.predicateWithFormat("userInfo == nil || function(userInfo,'valueForKeyPath:',%@)." + sncr.layout.config.featureKey + " != " + false,sncr.pluginDomain),
				artboards = sncr.page.artboards().filteredArrayUsingPredicate(predicate),
				artboardLoop = artboards.objectEnumerator(),
				artboard;

			// If there artboards to layout...
			if (artboards.count()) {
				// Reset page origin
				sncr.page.setRulerBase(CGPointMake(0,0));

				// Get layout settings
				var layoutSettings = sncr.layout.settings(context,"update");

				// If artboards should be sorted...
				if (layoutSettings.sortOrder != 0) {
					var sortByName = NSSortDescriptor.sortDescriptorWithKey_ascending("name",1),
						artboards = artboards.sortedArrayUsingDescriptors([sortByName]);

					var layoutLayers = (layoutSettings.sortOrder == 2) ? artboards.reverseObjectEnumerator().allObjects() : artboards;

					sortLayerList(layoutLayers,sncr.page);
				}

				var firstBoard = artboards.objectAtIndex(0),
					lastBoard = artboards.objectAtIndex(artboards.count() - 1),
					lastBoardPrefix = 0,
					groupType = parseInt(firstBoard.name()) == parseInt(lastBoard.name()) ? 0 : 1,
					groupCount = 1,
					groupLayout = [];

				while (artboard = artboardLoop.nextObject()) {
					var artboardName = artboard.name(),
						thisBoardPrefix = (groupType == 0) ? parseFloat(artboardName) : parseInt(artboardName);

					if (lastBoardPrefix != 0 && lastBoardPrefix != thisBoardPrefix) {
						groupCount++;
					}

					groupLayout.push({
						artboard : artboardName,
						prefix : thisBoardPrefix,
						group : groupCount,
						width : artboard.frame().width()
					});

					lastBoardPrefix = thisBoardPrefix;
				}

				var x = 0,
					y = 0,
					xPad = parseInt(layoutSettings.xPad),
					yPad = parseInt(layoutSettings.yPad),
					xCount = 0,
					rowCount = layoutSettings.rowCount,
					rowHeight = 0,
					groupCount = 1;

				for (var i = 0; i < groupLayout.length; i++) {
					var artboard = artboards.objectAtIndex(i),
						artboardFrame = artboard.frame();

					// If starting a new group, reset x and calculate the y position of the next row
					if (groupLayout[i]['group'] != groupCount) {
						var nextGroupTotal = groupCounter(groupCount + 1,groupLayout);

						if (parseInt(layoutSettings.fitWidth)) {
							if (layoutSettings.rowDensity == 1 || (rowCount - (xCount + 1)) < nextGroupTotal) {
								x = 0;
								y += rowHeight + yPad;
								rowHeight = 0;
								xCount = 0;
							} else {
								x += artboardFrame.width() + xPad;
								xCount++;
							}
						} else {
							if (layoutSettings.rowDensity == 1 || (rowCount - (xCount + 1)) < nextGroupTotal) {
								x = 0;
								y += rowHeight + yPad;
								rowHeight = 0;
								xCount = 0;
							} else {
								x += artboardFrame.width() + xPad;
								xCount++;
							}
						}

						groupCount++;
					}

					// If new line is detected but is continuation of group, give smaller vertical padding
					if (x == 0 && xCount != 0) {
						y += yPad / 2;
					}

					// Position current artboard
					artboardFrame.x = x;
					artboardFrame.y = y;

					// Keep track if this artboard is taller than previous artboards in row
					if (artboardFrame.height() > rowHeight) {
						rowHeight = artboardFrame.height();
					}

					if (parseInt(layoutSettings.fitWidth)) {
						if (x + artboardFrame.width() + xPad * 2 > layoutSettings.fitWidth) {
							x = 0;
							y += rowHeight;
							rowHeight = 0;
						} else {
							x += artboardFrame.width() + xPad;
						}
					} else {
						// Determine if this is the last artboard the row, reset x and calculate the y position of the next row
						if ((xCount + 1) % rowCount == 0) {
							x = 0;
							y += rowHeight;
							rowHeight = 0;
						} else {
							x += artboardFrame.width() + xPad;
						}
					}

					xCount++;
				}

				if (layoutSettings.autoSections) sncr.sections.updateAllOnPage(context,"layout");
				if (layoutSettings.autoTitles) sncr.titles.create(context,"layout");
				if (layoutSettings.autoDescriptions) sncr.descriptions.updateAllOnPage(context,"layout");
				if (layoutSettings.autoAnnotations) sncr.annotations.updateAnnotations(context);

				// Collapse everything if run manually
				if (!context.actionContext) actionWithType(context,"MSCollapseAllGroupsAction").doPerformAction(nil);

				// Feedback to user
				sketch.UI.message(sncr.strings["layout-artboards-complete"]);
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
					artboard.select_byExtendingSelection(0,1);
				}
			}
		}
	},
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
				sketch.UI.message(sncr.selection[0].name() + sncr.strings["layout-include-complete"]);
			} else {
				sketch.UI.message(count + sncr.strings["layout-includes-complete"]);
			}
		} else {
			sketch.UI.alert(sncr.strings["layout-include-plugin"],sncr.strings["layout-include-problem"]);
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
				sketch.UI.message(sncr.selection[0].name() + sncr.strings["layout-preclude-complete"]);
			} else {
				sketch.UI.message(count + sncr.strings["layout-precludes-complete"]);
			}
		} else {
			sketch.UI.alert(sncr.strings["layout-preclude-plugin"],sncr.strings["layout-preclude-problem"]);
		}
	},
	preclude: function(object) {
		sncr.command.setValue_forKey_onLayer(false,sncr.layout.config.featureKey,object);
	},
	includePage: function(context,feedback) {
		sncr.layout.include(sncr.page);

		sncr.layout.sanitizePages(context);

		if (!feedback) {
			sketch.UI.message(sncr.page.name() + sncr.strings["layout-include-page-complete"]);
		}
	},
	precludePage: function(context) {
		sncr.layout.preclude(sncr.page);

		sncr.layout.sanitizePages(context);

		sketch.UI.message(sncr.page.name() + sncr.strings["layout-preclude-page-complete"]);
	},
	settings: function(context,command) {
		// Type objects
		var layoutTypes = ["Dense layout","Loose layout"],
			sortTypes = ["Do not sort anything","Sort layers and artboards","Sort layers and artboards, reverse layer order"];

		// Default settings
		var defaultSettings = {};
		defaultSettings.rowCount = 8;
		defaultSettings.fitWidth = '';
		defaultSettings.rowDensity = 0;
		defaultSettings.sortOrder = 0;
		defaultSettings.xPad = "400";
		defaultSettings.yPad = "600";
		defaultSettings.autoSections = 1;
		defaultSettings.autoTitles = 1;
		defaultSettings.autoDescriptions = 1;
		defaultSettings.autoAnnotations = 1;

		// Update default settings with cached settings
		defaultSettings = getCachedSettings(context,sncr.page,defaultSettings,sncr.pluginDomain);

		// Check for old artboardsPerRowDefault value
		var artboardsPerRowDefault = sncr.command.valueForKey_onLayer_forPluginIdentifier("artboardsPerRowDefault",sncr.page,sncr.pluginDomain);

		// If artboardsPerRowDefault value exists...
		if (artboardsPerRowDefault) {
			// Old artboardsPerRow object
			var artboardsPerRow = ["4","6","8","10","12","14","100"];

			// Overwrite default value with old artboardsPerRow value
			defaultSettings.rowCount = artboardsPerRow[artboardsPerRowDefault];
		}

		// If a command is not passed, operate in config mode...
		if (!command) {
			var alertWindow = COSAlertWindow.new();
			alertWindow.setMessageText(sncr.strings["layout-settings-title"]);

			alertWindow.addTextLabelWithValue(sncr.strings["layout-settings-artboard-count"]);

			var rowCount = createField(defaultSettings.rowCount,NSMakeRect(0,0,60,22));
			alertWindow.addAccessoryView(rowCount);

			alertWindow.addTextLabelWithValue('Fit pixel width:');

			var fitWidth = createField(defaultSettings.fitWidth,NSMakeRect(0,0,60,22));
			alertWindow.addAccessoryView(fitWidth);

			var fitWidthDelegate = new MochaJSDelegate({
				"controlTextDidChange:" : (function() {
					if (fitWidth.stringValue() != '') {
						rowCount.setEnabled(0);
					} else {
						rowCount.setEnabled(1);
					}
				})
			});

			fitWidth.setDelegate(fitWidthDelegate.getClassInstance());

			alertWindow.addTextLabelWithValue(sncr.strings["layout-settings-layout-type"]);

			var rowDensity = createRadioButtons(layoutTypes,defaultSettings.rowDensity);
			alertWindow.addAccessoryView(rowDensity);

			alertWindow.addTextLabelWithValue(sncr.strings["layout-settings-sort-type"]);

			var sortOrder = createRadioButtons(sortTypes,defaultSettings.sortOrder);
			alertWindow.addAccessoryView(sortOrder);

			alertWindow.addTextLabelWithValue(sncr.strings["layout-settings-spacing-horizontal"]);

			var xPad = createField(defaultSettings.xPad,NSMakeRect(0,0,60,22));
			alertWindow.addAccessoryView(xPad);

			alertWindow.addTextLabelWithValue(sncr.strings["layout-settings-spacing-vertical"]);

			var yPad = createField(defaultSettings.yPad,NSMakeRect(0,0,60,22));
			alertWindow.addAccessoryView(yPad);

			alertWindow.addTextLabelWithValue("");

			var autoSections = createCheckbox({
				name : "Automatically adjust section titles",
				value: 1
			},defaultSettings.autoSections,NSMakeRect(0,0,300,18));

			alertWindow.addAccessoryView(autoSections);

			var autoTitles = createCheckbox({
				name : "Automatically adjust artboard titles",
				value: 1
			},defaultSettings.autoTitles,NSMakeRect(0,0,300,18));

			alertWindow.addAccessoryView(autoTitles);

			var autoDescriptions = createCheckbox({
				name : "Automatically adjust artboard descriptions",
				value: 1
			},defaultSettings.autoDescriptions,NSMakeRect(0,0,300,18));

			alertWindow.addAccessoryView(autoDescriptions);

			var autoAnnotations = createCheckbox({
				name : "Automatically adjust layer annotations",
				value: 1
			},defaultSettings.autoAnnotations,NSMakeRect(0,0,300,18));

			alertWindow.addAccessoryView(autoAnnotations);

			var buttonOK = alertWindow.addButtonWithTitle(sncr.strings["general-button-ok"]);
			var buttonCancel = alertWindow.addButtonWithTitle(sncr.strings["general-button-cancel"]);

			// Set key order and first responder
			setKeyOrder(alertWindow,[
				rowCount,
				fitWidth,
				rowDensity,
				sortOrder,
				xPad,
				yPad,
				autoSections,
				autoTitles,
				autoDescriptions,
				autoAnnotations,
				buttonOK
			]);

			var responseCode = alertWindow.runModal();

			if (responseCode == 1000) {
				try {
					if (artboardsPerRowDefault) sncr.command.setValue_forKey_onLayer(nil,"artboardsPerRowDefault",sncr.page);
					sncr.command.setValue_forKey_onLayer(rowCount.stringValue(),"rowCount",sncr.page);
					sncr.command.setValue_forKey_onLayer(fitWidth.stringValue(),"fitWidth",sncr.page);
					sncr.command.setValue_forKey_onLayer(rowDensity.selectedCell().tag(),"rowDensity",sncr.page);
					sncr.command.setValue_forKey_onLayer(sortOrder.selectedCell().tag(),"sortOrder",sncr.page);
					sncr.command.setValue_forKey_onLayer(xPad.stringValue(),"xPad",sncr.page);
					sncr.command.setValue_forKey_onLayer(yPad.stringValue(),"yPad",sncr.page);
					sncr.command.setValue_forKey_onLayer(autoSections.state(),"autoSections",sncr.page);
					sncr.command.setValue_forKey_onLayer(autoTitles.state(),"autoTitles",sncr.page);
					sncr.command.setValue_forKey_onLayer(autoDescriptions.state(),"autoDescriptions",sncr.page);
					sncr.command.setValue_forKey_onLayer(autoAnnotations.state(),"autoAnnotations",sncr.page);
				}
				catch(err) {
					log(sncr.strings["general-save-failed"]);
				}

				sncr.layout.update(context);
			} else return false;
		}
		// Otherwise operate in run mode...
		else {
			// Return settings
			return {
				rowCount : defaultSettings.rowCount,
				fitWidth : defaultSettings.fitWidth,
				rowDensity : defaultSettings.rowDensity,
				sortOrder : defaultSettings.sortOrder,
				xPad : defaultSettings.xPad,
				yPad : defaultSettings.yPad,
				autoSections : defaultSettings.autoSections,
				autoTitles : defaultSettings.autoTitles,
				autoDescriptions : defaultSettings.autoDescriptions,
				autoAnnotations : defaultSettings.autoAnnotations
			}
		}
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
			sketch.UI.message(layerName + sncr.strings["section-link-complete"] + selections.artboard.name());
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
				sncr.selection[i].select_byExtendingSelection(0,1);
			}

			// If there is only one selection...
			if (sncr.selection.count() == 1) {
				// Display feedback
				sketch.UI.message(titleName + sncr.strings["section-unlink-complete"] + artboardName);
			}
			// If there is more than one selection...
			else {
				// Display feedback
				sketch.UI.message(count + sncr.strings["section-unlinks-complete"]);
			}
		}
		// If there are no selections...
		else {
			// Display feedback
			sketch.UI.alert(sncr.strings["section-unlink-plugin"],sncr.strings["section-unlink-problem"]);
		}
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
				sketch.UI.message(sncr.strings["section-titles-updated"]);

				break;
			default:
				// If any artboard links were removed
				if (removeCount > 0) {
					// Display feedback
					sketch.UI.message(sncr.strings["section-titles-updated"] + ", " + removeCount + sncr.strings["section-titles-updated-unlinked"]);
				} else {
					// Display feedback
					sketch.UI.message(sncr.strings["section-titles-updated"]);
				}

				break;
		}
	},
	settings: function(context,command) {
		var defaultSettings = {};
		defaultSettings.sectionTitleWidth = "";
		defaultSettings.sectionTitleXOffset = 0;
		defaultSettings.sectionTitleYOffset = -108;

		defaultSettings = getCachedSettings(context,sncr.data,defaultSettings,sncr.pluginDomain);

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
					sncr.command.setValue_forKey_onLayer(titleWidth.stringValue(),"sectionTitleWidth",sncr.data);
					sncr.command.setValue_forKey_onLayer(Number(titleXOffset.stringValue()),"sectionTitleXOffset",sncr.data);
					sncr.command.setValue_forKey_onLayer(Number(titleYOffset.stringValue()),"sectionTitleYOffset",sncr.data);
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
	},
	validateSelected: function(context) {
		// Get latest selections, as they may have been changed by Insert
		var selections = sncr.page.selectedLayers().layers();

		// If two objects are not selected...
		if (selections.count() != 2) {
			// Display feedback
			sketch.UI.alert(sncr.strings["section-link-plugin"],sncr.strings["section-link-problem"]);

			return false;
		}

		// Selection variables
		var firstObject = selections.firstObject(),
			lastObject = selections.lastObject();

		// If the first item is not an artboard and the second item is an artboard...
		if ((firstObject.class() != "MSArtboardGroup" || firstObject.class() != "MSSymbolMaster") && (lastObject.class() == "MSArtboardGroup" || lastObject.class() == "MSSymbolMaster")) {
			return {
				title : firstObject,
				artboard : lastObject
			}
		}
		// If the first item is an artboard and the second item is not an artboard
		else if ((firstObject.class() == "MSArtboardGroup" || firstObject.class() == "MSSymbolMaster") && (lastObject.class() != "MSArtboardGroup" || lastObject.class() != "MSSymbolMaster")) {
			return {
				title : lastObject,
				artboard : firstObject
			}
		}
		// If the selections are two artboards...
		else {
			// Display feedback
			sketch.UI.alert(sncr.strings["section-link-plugin"],sncr.strings["section-link-problem"]);

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

}

sncr.titles = {
	create: function(context,command) {
		// If function was invoked by action, set command
		if (!command && context.actionContext) command = "action";

		logFunctionStart("Artboard Titles: Create",command);

		var titleSettings = sncr.titles.settings(context,"create");

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

				// Apply style to screen title
				if (screenTitle.newInstance) {
					screenTitle.setStyle(screenTitleStyle.newInstance());
				} else {
					screenTitle.setSharedStyle(screenTitleStyle);
				}

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
			if (sketch.version.sketch > 52) {
				titleGroup.fixGeometryWithOptions(0);
				parentGroup.fixGeometryWithOptions(0);
			} else {
				titleGroup.resizeToFitChildrenWithOption(0);
				parentGroup.resizeToFitChildrenWithOption(0);
			}

			// Collapse the parent group
			parentGroup.setLayerListExpandedType(0);

			// Move parent group to the top of the layer list
			parentGroup.moveToLayer_beforeLayer(sncr.page,nil);

			// Deselect parent group (moveToLayer_beforeLayer selects it)
			parentGroup.select_byExtendingSelection(0,1);

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
					sketch.UI.message(sncr.strings["title-create-complete"]);

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
					sketch.UI.alert(sncr.strings["title-create-plugin"],sncr.strings["title-create-problem"]);

					break;
			}
		}
	},
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
				sketch.UI.message(sncr.selection[0].name() + sncr.strings["title-include-complete"]);
			} else {
				sketch.UI.message(count + sncr.strings["title-includes-complete"]);
			}
		} else {
			sketch.UI.alert(sncr.strings["title-include-plugin"],sncr.strings["title-include-problem"]);
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
				sketch.UI.message(sncr.selection[0].name() + sncr.strings["title-preclude-complete"]);
			} else {
				sketch.UI.message(count + sncr.strings["title-precludes-complete"]);
			}
		} else {
			sketch.UI.alert(sncr.strings["title-preclude-plugin"],sncr.strings["title-preclude-problem"]);
		}
	},
	settings: function(context,command) {
		// Setting variables
		var defaultSettings = {};
		defaultSettings.artboardTitleType = 0;
		defaultSettings.artboardTitleOffset = 0;
		defaultSettings.artboardTitleAuto = 0;

		// Update default settings with cached settings
		defaultSettings = getCachedSettings(context,sncr.data,defaultSettings,sncr.pluginDomain);

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
					sncr.command.setValue_forKey_onLayer(titleType.selectedCell().tag(),"artboardTitleType",sncr.data);
					sncr.command.setValue_forKey_onLayer(Number(titleOffset.stringValue()),"artboardTitleOffset",sncr.data);
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

		sliceLayer.select_byExtendingSelection(1,0);
		actionWithType(context,"MSMoveToBackAction").doPerformAction(nil);

		var format = sliceLayer.exportOptions().addExportFormat();
		format.setScale(".5");
		format.setFileFormat("pdf");

		sncr.wireframes.include(context);

		sketch.UI.message(sncr.strings["wireframe-add-complete"]);

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

			sketch.UI.message(selection[0].name() + sncr.strings["wireframe-include-complete"]);
		} else {
			sketch.UI.alert(sncr.strings["wireframe-include-plugin"],sncr.strings["wireframe-include-problem"]);
		}
	},
	preclude: function(context) {
		if (sncr.selection.count() == 1 && sncr.selection[0] instanceof MSSliceLayer) {
			sncr.command.setValue_forKey_onLayer(false,sncr.wireframes.config.featureKey,sncr.selection[0]);

			sketch.UI.message(sncr.selection[0].name() + sncr.strings["wireframe-preclude-complete"]);
		} else {
			sketch.UI.alert(sncr.strings["wireframe-preclude-plugin"],sncr.strings["wireframe-preclude-problem"]);
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

				sketch.UI.message(exportList.length + sncr.strings["wireframe-export-complete"]);
			}
		} else {
			sketch.UI.alert(sncr.strings["wireframe-export-plugin"],sncr.strings["wireframe-export-problem"]);
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
	var textStyles = MSDocument.currentDocument().documentData().layerTextStyles(),
		textStyle = getObjectByName(textStyles.objects(),styleName);

	if (!textStyle) {
		var textLayer = MSTextLayer.alloc().initWithFrame(nil);
		textLayer.setFontSize(styleData.fontSize);
		textLayer.setLineHeight(styleData.lineHeight);
		textLayer.setTextAlignment(styleData.textAlignment);
		textLayer.setFontPostscriptName(styleData.fontFace);

		if (textStyles.addSharedStyleWithName_firstInstance) {
			textStyle = textStyles.addSharedStyleWithName_firstInstance(styleName,textLayer.style());
		} else if (textStyles.initWithName_firstInstance) {
			textStyle = MSSharedStyle.alloc().initWithName_firstInstance(styleName,textLayer.style());

			textStyles.addSharedObject(textStyle);
		} else {
			textStyle = MSSharedStyle.alloc().initWithName_style(styleName,textLayer.style());

			textStyles.addSharedObject(textStyle);
		}
	}

	return textStyle;
}

function deleteTextStyle(styleName) {
	var textStyles = MSDocument.currentDocument().documentData().layerTextStyles(),
		textStyle = getObjectByName(textStyles.objects(),styleName);

	if (textStyle) textStyles.removeSharedStyle(textStyle);
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

function logFunctionStart(output,command) {
	if (!command) command = "user";

	log(output + " - Initiated by " + command);
}

function createNewRectForFlowLayer(linkedObject,flowObjectID) {
	var objectRect = linkedObject.absoluteRect().rect();

	var master = linkedObject.symbolMaster();
	var masterRect = master.absoluteRect().rect();

	var flowRect = master.layerWithID(flowObjectID).absoluteRect().rect();

	var offsetX = flowRect.origin.x - masterRect.origin.x;
	var offsetY = flowRect.origin.y - masterRect.origin.y;
	var offsetWidth = objectRect.size.width - masterRect.size.width;
	var offsetHeight = objectRect.size.height - masterRect.size.height;

	var newX = objectRect.origin.x + offsetX + offsetWidth;
	var newY = objectRect.origin.y + offsetY + offsetHeight;

	return NSMakeRect(newX,newY,flowRect.size.width,flowRect.size.height);
}
