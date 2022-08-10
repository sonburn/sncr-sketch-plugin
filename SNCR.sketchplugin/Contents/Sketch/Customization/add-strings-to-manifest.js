var onRun = function(context) {
	const sketch = require('sketch')
	const document = sketch.getSelectedDocument()
	const selections = document.selectedLayers.layers

	if (!selections.length) {
		sketch.UI.alert(`Add Translation Text to Manifest`,`Select a text layer or symbol instance with a text override.`)
		return
	}

	var fileManager = NSFileManager.defaultManager()

	var manifestName = 'manifest.json'
	var manifestPath = document.path.replace(escape(document.sketchObject.displayName()),manifestName)
	manifestPath = manifestPath.replaceAll('%20',' ')
	var manifestData = {}
	var manifestExists = false

	if (fileManager.fileExistsAtPath(manifestPath)) {
		manifestData = NSString.stringWithContentsOfFile_encoding_error(manifestPath,NSUTF8StringEncoding,null)
		manifestData = JSON.parse(manifestData)
		manifestExists = true
	}

	if (!manifestData.strings) manifestData.strings = []

	var addCount = 0
	var matchCount = 0
	var skipCount = 0

	const addString = (platform,parentArtboard,parentGroup,stringObjectID,stringExample,stringKey,stringReplace) => {
		let string = {
			platform : platform,
			parentArtboard : parentArtboard,
			parentGroup : parentGroup,
			stringObjectID : stringObjectID,
			stringExample : stringExample,
			stringKey : stringKey
		}

		if (stringReplace) string.stringReplace = stringReplace

		manifestData.strings.push(string)

		console.log(`${stringObjectID} (${stringExample}) added to the manifest`)

		addCount++
	}

	const skipString = (stringObjectID,stringExample) => {
		console.log(`${stringObjectID} (${stringExample}) not added to the manifest (already exists)`)

		skipCount++
	}

	selections.forEach(selection => {
		if (selection.layers) {
			processGroup(selection.layers)
		} else {
			processLayer(selection)
		}
	})

	function processGroup(layers,loop) {
		if (!loop) {
			for (var i = layers.length - 1; i >= 0; i--) {
				processLayer(layers[i])
			}
		} else {
			layers.forEach(layer => processLayer(layer))
		}
	}

	function processLayer(layer) {
		if (layer.type == 'Text' || layer.type == 'SymbolInstance' && layer.overrides.filter(o => o.property === 'stringValue' && o.editable && o.value != ' ').length) {
			let parentPage = layer.sketchObject.parentPage().name()
			let parentArtboard = `${layer.sketchObject.parentArtboard().name()} (${layer.sketchObject.parentArtboard().objectID()})`
			let parentGroup = (layer.sketchObject.parentGroup()) ? `${layer.sketchObject.parentGroup().name()} (${layer.sketchObject.parentGroup().objectID()})` : ''

			let platform = ''

			if (parentPage.includes('Android') || parentArtboard.includes('Android')) {
				platform = 'android'
			} else if (parentPage.includes('iOS') || parentArtboard.includes('iPad') || parentArtboard.includes('iPhone')) {
				platform = 'ios'
			}

			let overrides = (layer.overrides) ? layer.overrides.filter(o => o.property === 'stringValue' && o.editable && o.value != ' ') : null

			if (overrides) {
				overrides.reverse().forEach(override => {
					let stringObjectID = String(layer.id + '+' + override.id)
					let stringExample = override.value
					let stringKey = ''
					let stringReplace

					let stringEntry = manifestData.strings.find(s => s.stringObjectID == stringObjectID)

					if (!stringEntry) {
						if (platform != '') {
							let stringMatch = manifestData.strings.find(s => s.platform == platform && s.stringObjectID.includes(override.id) && s.stringExample == stringExample)

							if (stringMatch && stringMatch.stringKey) {
								stringKey = stringMatch.stringKey

								if (stringMatch.stringReplace) stringReplace = stringMatch.stringReplace

								matchCount++
							}
						}

						addString(platform,parentArtboard,parentGroup,stringObjectID,stringExample,stringKey,stringReplace)
					} else {
						stringEntry.platform = platform
						stringEntry.parentArtboard = parentArtboard
						stringEntry.parentGroup = parentGroup
						stringEntry.stringExample = stringExample

						skipString(stringObjectID,stringExample)
					}
				})
			} else {
				let stringObjectID = String(layer.id)
				let stringExample = layer.text
				let stringKey = ''

				let stringEntry = manifestData.strings.find(s => s.stringObjectID == stringObjectID)

				if (!stringEntry) {
					addString(platform,parentArtboard,parentGroup,stringObjectID,stringExample,stringKey)
				} else {
					stringEntry.platform = platform
					stringEntry.parentArtboard = parentArtboard
					stringEntry.parentGroup = parentGroup
					stringEntry.stringExample = stringExample

					skipString(stringObjectID,stringExample)
				}
			}
		}

		if (layer.layers) processGroup(layer.layers,1)
	}

	manifestData = JSON.stringify(manifestData)
	manifestData = NSString.stringWithFormat('%@',manifestData)

	if (!fileManager.fileExistsAtPath(manifestPath)) {
		fileManager.createDirectoryAtPath_withIntermediateDirectories_attributes_error(manifestPath.replace(manifestName,''),true,null,null)
	}

	manifestData.dataUsingEncoding_(NSUTF8StringEncoding).writeToFile_atomically_(manifestPath,true)

	var messageType = (manifestExists) ? 'updated' : 'created'
	var messageAdd = (addCount == 1) ? `${addCount} string added` : `${addCount} strings added`
	var messageMatch = (matchCount) ? ` (${matchCount} pre-populated)` : ''
	var messageSkip = (skipCount) ? `, ${skipCount} skipped (already existed)` : ''

	sketch.UI.message(`Manifest ${messageType}: ${messageAdd}${messageMatch}${messageSkip}`)
}
