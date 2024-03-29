@import 'delegate.js';

// Shared variables
var sketch = require('sketch');

// Alert window variables
var alertWidth = 300;
var alertItemPadding = 8;
var alertFieldHeight = 22;
var alertLabelHeight = 20;
var alertSelectHeight = 26;

function createAlertField(value,frame) {
	var textField = NSTextField.alloc().initWithFrame(frame);

	textField.setStringValue(value);
	textField.setFont(NSFont.systemFontOfSize(13));
	textField.setBezeled(true);

	return textField;
}

function createAlertLabel(text,frame) {
	var textField = NSTextField.alloc().initWithFrame(frame);

	textField.setStringValue(text);
	textField.setFont(NSFont.systemFontOfSize(12));
	textField.setBezeled(false);
	textField.setDrawsBackground(false);
	textField.setEditable(false);
	textField.setSelectable(false);

	return textField;
}

function createAlertLabelBold(text,frame) {
	var textField = NSTextField.alloc().initWithFrame(frame);

	textField.setStringValue(text);
	textField.setFont(NSFont.boldSystemFontOfSize(12))
	textField.setBezeled(false);
	textField.setDrawsBackground(false);
	textField.setEditable(false);
	textField.setSelectable(false);

	return textField;
}

function createAlertPopupButton(items,select,frame) {
	var button = NSPopUpButton.alloc().initWithFrame(frame);

	button.addItemsWithTitles(items);
	button.selectItemAtIndex(select);
	//button.setFont(NSFont.systemFontOfSize(12));

	return button;
}

function createAlertRadios(options,selected,format,x,y) {
	var rows = options.length;
	var columns = 1;
	var buttonMatrixWidth = alertWidth;
	var buttonCellWidth = buttonMatrixWidth;
	var x = (x) ? x : 0;
	var y = (y) ? y : 0;

	if (format && format != 0) {
		rows = options.length / 2;
		columns = 2;
		buttonCellWidth = buttonMatrixWidth / columns;
	}

	var buttonCell = NSButtonCell.alloc().init();

	buttonCell.setButtonType(NSRadioButton);

	var buttonMatrix = NSMatrix.alloc().initWithFrame_mode_prototype_numberOfRows_numberOfColumns(
		NSMakeRect(x,y,buttonMatrixWidth,rows * 20),
		NSRadioModeMatrix,
		buttonCell,
		rows,
		columns
	);

	buttonMatrix.setCellSize(NSMakeSize(buttonCellWidth,20));

	for (i = 0; i < options.length; i++) {
		buttonMatrix.cells().objectAtIndex(i).setTitle(options[i]);
		buttonMatrix.cells().objectAtIndex(i).setTag(i);
	}

	buttonMatrix.selectCellAtRow_column(selected,0);

	return buttonMatrix;
}

function createAlertSelect(items,select,frame) {
	var comboBox = NSComboBox.alloc().initWithFrame(frame);
	var select = (select > -1) ? select : 0;

	comboBox.addItemsWithObjectValues(items);
	comboBox.selectItemAtIndex(select);
	comboBox.setNumberOfVisibleItems(16);
	comboBox.setCompletes(1);

	return comboBox;
}

function createAlertWindow(context,name,text) {
	var alertWindow = COSAlertWindow.new();

	var iconPath = context.plugin.urlForResourceNamed('icon.png').path();
	var icon = NSImage.alloc().initByReferencingFile(iconPath);

	alertWindow.setIcon(icon);
	alertWindow.setMessageText(name);

	if (text) { alertWindow.setInformativeText(text); }

	return alertWindow;
}

function getDocumentSettings(settings) {
	var document = sketch.getSelectedDocument();
	var settings = Object.assign({},settings);

	for (key in settings) {
		var value = sketch.Settings.documentSettingForKey(document,key);

		if (value != null) settings[key] = value;
	}

	return settings;
}

function getMaxYOfView(view,add) {
	var add = (add) ? add : 0;

	return CGRectGetMaxY(view.subviews().lastObject().frame()) + add;
}

function getPluginAlertIcon() {
	if (__command.pluginBundle() && __command.pluginBundle().alertIcon()) {
		return __command.pluginBundle().alertIcon();
	}

	return NSImage.imageNamed('plugins');
}

function getSelectionSize(selections) {
	let minX, minY, maxX, maxY

	minX = minY = Number.MAX_VALUE
	maxX = maxY = -0xFFFFFFFF

	selections.forEach(selection => {
		let rect = selection.rect()

		minX = Math.min(minX,CGRectGetMinX(rect))
		minY = Math.min(minY,CGRectGetMinY(rect))
		maxX = Math.max(maxX,CGRectGetMaxX(rect))
		maxY = Math.max(maxY,CGRectGetMaxY(rect))
	})

	return {
		width: maxX - minX,
		height: maxY - minY,
		minX: minX,
		minY: minY
	}
}

function performAction(action) {
	var controller = document.sketchObject.actionsController();

	controller.actionForID(action).doPerformAction(nil);
}

function setDocumentSettings(settings) {
	var document = sketch.getSelectedDocument();

	for (key in settings) {
		sketch.Settings.setDocumentSettingForKey(document,key,settings[key]);
	}
}

function setKeyOrder(alert,order) {
	for (var i = 0; i < order.length; i++) {
		var thisItem = order[i];
		var nextItem = order[i+1];

		if (nextItem) thisItem.setNextKeyView(nextItem);
	}

	alert.window().setInitialFirstResponder(order[0]);
}
