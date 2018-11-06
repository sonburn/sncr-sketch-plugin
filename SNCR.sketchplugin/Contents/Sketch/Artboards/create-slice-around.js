@import '../library.js';

var document = MSDocument.currentDocument();
var page = document.currentPage();

var defaultSettings = {};
defaultSettings.sliceType = 1;
defaultSettings.sliceMargin = '100';
defaultSettings.exportScales = ['.5x','1x','2x','3x'];
defaultSettings.exportScale = 0;
defaultSettings.exportFormats = ['JPG','PDF','PNG'];
defaultSettings.exportFormat = 1;

var sliceAll = function(context) {
	var artboards = page.artboards();

	createSlice(artboards,0);
}

var sliceSelected = function(context) {
	var selection = context.selection;

	if (!selection.length) {
		sketch.UI.alert('Create Slice Around Selected…','Select at least one artboard.');
		return false;
	}

	createSlice(selection,1);
}

function createSlice(scope,type) {
	var sliceName = (type == 0) ? 'Artboards' : 'Selections';
	var sliceScope = (type == 0) ? 'all' : 'selected';
	var sliceSettings = getSliceSettings();

	if (!sliceSettings) return false;

	var selectionSize = getSelectionSize(scope);

	var sliceLayer = MSSliceLayer.new();
	sliceLayer.setName(sliceName);
	sliceLayer.setBackgroundColor(MSColor.colorWithRed_green_blue_alpha(239/255,239/255,239/255,1.0));
	sliceLayer.frame().setX(selectionSize.minX - sliceSettings.sliceMargin);
	sliceLayer.frame().setY(selectionSize.minY - sliceSettings.sliceMargin);
	sliceLayer.frame().setWidth(selectionSize.width + (sliceSettings.sliceMargin * 2));
	sliceLayer.frame().setHeight(selectionSize.height + (sliceSettings.sliceMargin * 2));

	var sliceExport = sliceLayer.exportOptions().addExportFormat();
	sliceExport.setScale(defaultSettings.exportScales[sliceSettings.exportScale].slice(0,-1));
	sliceExport.setFileFormat(defaultSettings.exportFormats[sliceSettings.exportFormat].toLowerCase());

	page.addLayers([sliceLayer]);

	MSLayerMovement.moveToBack([sliceLayer]);

	sketch.UI.message('Slice created around ' + sliceScope + ' artboards');
}

function getSliceSettings() {
	var userSettings = getDocumentSettings(defaultSettings);

	var alert = NSAlert.alloc().init();
	alert.setMessageText('Create Artboard Slice…');
	alert.icon = getPluginAlertIcon();

	var alertContent = NSView.alloc().init();
	alertContent.setFlipped(true);

	var sliceMarginLabel = createAlertLabel('Slice margin:',NSMakeRect(0,0,alertWidth,alertLabelHeight));
	alertContent.addSubview(sliceMarginLabel);

	var sliceMarginValue = createAlertField(userSettings.sliceMargin,NSMakeRect(0,getMaxYOfView(alertContent),60,alertFieldHeight));
	alertContent.addSubview(sliceMarginValue);

	var exportScaleLabel = createAlertLabel('Export scale:',NSMakeRect(0,getMaxYOfView(alertContent,alertItemPadding),alertWidth,alertLabelHeight));
	alertContent.addSubview(exportScaleLabel);

	var exportScaleSelect = createAlertSelect(userSettings.exportScales,userSettings.exportScale,NSMakeRect(0,getMaxYOfView(alertContent),100,alertSelectHeight));
	alertContent.addSubview(exportScaleSelect);

	var exportFormatLabel = createAlertLabel('Export format:',NSMakeRect(0,getMaxYOfView(alertContent,alertItemPadding),alertWidth,alertLabelHeight));
	alertContent.addSubview(exportFormatLabel);

	var exportFormatSelect = createAlertSelect(userSettings.exportFormats,userSettings.exportFormat,NSMakeRect(0,getMaxYOfView(alertContent),100,alertSelectHeight));
	alertContent.addSubview(exportFormatSelect);

	alertContent.setFrame(NSMakeRect(0,0,alertWidth,getMaxYOfView(alertContent)));

	alert.setAccessoryView(alertContent);

	var submit = alert.addButtonWithTitle('OK');
	var cancel = alert.addButtonWithTitle('Cancel');

	var reset = alert.addButtonWithTitle('Defaults');
	reset.setAction('callAction:');
	reset.setCOSJSTargetFunction(function() {
		sliceMarginValue.setStringValue(defaultSettings.sliceMargin);
		exportScaleSelect.selectItemAtIndex(defaultSettings.exportScale);
		exportFormatSelect.selectItemAtIndex(defaultSettings.exportFormat);
	});

	setKeyOrder(alert,[
		sliceMarginValue,
		exportScaleSelect,
		exportFormatSelect,
		submit
	]);

	var responseCode = alert.runModal();

	if (responseCode == 1000) {
		var sliceSettings = {};
		sliceSettings.sliceMargin = sliceMarginValue.stringValue();
		sliceSettings.exportScale = exportScaleSelect.indexOfSelectedItem();
		sliceSettings.exportFormat = exportFormatSelect.indexOfSelectedItem();

		setDocumentSettings(sliceSettings);

		return sliceSettings;
	} else return false;
}
