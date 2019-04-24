@import '../library.js';

const document = sketch.getSelectedDocument();
const selection = document.selectedLayers;

var onRun = function(context) {
	if (selection.length != 1) {
		sketch.UI.alert('Replace Text Override for Instances of Selected','Select one symbol instance');
		return false;
	}

	var instance = selection.layers[0];
	var instanceOverrides = getInstanceOverrides(instance);
	var masterInstances = instance.master.getAllInstances();

	var alert = NSAlert.alloc().init();

	alert.setMessageText('Replace Text Override for Instances of Selected');
	alert.icon = getPluginAlertIcon();

	var alertContent = NSView.alloc().init();

	alertContent.setFlipped(true);

	var instanceLabel = createAlertLabelBold(instance.master.name + ' has ' + masterInstances.length + ' instance(s)',NSMakeRect(0,0,alertWidth,alertLabelHeight));

	alertContent.addSubview(instanceLabel);

	var overrideSelectLabel = createAlertLabel('Text override to replace:',NSMakeRect(0,getMaxYOfView(alertContent,alertItemPadding),alertWidth,alertLabelHeight));

	alertContent.addSubview(overrideSelectLabel);

	var overrideSelect = createAlertSelect(instanceOverrides.valueForKey('affectedLayer').valueForKey('name'),0,NSMakeRect(0,getMaxYOfView(alertContent),alertWidth,alertSelectHeight));

	alertContent.addSubview(overrideSelect);

	var overrideValueLabel = createAlertLabel('New override value:',NSMakeRect(0,getMaxYOfView(alertContent,alertItemPadding),alertWidth,alertLabelHeight));

	alertContent.addSubview(overrideValueLabel);

	var overrideValue = createAlertField('',NSMakeRect(0,getMaxYOfView(alertContent),alertWidth,alertFieldHeight));

	alertContent.addSubview(overrideValue);

	alertContent.setFrame(NSMakeRect(0,0,alertWidth,getMaxYOfView(alertContent)));

	alert.setAccessoryView(alertContent);

	var submit = alert.addButtonWithTitle('OK');
	var cancel = alert.addButtonWithTitle('Cancel');

	setKeyOrder(alert,[
		overrideSelect,
		overrideValue,
		submit
	]);

	var responseCode = alert.runModal();

	if (responseCode == 1000) {
		let override = instanceOverrides[overrideSelect.indexOfSelectedItem()];
		let value = overrideValue.stringValue();

		masterInstances.forEach(instance => instance.setOverrideValue(override,value));

		document.sketchObject.reloadInspector();

		sketch.UI.message(masterInstances.length + ' symbol instances have been updated');
	} else return false;

	function getInstanceOverrides(instance) {
		let overrides = NSMutableArray.array();

		instance.sketchObject.availableOverrides().forEach(function(override){
			if (override.isEditable() && override.affectedLayer().class() == 'MSImmutableTextLayer') overrides.addObject(override);
		});

		return overrides.reverseObjectEnumerator().allObjects();
	}
}
