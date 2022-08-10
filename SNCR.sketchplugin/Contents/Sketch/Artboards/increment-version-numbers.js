@import '../library.js'

const document = sketch.getSelectedDocument()
const page = document.selectedPage
const selections = document.selectedLayers

var onRun = function(context) {
	var positions = ['First','Second','Third','Fourth']

	var alertWindow = createAlertWindow(context,'Increment Version Numbers')

	var positionLabel = createAlertLabel('Number position:',NSMakeRect(0,0,300,14))

	alertWindow.addAccessoryView(positionLabel)

	var positionSelect = createAlertPopupButton(positions,1,NSMakeRect(0,0,120,28))

	alertWindow.addAccessoryView(positionSelect)

	var amountLabel = createAlertLabel('Increment amount (e.g. 1, 2 -1):',NSMakeRect(0,0,300,14))

	alertWindow.addAccessoryView(amountLabel)

	var amountValue = createAlertField('',NSMakeRect(0,0,60,23))

	alertWindow.addAccessoryView(amountValue)

	var submit = alertWindow.addButtonWithTitle('OK')
	var cancel = alertWindow.addButtonWithTitle('Cancel')

	// Set key order
	setKeyOrder(alertWindow.alert(),[
		positionSelect,
		amountValue,
		submit
	])

	var response = alertWindow.runModal()

	if (response == 1000) {
		var amount = Number(amountValue.stringValue())

		if (Number.isInteger(amount) && amount !== 0) {
			let layers = selections.layers || page.layers

			layers.forEach(l => {
				var types = ['Artboard','SymbolMaster']

				if (types.includes(l.type)) {
					let version = l.name.substr(0,l.name.indexOf(' '))
					let versionParts = version.split('.')
					let remainder = l.name.substr(l.name.indexOf(' '))

					let position = positionSelect.indexOfSelectedItem()

					versionParts[position] = Number(versionParts[position]) + amount

					l.name = versionParts.join('.') + remainder
				}
			})

			let scope = (selections.layers) ? 'Selected' : 'All'

			sketch.UI.message(`${scope} artboards incremented by ${amount}`)
		} else {
			sketch.UI.alert('Increment Version Numbers for Artboards on Page','Please provide a valid number to increment by.')
		}
	} else return false
}
