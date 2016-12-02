@import 'lib/functions.js';

var onRun = function(context) {
	// Document variables
	var doc = context.document;
	var command = context.command;
	var page = doc.currentPage();
	var artboards = page.artboards();
	var layers = page.layers();

	// If artboards exist on the page...
	if (artboards.length) {
		// User	variables
		var titleSettings = showTitleSettings();

		// Generate the titles
		if (titleSettings) {
			// Screen title variables
			var titleGroupName = 'Titles';
			var screenTitleTextHeight = 48;
			var screenTitleOffset = parseInt(titleSettings.titleOffset);

			// Add screen title style, if it doesn't exist already
			var screenTitleStyle = addTextStyle('Layout/Screen Title','Helvetica Neue Medium Italic',14,screenTitleTextHeight,0);

			// Find screen titles group, if it exists already
			var titleGroup = findLayerByName(page,titleGroupName);

			// Remove screen titles group, if it exists already
			if (titleGroup) page.removeLayer(titleGroup);

			// Add new screen title group
			titleGroup = addLayerGroup(page,titleGroupName,0,0,true);

			// Set clickThrough and lock title group
			titleGroup.setIsLocked(true);
			titleGroup.setHasClickThrough(true);

			// Iterate through each artboard on the page
			for (var i = 0; i < artboards.count(); i++) {
				// Artboard variables
				var artboard = artboards.objectAtIndex(i);
				var artboardName = artboard.name();
				var artboardFrame = artboard.frame();

				// Add screen title
				var screenTitle = addTextLayer(titleGroup,artboardName,artboardName,artboardFrame.width(),false);

				// Set screen title horizontal position
				screenTitle.frame().setX(artboardFrame.x());

				// Set screen title vertical position per user setting
				if (titleSettings.titleType == 0) {
					screenTitle.frame().setY(artboardFrame.y()-(screenTitleTextHeight+screenTitleOffset));
				} else {
					screenTitle.frame().setY(artboardFrame.y()+artboardFrame.height()+screenTitleOffset);
				}

				// Set screen title style
				screenTitle.setStyle(screenTitleStyle.newInstance());
			}

			// Resize the screen titles group to ensure dimensions reflect contents
			titleGroup.resizeToFitChildrenWithOption(0);

			// Find annotations group if one exists
			var noteGroup = findLayerByName(page,'Annotations');

			if (noteGroup) {
				// Move annotations group above title group
				noteGroup.select_byExpandingSelection(true,false);
				actionWithType("MSMoveToFrontAction",context).moveToFront(null);
				noteGroup.select_byExpandingSelection(false,false);
			}

			// Feedback to user
			doc.showMessage(artboards.count() + " screen titles created!");
		}
	} else {
		// Feedback to user
		var app = NSApplication.sharedApplication();
		app.displayDialog_withTitle("No artboards, no titles!","Create Artboard Titles");
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

	function addTextStyle(styleName,fontName,fontSize,fontLineHeight,textAlignment) {
		if (!getTextStyleByName(styleName)) {
			var sharedStyles = doc.documentData().layerTextStyles();

			var textLayer = [[MSTextLayer alloc] initWithFrame:nil];
			textLayer.setFontSize(fontSize);
			textLayer.setLineHeight(fontLineHeight);
			textLayer.setTextAlignment(textAlignment);
			textLayer.setFontPostscriptName(fontName);

			sharedStyles.addSharedStyleWithName_firstInstance(styleName,textLayer.style());
		}

		return getTextStyleByName(styleName);
	}

	function getTextStyleByName(styleName) {
		var textStyles = doc.documentData().layerTextStyles().objects();

		if (textStyles) {
			for (var i = 0; i < textStyles.count(); i++) {
				if (textStyles.objectAtIndex(i).name() == styleName) {
					return textStyles.objectAtIndex(i);
				}
			}
		}

		return false;
	}

	function addLayerGroup(output,layerName,x,y,isUnique) {
		var layerGroup = findLayerByName(output,layerName);

		if (isUnique && layerGroup) {
			layerGroup.frame().setX(x);
			layerGroup.frame().setY(y);
		} else {
			layerGroup = MSLayerGroup.new();
			layerGroup.setName(layerName);
			layerGroup.frame().setX(x);
			layerGroup.frame().setY(y);

			output.addLayers([layerGroup]);
		}

		return layerGroup;
	}

	function addTextLayer(output,layerName,layerValue,layerWidth,isLocked) {
		var textLayer = MSTextLayer.new();
		textLayer.setStringValue(layerValue);
		textLayer.setName(layerName);
		textLayer.setIsLocked(isLocked);

		if (layerWidth > 0) {
			textLayer.setTextBehaviour(1);
			textLayer.frame().setWidth(layerWidth);
		}

		output.addLayers([textLayer]);

		return textLayer;
	}
};
