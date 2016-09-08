# sncr-sketch-plugin
A plugin of Sketch actions which are useful in the workflows of the designers at Synchronoss Technologies Inc.

# Layout & Wireframes
At times, a deliverable of wireframes is unavoidable. The following is a series of actions which are meant to coerce wireframes out of Sketch, without negatively impacting your day-to-day workflow and use of Sketch with 3rd party services. Many of these actions provide usefulness outside the intention of delivering wireframes.

## Layout Artboards…
Orients all artboards on current page into a groupings, determined by artboard names (best used with numeric artboard prefixes). Options include the ability to choose number of artboards displayed per row, and if the groupings should be dense (combine rows when space allows for it) or loose (treat each group as a new row).

![Layout Artboards](https://raw.githubusercontent.com/sonburn/sncr-sketch-plugin/master/Screenshots/Layout%20Artboards.png)

## Create Slice Around Artboards…
Creates a slice around your selected artboards, all artboards on the page, or all artboards with additional padding for the intent of exporting as a wireframe. Additional options include the ability to set a slice density (.5x, 1x, 2x, 3x) and export format (JPG, PDF, PNG).

![Create Slice Around Artboards](https://raw.githubusercontent.com/sonburn/sncr-sketch-plugin/master/Screenshots/Create%20Slice%20Around%20Artboards.png)

## Create Titles Above Artboards
Creates a text title above each artboard, with the value of each artboard name. All titles are contained in a group at the top of the layers panel called Titles. Any time you change the name of an artboard, run this action again and all titles will be quickly re-generated to reflect changes.

## Export Wireframes…
Scans entire document for slices with a name that matches the page name (assumed a wireframe slice) and displays all matches in alert window with the ability to quickly export them all, and the ability to select individual wireframes to export. Especially useful in conjunction with the "wireframe slice" option of "Create Slice Around Artboards…".

![Export Wireframes](https://raw.githubusercontent.com/sonburn/sncr-sketch-plugin/master/Screenshots/Export%20Wireframes.png)

# Symbol Tools

## Find All Instances of Selected Symbol
Displays the location of all symbol instances of the selected symbol in an alert window.

![Find All Instances of Selected Symbol](https://raw.githubusercontent.com/sonburn/sncr-sketch-plugin/master/Screenshots/Find%20All%20Instances%20of%20Selected%20Symbol.png)

## Select All Symbol Instances on Current Page
Selects all symbol instances on the current page, especially useful in conjunction with "Rename Selected Instance(s) to Symbol Name".

## Rename Selected Instance(s) to Symbol Name
Updates the name of all selected symbol instances to match the name of the master, especially useful in conjunction with "Select All Symbol Instances on Current Page".

## Remove Unused Symbols in Document
This is the Remove Unused Symbols plugin from Bomberstudios (https://github.com/sketchplugins/remove-unused-symbols), but with feedback.
