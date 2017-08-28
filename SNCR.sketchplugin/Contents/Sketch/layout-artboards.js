@import 'lib/functions.js';
@import 'section-titles.js';
@import 'artboard-titles.js';
@import 'artboard-descriptions.js';
@import 'artboard-annotations.js';

var pluginDomain = "com.sncr.sketch";

var strArtboardPrecludeKey = "layoutArtboards";
var strArtboardIncludePrefix = "🔹 ";

var strArtboardPrecludePluginName = "Preclude Selected Artboards";
var strArtboardPrecludeProblem = "Select artboard(s) to mark as precluded from Layout Artboards.";
var strArtboardPrecludeComplete = " is now precluded from Layout Artboards";
var strArtboardPrecludesComplete = " artboards are now precluded from Layout Artboards";

var strPagePrecludeComplete = " will no longer auto-layout with Layout Artboards";

var strArtboardIncludePluginName = "Include Selected Artboards";
var strArtboardIncludeProblem = "Select artboard(s) to mark as included in Layout Artboards.";
var strArtboardIncludeComplete = " is now included in Layout Artboards";
var strArtboardIncludesComplete = " artboards are now included in Layout Artboards";

var strPageIncludeComplete = " will now auto-layout with Layout Artboards";

var strArtboardLayoutPluginName = "Layout Artboards";
var strArtboardLayoutProblem = "There are no artboards to layout.";
var strArtboardLayoutComplete = "Artboard layout complete";

var strProblemFetchingSettings = "Unable to fetch settings";

var include = function(context) {
	com.sncr.layoutArtboards.include(context);
}

var includePage = function(context) {
	com.sncr.layoutArtboards.includePage(context);
}

var preclude = function(context) {
	com.sncr.layoutArtboards.preclude(context);
}

var precludePage = function(context) {
	com.sncr.layoutArtboards.precludePage(context);
}

var settings = function(context) {
	com.sncr.layoutArtboards.settings(context);
}

var update = function(context) {
	com.sncr.layoutArtboards.update(context);
}

