@import 'lib/sandbox.js'
@import 'lib/functions.js'

var com = {};

com.sncr = {
    baseDensity: 0,
    artboardPadX: 400,
    artboardPadY: 300,
    boundSliceWidth: 7900,
    boundSliceHeight: 4420,
    document: undefined,

	showSettingsDialog: function() {
        var folders = helpers.readPluginPath(),
            settingsInput = COSAlertWindow.new(),
            densityScales = ['@1x', '@2x', '@3x'],
            densityScale,
            askForPrefix,
            artboardPadX,
            artboardPadY,
            boundSliceWidth,
            boundSliceHeight,
            settings
        ;

        // Load previous settings
        settings = this.readConfig();
        densityScale = [settings valueForKey:@"density-scale"];
        askForPrefix = [settings valueForKey:@"ask-for-prefix"];
        artboardPadX = [settings valueForKey:@"artboard-padding-x"];
        artboardPadY = [settings valueForKey:@"artboard-padding-y"];
        boundSliceWidth = [settings valueForKey:@"bound-slice-width"];;
        boundSliceHeight = [settings valueForKey:@"bound-slice-height"];

        [settingsInput setMessageText:@'Layout & Wireframe Settings'];

        [settingsInput addAccessoryView: helpers.createSelect(densityScales, densityScale)];
        [settingsInput addAccessoryView: helpers.createCheckbox({name:'Ask for prefix on export', value:'1'}, askForPrefix)];

        [settingsInput addAccessoryView: helpers.createLabel("Artboard horizontal padding:", NSMakeRect(0,85,300,20))];
        [settingsInput addAccessoryView: helpers.createField(artboardPadX)];

        [settingsInput addAccessoryView: helpers.createLabel("Artboard vertical padding:", NSMakeRect(0,85,300,20))];
        [settingsInput addAccessoryView: helpers.createField(artboardPadY)];

        [settingsInput addAccessoryView: helpers.createLabel("Minimum bounds width:", NSMakeRect(0,85,300,20))];
        [settingsInput addAccessoryView: helpers.createField(boundSliceWidth)];

        [settingsInput addAccessoryView: helpers.createLabel("Minimum bounds height:", NSMakeRect(0,85,300,20))];
        [settingsInput addAccessoryView: helpers.createField(boundSliceHeight)];

        //[settingsInput addButtonWithTitle:@'Save'];
        [settingsInput addButtonWithTitle:@'Cancel'];

        var responseCode = settingsInput.runModal();

        if (1000 == responseCode) {
            densityScale = [[settingsInput viewAtIndex:0] indexOfSelectedItem];
            askForPrefix = [[settingsInput viewAtIndex:1] state];
            artboardPadX = [[settingsInput viewAtIndex:3] stringValue];
            artboardPadY = [[settingsInput viewAtIndex:5] stringValue];
            boundSliceWidth = [[settingsInput viewAtIndex:7] stringValue];
            boundSliceHeight = [[settingsInput viewAtIndex:9] stringValue];

            helpers.saveJsonToFile([NSDictionary dictionaryWithObjectsAndKeys:densityScale, @"density-scale", askForPrefix, @"ask-for-prefix", artboardPadX, @"artboard-padding-x", artboardPadY, @"artboard-padding-y", boundSliceWidth, @"bound-slice-width", boundSliceHeight, @"bound-slice-height", nil], folders.sketchPluginsPath + folders.pluginFolder + '/config.json');
        }

        return this.readConfig();
    },

    readConfig: function() {
        var folders = helpers.readPluginPath();
        return helpers.jsonFromFile(folders.sketchPluginsPath + folders.pluginFolder + '/config.json', true);
    }
}

var onRun = function(context) {
    var document = context.document;
    var selection = context.selection;

    var home_folder = "/Users/" + NSUserName();

    new AppSandbox().authorize(home_folder, function() {
        com.sncr.context = context;
        com.sncr.document = document;
        com.sncr.showSettingsDialog();
    });
};
