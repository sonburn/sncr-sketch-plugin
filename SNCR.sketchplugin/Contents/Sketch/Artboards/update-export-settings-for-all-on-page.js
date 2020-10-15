@import '../library.js';

var onRun = function(context) {
	var document = context.document;
	var count = 0;

	document.currentPage().artboards().forEach(updateExportSettings);

	function updateExportSettings(artboard) {
		var updated = false;

		if (artboard.exportOptions().layerOptions() != 2) {
			artboard.exportOptions().setLayerOptions(2);

			updated = true;
		}

		if (!artboard.exportOptions().exportFormats().length) {
			var format = artboard.exportOptions().addExportFormat();

			format.setScale(2);
			format.setFileFormat('png');

			updated = true;
		}

		if (updated) {
			log(`Export settings were updated for ${artboard.name()}`);

			count++;
		}
	}

	document.reloadInspector();

	var message = 'No artboards need updating';

	if (count !== 0) {
		message = count + ' artboards were updated';
	}

	sketch.UI.message(message);
}