com.sncr.layoutArtboards = {
	include: function(context) {
		var doc = context.document;
		var selection = context.selection;

		var count = 0;

		if (selection.count()) {
			for (var i = 0; i < selection.count(); i++) {
				if (selection[i] instanceof MSArtboardGroup) {
					context.command.setValue_forKey_onLayer(nil,strArtboardPrecludeKey,selection[i]);

					selection[i].select_byExpandingSelection(false,true);

					count++;

					log(selection[i].name() + strArtboardIncludeComplete);
				}
			}

			if (selection.count() == 1) {
				doc.showMessage(selection[0].name() + strArtboardIncludeComplete);
			} else {
				doc.showMessage(count + strArtboardIncludesComplete);
			}
		} else {
			displayDialog(strArtboardIncludePluginName,strArtboardIncludeProblem);
		}
	},
	includePage: function(context,feedback) {
		var doc = context.document;
		var page = doc.currentPage();

		context.command.setValue_forKey_onLayer(true,strArtboardPrecludeKey,page);

		com.sncr.layoutArtboards.sanitizePages(context);

		if (!feedback) {
			doc.showMessage(page.name() + strPageIncludeComplete);
		}
	},
	preclude: function(context) {
		var doc = context.document;
		var selection = context.selection;

		var count = 0;

		if (selection.count()) {
			for (var i = 0; i < selection.count(); i++) {
				if (selection[i] instanceof MSArtboardGroup) {
					context.command.setValue_forKey_onLayer(false,strArtboardPrecludeKey,selection[i]);

					selection[i].select_byExpandingSelection(false,true);

					count++;

					log(selection[i].name() + strArtboardPrecludeComplete);
				}
			}

			if (selection.count() == 1) {
				doc.showMessage(selection[0].name() + strArtboardPrecludeComplete);
			} else {
				doc.showMessage(count + strArtboardPrecludesComplete);
			}
		} else {
			displayDialog(strArtboardPrecludePluginName,strArtboardPrecludeProblem);
		}
	},
	precludePage: function(context) {
		var doc = context.document;
		var page = doc.currentPage();

		context.command.setValue_forKey_onLayer(false,strArtboardPrecludeKey,page);

		com.sncr.layoutArtboards.sanitizePages(context);

		doc.showMessage(page.name() + strPagePrecludeComplete);
	},
	sanitizePages: function(context) {
		var doc = context.document || context.actionContext.document;

		var pageName;

		var pages = doc.pages(),
			loop = pages.objectEnumerator(),
			page;

		while (page = loop.nextObject()) {
			if (!context.command.valueForKey_onLayer(strArtboardPrecludeKey,page)) {
				context.command.setValue_forKey_onLayer(false,strArtboardPrecludeKey,page);
			} else {
				pageName = (context.command.valueForKey_onLayer(strArtboardPrecludeKey,page) == true) ? strArtboardIncludePrefix + page.name().replace(strArtboardIncludePrefix,"") : page.name().replace(strArtboardIncludePrefix,"");

				page.setName(pageName);
			}
		}
	},
	update: function(context) {
		// Document variables
		var doc = context.document || context.actionContext.document;
		var page = doc.currentPage();

		if (!context.actionContext) {
			com.sncr.layoutArtboards.includePage(context,false);
		} else {
			com.sncr.layoutArtboards.sanitizePages(context);
		}

		if (context.command.valueForKey_onLayer_forPluginIdentifier(strArtboardPrecludeKey,page,pluginDomain) != false) {
			var layoutArtboards, layoutArtboardCount;

			// Run for selections, otherwise for all artboards on page
			if (context.selection && context.selection.count() > 0) {
				// Filter selections to only select artboards
				filterSelections(context.selection);

				layoutArtboards = doc.selectedLayers().layers();
				layoutArtboardCount = doc.selectedLayers().layers().count();
			} else {
				layoutArtboards = page.artboards().filteredArrayUsingPredicate(NSPredicate.predicateWithFormat("userInfo == nil || function(userInfo,'valueForKeyPath:',%@)." + strArtboardPrecludeKey + " != " + false,pluginDomain));
				layoutArtboardCount = layoutArtboards.count();
			}

			// Run only if there are artboards
			if (layoutArtboardCount) {
				// Reset page origin
				var pageOrigin = CGPointMake(0,0);
				page.setRulerBase(pageOrigin);

				// Get layout settings
				var layoutSettings = getLayoutSettings(context);

				// Layout the artboards
				if (layoutSettings) {
					if (layoutSettings.sortOrder != 0) {
						var sortByName = [NSSortDescriptor sortDescriptorWithKey:"name" ascending:1];
						layoutArtboards = [layoutArtboards sortedArrayUsingDescriptors:[sortByName]];

						var layoutLayers = (layoutSettings.sortOrder == 2) ? [[layoutArtboards reverseObjectEnumerator] allObjects] : layoutArtboards;

						sortLayerList(layoutLayers,page);
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

					com.sncr.sectionTitles.updateAllOnPage(context);
					com.sncr.artboardTitles.create(context);
					com.sncr.artboardDescriptions.update(context);
					com.sncr.artboardAnnotations.update(context);

					// Feedback to user
					doc.showMessage(strArtboardLayoutComplete);
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

			function filterSelections(selections) {
				for (var i = 0; i < selections.count(); i++) {
					if (selections[i].class() != "MSArtboardGroup") {
						selections[i].select_byExpandingSelection(false,true);
					}
				}
			}
		}
	},
	settings: function(context) {
		// Get user settings
		var layoutSettings = getLayoutSettings(context,"config");

		// If layout settings were retrieved...
		if (layoutSettings) {
			com.sncr.layoutArtboards.run(context);
		}
	}
};

function getLayoutSettings(context,type) {
	// Context variables
	var doc = context.document || context.actionContext.document;
	var page = doc.currentPage();

	var artboardsPerRow = ['6','8','10','12','14','100'];

	// Setting variables
	var defaultSettings = {};
	defaultSettings.artboardsPerRowDefault = 2;
	defaultSettings.rowDensity = 0;
	defaultSettings.sortOrder = 0;
	defaultSettings.xPad = '400';
	defaultSettings.yPad = '600';

	// Update default settings with cached settings
	defaultSettings = getCachedSettings(context,page,defaultSettings);

	// If type is set and equal to "config", operate in config mode...
	if (type && type == "config") {
		var alertWindow = COSAlertWindow.new();
		alertWindow.setMessageText('Layout Artboards');

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

		alertWindow.addButtonWithTitle('OK');
		alertWindow.addButtonWithTitle('Cancel');

		// Set key order and first responder
		setKeyOrder(alertWindow,[
			perRow,
			rowDensity,
			sortOrder,
			xPad,
			yPad
		]);

		var responseCode = alertWindow.runModal();

		if (responseCode == 1000) {
			try {
				context.command.setValue_forKey_onLayer([[alertWindow viewAtIndex:1] indexOfSelectedItem],"artboardsPerRowDefault",page);
				context.command.setValue_forKey_onLayer([[rowDensity selectedCell] tag],"rowDensity",page);
				context.command.setValue_forKey_onLayer([[sortOrder selectedCell] tag],"sortOrder",page);
				context.command.setValue_forKey_onLayer([xPad stringValue],"xPad",page);
				context.command.setValue_forKey_onLayer([yPad stringValue],"yPad",page);
			}
			catch(err) {
				log("Unable to save settings.");
			}

			return {
				rowCount : artboardsPerRow[[[alertWindow viewAtIndex:1] indexOfSelectedItem]],
				rowDensity : [[rowDensity selectedCell] tag],
				sortOrder : [[sortOrder selectedCell] tag],
				xPad : [xPad stringValue],
				yPad : [yPad stringValue]
			}
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

function getCachedSettings(context,location,settings) {
	try {
		for (i in settings) {
			var value = context.command.valueForKey_onLayer_forPluginIdentifier(i,location,pluginDomain);
			if (value) settings[i] = value;
		}

		return settings;
	} catch(err) {
		log(strProblemFetchingSettings);
	}
}
