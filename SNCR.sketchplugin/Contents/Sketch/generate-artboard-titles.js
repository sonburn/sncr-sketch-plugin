//@import 'inventory.js';

var onRun = function(context) {
	// Document variables
	var doc = context.document;
	var page = [doc currentPage];
	var pages = [doc pages];
	var pageCount = [pages count];
	var artboards = [page artboards];
	var artboardCount = [artboards count];
	var layers = [page layers];
	var layerCount = [layers count];
	
	
	
	/////////////////////////////////////////////////////////////////////////////////////////////////////////////
	/////////////////////////////////////////////////////////////////////////////////////////////////////////////
	/////////////////////////////////////////////////////////////////////////////////////////////////////////////
	
	
	
	// Style variables
	var sharedStyles = doc.documentData().layerTextStyles();
	var screenTitleStyleName = 'Layout/Screen Title';
	var screenTitleStyle = getTextStyleByName(screenTitleStyleName);
	
	// Create Screen Title style if it doesn't exist
	if (!screenTitleStyle) {
		var textLayer = [[MSTextLayer alloc] initWithFrame:nil];
		textLayer.setFontSize(14);
		//textLayer.setLineSpacing(48);
		textLayer.setTextAlignment(0);
		textLayer.setFontPostscriptName('Helvetica Neue Medium');
		sharedStyles.addSharedStyleWithName_firstInstance(screenTitleStyleName,textLayer.style());
		screenTitleStyle = getTextStyleByName(screenTitleStyleName);
	}
	
	
	
	/////////////////////////////////////////////////////////////////////////////////////////////////////////////
	/////////////////////////////////////////////////////////////////////////////////////////////////////////////
	/////////////////////////////////////////////////////////////////////////////////////////////////////////////
	
	
	
	// Annotation variables
	var noteGroupName = 'Annotations';
	var noteGroup = findLayerByName(layers,noteGroupName);
	
	if (!noteGroup) {
		// Create main annotations group if not found
		noteGroup = MSLayerGroup.new();
		doc.currentPage().addLayers([noteGroup]);
		noteGroup.setName(noteGroupName);
		noteGroup.setIsLocked(true);
		var showMessage = "Screen titles generated"
	} else {
		var showMessage = "Screen titles updated"
	}
	
	var noteGroupFrame = noteGroup.frame();
	noteGroupFrame.setX(0);
	noteGroupFrame.setY(0);
	
	var noteGroupLayers = [noteGroup layers];
	var noteGroupLayerCount = [noteGroupLayers count];
	
	if (noteGroupLayerCount > 0) {
		var discrepencies = [];
		
		// Check all artboards for number discrepencies
		for (var i = 0; i < artboardCount; i++) {
			var artboard = [artboards objectAtIndex: i];
			var artboardName = [artboard name];
			var sncrTextLayer = findLayerByName([artboard layers],'sncr');
			
			if (String(artboardName) != sncrTextLayer.stringValue()) {
				// Add this to an array (to be created) which will need to be processed to update the sncrTextLayer, the annotatation group, and screen title, to the new artboard name
				
				discrepencies.push({
					oldTitle: sncrTextLayer.stringValue(),
					newTitle: String(artboardName)
				});
			}
		}
		
		if (discrepencies.length) {
			for (var i = 0; i < noteGroupLayerCount; i++) {
				var layer = [noteGroupLayers objectAtIndex: i];
				var layerName = [layer name];
				
/*
				for (var i = 0; i < discrepencies.length; i++) {
					var discrepency = discrepencies[i];
					
					if (layerName == discrepency.oldTitle.substr(0,discrepency.oldTitle.indexOf(' ')) {
						layer.setName(discrepency.newTitle.substr(0,discrepency.newTitle.indexOf(' '));
						array.splice(index, 1);
					}
				}
*/
			}
		}
	}
	
	// Create annotation group for each artboard
	for (var i = 0; i < artboardCount; i++) {
		var artboard = [artboards objectAtIndex: i];
		var artboardName = [artboard name];
		var artboardFrame = [artboard frame];
		
		// Create annotation layer group for each artboard, if one doesn't exist already
		var layerGroupName = artboardName.substr(0,artboardName.indexOf(' '));
		
		var layerGroup = findLayerByName(noteGroupLayers,layerGroupName);
		
		if (!layerGroup) {
			layerGroup = MSLayerGroup.new();
			layerGroup.setName(layerGroupName);
			noteGroup.addLayers([layerGroup]);
		}
		
		var layerGroupFrame = layerGroup.frame();
		layerGroupFrame.setX(artboardFrame.x());
		layerGroupFrame.setY(artboardFrame.y()-48);
		
		if (!findLayerByName([artboard layers],'sncr')) {
			// Create hidden screen title to track name changes
			var hiddenTitle = artboard.addLayerOfType("text");
			hiddenTitle.setStringValue(artboardName);
			hiddenTitle.setName('sncr');
			hiddenTitle.setIsLocked(true);
			hiddenTitle.setIsVisible(false);
		}
		
		// Remove existing screen title
		var layerGroupContent = layerGroup.children().objectEnumerator();
		
		while (layer = layerGroupContent.nextObject()) {
			if ([layer name] == artboardName) layerGroup.removeLayer(layer);
		}
		
		// Create new screen title
		var screenTitle = layerGroup.addLayerOfType("text");
		screenTitle.setStringValue(artboardName);
		screenTitle.setName(artboardName);
		screenTitle.setIsLocked(true);
		screenTitle.setStyle(screenTitleStyle.newInstance());
		
		var screenTitleFrame = screenTitle.frame();
		screenTitleFrame.setWidth(artboardFrame.width());
		
		layerGroup.resizeToFitChildrenWithOption(0);
	}
	
	noteGroup.resizeToFitChildrenWithOption(0);
	
	
	
	/////////////////////////////////////////////////////////////////////////////////////////////////////////////
	/////////////////////////////////////////////////////////////////////////////////////////////////////////////
	/////////////////////////////////////////////////////////////////////////////////////////////////////////////
	
	
	
	doc.showMessage(showMessage);
	
	
	
	/////////////////////////////////////////////////////////////////////////////////////////////////////////////
	/////////////////////////////////////////////////////////////////////////////////////////////////////////////
	/////////////////////////////////////////////////////////////////////////////////////////////////////////////
	
	
	
	// Common functions
	function findLayerByName(o,n) {
		if (o.count() > 0) {
			for (var i = 0; i < o.count(); i++) {
				var layer = [o objectAtIndex: i];
				if ([layer name] == n) return layer;
			}
		} else return false;
	}
	
	function getTextStyleByName(name) {
		var textStyles = doc.documentData().layerTextStyles();
	
		if (textStyles) {
			for (var i = 0; i < textStyles.objects().count(); i++) {
				if (textStyles.objects().objectAtIndex(i).name() == name) {
					return textStyles.objects().objectAtIndex(i);
				}
			}
		}
		
		return null;
	}
	
	function getLayerStyleByName(name) {
		var layerStyles = doc.documentData().layerStyles();
	
		if (layerStyles) {
			for (var i = 0; i < layerStyles.objects().count(); i++) {
				if (layerStyles.objects().objectAtIndex(i).name() == name) {
					return layerStyles.objects().objectAtIndex(i);
				}
			}
		}
		
		return null;
	}
};