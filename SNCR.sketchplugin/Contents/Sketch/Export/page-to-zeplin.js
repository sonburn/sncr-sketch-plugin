@import '../library.js'

const document = sketch.getSelectedDocument()
const pages = document.pages
const page = document.selectedPage
const pluginURL = NSURL.fileURLWithPath('/Users/jbur0001/Library/Application Support/com.bohemiancoding.sketch3/Plugins/Zeplin.sketchplugin')
const plugin = MSPluginBundle.alloc().initPluginBundleWithURL(pluginURL)

var onRun = function(context) {
	page.layers.forEach(l => {
		if (l.sketchObject.class() == 'MSArtboardGroup' || l.sketchObject.class() == 'MSSymbolMaster') {
			l.selected = true
		}
	})

	AppController.sharedInstance().runPluginCommandWithIdentifier_fromBundleAtURL('export',pluginURL)
}
