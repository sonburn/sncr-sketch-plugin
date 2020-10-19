@import '../library.js'

const document = sketch.getSelectedDocument()
const pages = document.pages
const page = document.selectedPage

const pluginPath = NSHomeDirectory() + '/Library/Application Support/com.bohemiancoding.sketch3/Plugins/Zeplin.sketchplugin'
const pluginURL = NSURL.fileURLWithPath(pluginPath)

var onRun = function(context) {
	if (!NSFileManager.defaultManager().fileExistsAtPath(pluginPath)) {
		sketch.UI.alert(`Missing Zeplin Plugin`,`Expected the Zeplin plugin in the following location:\n${pluginPath}`)

		return false
	} else {
		MSPluginBundle.alloc().initPluginBundleWithURL(pluginURL)
	}

	page.layers.forEach(l => {
		if (l.sketchObject.class() == 'MSArtboardGroup' || l.sketchObject.class() == 'MSSymbolMaster') {
			l.selected = true
		}
	})

	AppController.sharedInstance().runPluginCommandWithIdentifier_fromBundleAtURL('export',pluginURL)
}
