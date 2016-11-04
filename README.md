# sncr-sketch-plugin
A plugin of Sketch actions which are useful in the workflows of the designers at Synchronoss Technologies Inc.

# Layout & Wireframes
At times, a deliverable of wireframes is unavoidable. The following is a series of actions which are meant to coerce wireframes out of Sketch, without negatively impacting your day-to-day workflow and use of Sketch with 3rd party services. Many of these actions also provide usefulness outside the intention of delivering wireframes.

## Layout Artboards…
Lays out all artboards on current page into groupings determined by artboard names (best used with numeric artboard prefixes, i.e. "1.0.0 Splash Screen"). Options include the ability to choose number of artboards displayed per row, and if the groupings should be dense (multiple groups on a row when space allows for it) or loose (treat each group as a new row), as well as the ability to sort the layer list and artboards alphabetically. Lastly, you can also control the spacing between your artboards and artboard groups.

![Layout Artboards](https://raw.githubusercontent.com/sonburn/sncr-sketch-plugin/master/Screenshots/Layout%20Artboards.png)

## Create Artboard Titles…
Creates a title text layer above or below each artboard, with the value of each artboard name. These titles are useful to identify screens in wireframes, as the native Sketch artboard title names don't export. All titles are contained in a group at the top of the layers panel called "Titles". Any time you change the name of an artboard, simply run this action again and all titles will be quickly re-generated to reflect name changes.

![Create Artboard Titles](https://raw.githubusercontent.com/sonburn/sncr-sketch-plugin/master/Screenshots/Create%20Artboard%20Titles.png)

## Create Artboard Slice…
Creates a slice around your selected artboards, all artboards on the page, or all artboards on the page with additional padding for the intent of exporting as a wireframe (to accommodate a header and annotations). Additional options include the ability to set a slice density (.5x, 1x, 2x, 3x) and export format (JPG, PDF, PNG).

![Create Artboard Slice](https://raw.githubusercontent.com/sonburn/sncr-sketch-plugin/master/Screenshots/Create%20Artboard%20Slice.png)

## Export Wireframes…
Scans entire document for slices with a name that matches the page name (assumed a wireframe slice) and displays all matches in alert window with the ability to quickly export all wireframes, or select individual wireframes to export. Especially useful in conjunction with the "wireframe slice" option of "Create Slice Around Artboards…".

![Export Wireframes](https://raw.githubusercontent.com/sonburn/sncr-sketch-plugin/master/Screenshots/Export%20Wireframes.png)

# Symbol Tools
This plugin contains a variety of symbol management actions, such as the ability to view the location of all instances of a symbol, quickly select instances on the current page, and update their names.

## Find All Instances of Selected Symbol
Displays the location of all symbol instances of the selected symbol in an alert window.

![Find All Instances of Selected Symbol](https://raw.githubusercontent.com/sonburn/sncr-sketch-plugin/master/Screenshots/Find%20All%20Instances%20of%20Selected%20Symbol.png)

## Remove Unused Symbols in Document
This is the Remove Unused Symbols plugin from Bomberstudios (https://github.com/sketchplugins/remove-unused-symbols), but with feedback.
