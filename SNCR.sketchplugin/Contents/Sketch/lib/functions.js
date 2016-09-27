var writeTextToFile = function(text, filePath) {
	var t = [NSString stringWithFormat:@"%@", text],
	f = [NSString stringWithFormat:@"%@", filePath];
	return [t writeToFile:f atomically:true encoding:NSUTF8StringEncoding error:nil];
}

var readTextFromFile = function(filePath) {
	var fileManager = [NSFileManager defaultManager];
	if([fileManager fileExistsAtPath:filePath]) {
		return [NSString stringWithContentsOfFile:filePath encoding:NSUTF8StringEncoding error:nil];
	}
	return nil;
}

var jsonFromFile = function(filePath, mutable) {
	var data = [NSData dataWithContentsOfFile:filePath];
	var options = mutable == true ? NSJSONReadingMutableContainers : 0
	return [NSJSONSerialization JSONObjectWithData:data options:options error:nil];
}

var saveJsonToFile = function(jsonObj, filePath) {
	writeTextToFile(stringify(jsonObj), filePath);
}

var stringify = function(obj, prettyPrinted) {
	var prettySetting = prettyPrinted ? NSJSONWritingPrettyPrinted : 0,
	jsonData = [NSJSONSerialization dataWithJSONObject:obj options:prettySetting error:nil];
	return [[NSString alloc] initWithData:jsonData encoding:NSUTF8StringEncoding];
}

var createTempFolderNamed = function(name) {
	var tempPath = getTempFolderPath(name);
	createFolderAtPath(tempPath);
	return tempPath;
}

var getTempFolderPath = function(withName) {
	var fileManager = [NSFileManager defaultManager],
	cachesURL = [[fileManager URLsForDirectory:NSCachesDirectory inDomains:NSUserDomainMask] lastObject],
	withName = (typeof withName !== 'undefined') ? withName : (Date.now() / 1000),
	folderName = [NSString stringWithFormat:"%@", withName];
	return [[cachesURL URLByAppendingPathComponent:folderName] path];
}

var createFolderAtPath = function(pathString) {
	var fileManager = [NSFileManager defaultManager];
	if([fileManager fileExistsAtPath:pathString]) return true;
	return [fileManager createDirectoryAtPath:pathString withIntermediateDirectories:true attributes:nil error:nil];
}

var removeFileOrFolder = function(filePath) {
	[[NSFileManager defaultManager] removeItemAtPath:filePath error:nil];
}

var readPluginPath = function() {
	var sketchPluginsPath = com.sncr.context.scriptPath.replace(/Sketch([\w \/ -])*.js$/, "");
	return {
		sketchPluginsPath: sketchPluginsPath,
		pluginFolder: 'Resources'
	}
}

var openInFinder = function(path) {
	var finderTask = [[NSTask alloc] init],
		openFinderArgs = [NSArray arrayWithObjects:"-R", path, nil];

	[finderTask setLaunchPath:"/usr/bin/open"];
	[finderTask setArguments:openFinderArgs];
	[finderTask launch];
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

var createSelect = function(items,selectedItemIndex,frame) {
	selectedItemIndex = (selectedItemIndex > -1) ? selectedItemIndex : 0;
	var comboBox = [[NSComboBox alloc] initWithFrame:frame];
	[comboBox addItemsWithObjectValues:items];
	[comboBox selectItemAtIndex:selectedItemIndex];

	return comboBox;
}

var createField = function(value) {
	var field = [[NSTextField alloc] initWithFrame:NSMakeRect(0, 0, 100, 20)];
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

var helpers = {
	readTextFromFile: readTextFromFile,
	writeTextToFile: writeTextToFile,
	jsonFromFile: jsonFromFile,
	saveJsonToFile: saveJsonToFile,
	createFolderAtPath: createFolderAtPath,
	removeFileOrFolder: removeFileOrFolder,
	readPluginPath: readPluginPath,
	openInFinder: openInFinder,
	createSelect: createSelect,
	createCheckbox: createCheckbox,
	createField: createField,
	createLabel: createLabel
}

function actionWithType(type,context) {
	var doc = context.document;
	var controller = doc.actionsController();

	if (controller.actionWithName) {
		return controller.actionWithName(type);
	} else if (controller.actionWithID) {
		return controller.actionWithID(type);
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
	var app = NSApplication.sharedApplication();
	app.displayDialog_withTitle(body,title);
}
