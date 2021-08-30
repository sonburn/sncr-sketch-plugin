var onRun = function(context) {
	const sketch = require('sketch')
	const document = sketch.getSelectedDocument()

	const fileManager = NSFileManager.defaultManager()

	let manifestName = 'manifest.json'
	let manifestPath = document.path.replace(document.sketchObject.displayName(),manifestName)
	manifestPath = manifestPath.replaceAll('%20',' ')
	let manifestData = {}

	if (fileManager.fileExistsAtPath(manifestPath)) {
		manifestData = NSString.stringWithContentsOfFile_encoding_error(manifestPath,NSUTF8StringEncoding,null)
		manifestData = JSON.parse(manifestData)
	} else {
		sketch.UI.alert(`Audit Manifest`,`A manifest could not be found for the current document.`)

		return
	}

	let missingStringObjects = []
	let missingStringOverrides = []
	let updateCount = 0

	if (manifestData.strings) {
		manifestData.strings.forEach(string => {
			let objectIDs = string.stringObjectID.split('+')

			let layer = document.getLayerWithID(objectIDs[0])

			if (!layer) missingStringObjects.push(string)

			if (layer && layer.type == 'SymbolInstance') {
				let override = layer.overrides.find(o => o.id == objectIDs[1])

				if (!override) {
					let overrideList = []
					let overrideProp = string.stringObjectID.split('_')[1]
					let overrides = layer.overrides.filter(o => o.editable && o.property == overrideProp)

					overrides.forEach(o => overrideList.push(o.id))

					let parent = layer.getParentArtboard()

					document.centerOnLayer(parent)

					sketch.UI.getInputFromUser(
						`The symbol instance ${layer.name} has an orphaned manifest string. Select a new string for "${string.stringExample}" (${objectIDs[1]}) from the list below.`,
						{
							type: sketch.UI.INPUT_TYPE.selection,
							possibleValues: overrideList
						},
						(err,val) => {
							if (err) {
								missingStringOverrides.push(string)

								return
							}

							if (val) {
								string.stringObjectID = `${layer.id}+${val}`

								updateCount++

								return
							}
						}
					)
				}
			}
		})
	}

	if (updateCount) {
		manifestData = JSON.stringify(manifestData)
		manifestData = NSString.stringWithFormat('%@',manifestData)
		manifestData.dataUsingEncoding_(NSUTF8StringEncoding).writeToFile_atomically_(manifestPath,true)
	}

	let messageStringObjects = (missingStringObjects) ? `${missingStringObjects.length} string layers` : ``
	let messageStringOverrides = (missingStringOverrides) ? `, ${missingStringOverrides.length} string layer overrides` : ``
	let messageStringUpdates = (updateCount) ? `, ${updateCount} strings updated` : ``

	sketch.UI.message(`Manifest Audit: missing ${messageStringObjects}${messageStringOverrides}${messageStringUpdates}`)

	console.log(`Manifest Audit:`,`missingStringObjects`,missingStringObjects)
	console.log(`Manifest Audit:`,`missingStringOverrides`,missingStringOverrides)
}
