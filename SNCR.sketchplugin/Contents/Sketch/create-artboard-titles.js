var onRun = function(context) {
	// Document variables
	var doc = context.document;
	var page = [doc currentPage];
	var artboards = [page artboards];
	var layers = [page layers];

	// Screen title variables
	var titleGroupName = 'Titles';

	// Add screen title style, if it doesn't exist already
	var screenTitleStyle = addTextStyle('Layout/Screen Title','Helvetica Neue Medium Italic',16,48,0);

	// Find screen titles group, if it exists already
	var titleGroup = findLayerByName(page,titleGroupName);

	// Remove screen titles group, if it exists already
	if (titleGroup) page.removeLayer(titleGroup);

	// Add new screen title group
	titleGroup = addLayerGroup(page,titleGroupName,0,0,true,true);

	// Iterate through each artboard on the page
	for (var i = 0; i < artboards.count(); i++) {
		// Artboard variables
		var artboard = artboards.objectAtIndex(i);
		var artboardName = artboard.name();
		var artboardFrame = artboard.frame();

		// Add screen title
		var screenTitle = addTextLayer(titleGroup,artboardName,artboardName,artboardFrame.width(),false);

		// Set screen title position
		screenTitle.frame().setX(artboardFrame.x());
		screenTitle.frame().setY(artboardFrame.y()-48);

		// Set screen title style
		screenTitle.setStyle(screenTitleStyle.newInstance());
	}

	// Resize the screen titles group to ensure dimensions reflect contents
	titleGroup.resizeToFitChildrenWithOption(0);

	// Feedback to user
	doc.showMessage("Screen titles created!");

	// Common functions
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

	function addLayerGroup(output,layerName,x,y,isLocked,isUnique) {
		var layerGroup = findLayerByName(output,layerName);

		if (isUnique && layerGroup) {
			layerGroup.frame().setX(x);
			layerGroup.frame().setY(y);
		} else {
			layerGroup = MSLayerGroup.new();
			layerGroup.setName(layerName);
			layerGroup.frame().setX(x);
			layerGroup.frame().setY(y);
			layerGroup.setIsLocked(isLocked);

			output.addLayers([layerGroup]);
		}

		return layerGroup;
	}

	function findLayerByName(scope,layerName) {
		var scope = scope.layers();

		if (scope) {
			for (var i = 0; i < scope.count(); i++) {
				if (scope.objectAtIndex(i).name() == layerName) {
					return scope.objectAtIndex(i);
				}
			}
		}

		return false;
	}

	function addTextLayer(output,layerName,layerValue,layerWidth,isLocked) {
		var textLayer = MSTextLayer.new();
		textLayer.setStringValue(layerValue);
		textLayer.setName(layerName);
		textLayer.setIsLocked(isLocked);

		if (layerWidth > 0) {
			textLayer.setTextBehaviour(1);
			textLayer.frame().setWidth(360);
		}

		output.addLayers([textLayer]);

		return textLayer;
	}
};
