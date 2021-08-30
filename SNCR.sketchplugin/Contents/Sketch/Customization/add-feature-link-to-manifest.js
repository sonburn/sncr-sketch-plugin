var onRun = function(context) {
	const sketch = require('sketch')
	const document = sketch.getSelectedDocument()
	const selections = document.selectedLayers.layers

	if (!selections.length) {
		sketch.UI.alert(`Add Feature Link to Manifest`,`Something must be selected.`)

		return
	}

	var fileManager = NSFileManager.defaultManager()

	var manifestName = 'manifest.json'
	var manifestPath = document.path.replace(document.sketchObject.displayName(),manifestName)
	manifestPath = manifestPath.replaceAll('%20',' ')
	var manifestData = {}
	var manifestExists = false

	if (fileManager.fileExistsAtPath(manifestPath)) {
		manifestData = NSString.stringWithContentsOfFile_encoding_error(manifestPath,NSUTF8StringEncoding,null)
		manifestData = JSON.parse(manifestData)
		manifestExists = true
	}

	var displayList = ['Select one…']
	var featureList = [
		{
			"key" : "appleAuth",
			"name" : "Apple Authentication"
		},
		{
			"key" : "backupEnabled",
			"name" : "Backup & Restore"
		},
		{
			"key" : "googleAuth",
			"name" : "Google Authentication"
		},
		{
			"key" : "manageStorage",
			"name" : "Manage Storage"
		},
		{
			"key" : "photoPrint",
			"name" : "Photo Printing"
		},
		{
			"key" : "tagSearch",
			"name" : "Tag & Search"
		}
	]

	featureList.forEach(f => displayList.push(f.name))

	if (!manifestData.featureLayers) manifestData.featureLayers = {}

	let addCount = 0
	let skipCount = 0

	let selectedFeature
	let selectionText = (selections.length == 1) ? `selection` : `${selections.length} selections`

	sketch.UI.getInputFromUser(
		`Which feature should the ${selectionText} be linked to?`,
		{
			type: sketch.UI.INPUT_TYPE.selection,
			possibleValues: displayList
		},
		(err,val) => {
			if (err || val == displayList[0]) {
				// most likely the user canceled the input
				return
			}

			if (val) {
				selectedFeature = featureList.find(f => f.name == val)
			}
		}
	)

	let manifestObject = manifestData.featureLayers[selectedFeature.key]

	if (!manifestObject) {
		manifestData.featureLayers[selectedFeature.key] = []
		manifestObject = manifestData.featureLayers[selectedFeature.key]
	}

	selections.forEach(selection => {
		let layerToAdd = selection.id

		if (selection.type == 'SymbolInstance') {
			let selectedOverride = selection.overrides.find(o => o.selected)

			if (selectedOverride) {
				layerToAdd = `${layerToAdd}+${selectedOverride.id}`
			}
		}

		if (layerToAdd && !manifestObject.includes(layerToAdd)) {
			manifestObject.push(layerToAdd)
			addCount++
		} else {
			skipCount++
		}
	})

	if (selectedFeature && manifestObject) {
		manifestData = JSON.stringify(manifestData)
		manifestData = NSString.stringWithFormat('%@',manifestData)

		if (!fileManager.fileExistsAtPath(manifestPath)) {
			fileManager.createDirectoryAtPath_withIntermediateDirectories_attributes_error(manifestPath.replace(manifestName,''),true,null,null)
		}

		if (addCount) manifestData.dataUsingEncoding_(NSUTF8StringEncoding).writeToFile_atomically_(manifestPath,true)

		let messageType = (manifestExists) ? 'updated' : 'created'
		let messageAdd = (addCount == 1) ? `${addCount} layer linked` : `${addCount} layers linked`
		let messageSkip = (skipCount) ? `, ${skipCount} layers skipped (already existed)` : ''

		sketch.UI.message(`Manifest ${messageType}: ${messageAdd}${messageSkip} to ${selectedFeature.name}`)
	}
}
