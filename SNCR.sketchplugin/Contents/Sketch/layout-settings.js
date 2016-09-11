@import 'lib/sandbox.js';
@import 'lib/functions.js';

var com = {};

com.sncr = {
	showSettingsDialog: function() {
		var folders = helpers.readPluginPath();
		var densityScales = ['1x','2x','3x'];
		var densityScale;
		var artboardPadX;
		var artboardPadY;
		var boundSliceWidth;
		var boundSliceHeight;

		// Load previous settings
		var settings = this.readConfig();
		densityScale = [settings valueForKey:@'density-scale'];
		artboardPadX = [settings valueForKey:@'artboard-padding-x'];
		artboardPadY = [settings valueForKey:@'artboard-padding-y'];
		boundSliceWidth = [settings valueForKey:@'bound-slice-width'];;
		boundSliceHeight = [settings valueForKey:@'bound-slice-height'];

		var alertWindow = COSAlertWindow.new();

		[alertWindow setMessageText:@'Layout & Wireframe Settings'];

		[alertWindow addTextLabelWithValue:@'Default slice density:'];
		[alertWindow addAccessoryView: helpers.createSelect(densityScales,densityScale,NSMakeRect(0,0,75,25))];

		[alertWindow addTextLabelWithValue:@'Artboard horizontal padding:'];
		[alertWindow addAccessoryView: helpers.createField(artboardPadX)];

		[alertWindow addTextLabelWithValue:@'Artboard vertical padding:'];
		[alertWindow addAccessoryView: helpers.createField(artboardPadY)];

		[alertWindow addTextLabelWithValue:@'Minimum bounds width:'];
		[alertWindow addAccessoryView: helpers.createField(boundSliceWidth)];

		[alertWindow addTextLabelWithValue:@'Minimum bounds height:'];
		[alertWindow addAccessoryView: helpers.createField(boundSliceHeight)];

		//[alertWindow addButtonWithTitle:@'Save'];
		[alertWindow addButtonWithTitle:@'Cancel'];

		var responseCode = alertWindow.runModal();

		if (1000 == responseCode) {
			// densityScale = [[alertWindow viewAtIndex:0] indexOfSelectedItem];
			// askForPrefix = [[alertWindow viewAtIndex:1] state];
			// artboardPadX = [[alertWindow viewAtIndex:3] stringValue];
			// artboardPadY = [[alertWindow viewAtIndex:5] stringValue];
			// boundSliceWidth = [[alertWindow viewAtIndex:7] stringValue];
			// boundSliceHeight = [[alertWindow viewAtIndex:9] stringValue];
			//
			// helpers.saveJsonToFile([NSDictionary dictionaryWithObjectsAndKeys:densityScale, @"density-scale", askForPrefix, @"ask-for-prefix", artboardPadX, @"artboard-padding-x", artboardPadY, @"artboard-padding-y", boundSliceWidth, @"bound-slice-width", boundSliceHeight, @"bound-slice-height", nil], folders.sketchPluginsPath + folders.pluginFolder + '/config.json');
		}

		return this.readConfig();
	},

	readConfig: function() {
		var folders = helpers.readPluginPath();
		return helpers.jsonFromFile(folders.sketchPluginsPath + folders.pluginFolder + '/config.json', true);
	}
}

var onRun = function(context) {
	var doc = context.document;
	var selection = context.selection;

	var home = "/Users/" + NSUserName();

	new AppSandbox().authorize(home, function() {
		com.sncr.context = context;
		com.sncr.document = doc;
		com.sncr.showSettingsDialog();
	});
};
