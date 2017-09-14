# sncr-sketch-plugin
A plugin of Sketch actions which are useful in the workflows of the designers at Synchronoss Technologies Inc.

# Artboard Annotations

## Designate Selected Layers as Annotations
To do...

## Link Selected Annotation and Object/Artboard
To do...

## Update All Linked Annotations on Page
To do...

# Artboard Descriptions

## Add/Edit Description on Selected Artboard
Adds a new artboard description to the selected artboard, or edits an existing description if one exists. Will automatically position the description below the artboard, link the description to the artboard, and apply the artboard description style.

## Link Selected Description and Artboard
Links the selected artboard description and artboard together, which is useful for pre-existing artboard descriptions. Any link created between an artboard description and artboard will replace any previous link, if one existed.

## Unlink Selected Descriptions
Removes links for selected artboard descriptions, to break their relationships to any artboards.

## Select All Linked Descriptions on Page
Selects all linked artboard descriptions on the current page, facilitating the ability to run another process against all selected artboard descriptions at once.

## Update All Linked Descriptions on Page
Updates all linked artboard descriptions on the current page; updates the layer name to match the linked artboard name, moves the artboard description to the SNCR > Descriptions directory, and re-orients the position in the case the artboards have been moved.

# Artboard Titles
Sketch displays titles above each artboard on the canvas, however these titles do not get exported when exporting slices which contain multiple artboards. The following functions assist in the creation of artboard titles, allowing them to be exported in wireframes.

## Create Titles for Artboards on Page
Generates text layers with the name of each artboard, for all artboards (not precluded) on the page. The text layers are positioned above the artboards (by default), and on the background canvas. All titles are contained in a "Titles" group within the parent "SNCR" group at the top of the layers panel.

## Include Selected Artboards
Indicates the selected artboards should be included when new titles are created. This function is only necessary of the artboard was previously precluded.

## Preclude Selected Artboards
Indicates the selected artboards should not be included when new titles are created.

## Settings…
Presents some controls over the location of the artboard titles, and an option to automatically create titles for all artboards (not precluded) on the page when artboards are moved, on all pages other than Symbols page.

![Create Artboard Titles](https://raw.githubusercontent.com/sonburn/sncr-sketch-plugin/master/Screenshots/Create%20Artboard%20Titles.png)

# Layout Artboards

## Layout Artboards on Page
To do...

## Include Selected Artboards
To do...

## Include Current Page
To do...

## Preclude Selected Artboards
To do...

## Preclude Current Page
To do...

## Settings for Page…
Lays out all artboards on current page into groupings determined by artboard names (best used with numeric artboard prefixes, i.e. "1.0.0 Splash Screen"). Options include the ability to choose number of artboards displayed per row, and if the groupings should be dense (multiple groups on a row when space allows for it) or loose (treat each group as a new row), as well as the ability to sort the layer list and artboards alphabetically. Lastly, you can also control the spacing between your artboards and artboard groups.

![Layout Artboards](https://raw.githubusercontent.com/sonburn/sncr-sketch-plugin/master/Screenshots/Layout%20Artboards.png)

# Section Titles
A section title is a visually defining element or text to help differentiate groups of artboards within a page. This group of functions will allow you to designate a symbol to be used for section titles, and to insert and link a section title to an artboard. A section title which has been linked to an artboard will ensure it is always positioned properly on your canvas after artboards have been moved.

A section title symbol is intended to contain one text layer which can be overridden within each instance, as this override will be used as the name of the symbol instance after section titles get updated.

## Insert & Link Title to Selected Artboard
Adds a section title instance above the selected artboard, and links it to the artboard. Once section title is inserted, user should apply an override to the section title instance. The override will become the layer name the next time "Update All Linked Titles on Page" is run (either manually or triggered when artboards have been moved on the canvas).

## Link Selected Title and Artboard
Links the selected section title and artboard together. Any pre-existing link for a section title will be replaced. Linking a section title will automatically run "Update All Linked Titles on Page", which will orient the newly linked section title in relation to the linked artboard.

## Unlink Selected Titles
Removes links for selected section titles, breaking their relationships to any artboards.

## Select All Linked Titles on Page
Selects all linked section titles on the current page, facilitating the ability to run another process against all selected section titles at once.

## Update All Linked Titles on Page
Updates all linked section titles on the current page. When a section title is updated, the layer name is updated to match the override name if one is applied (otherwise linked artboard name is used), each section title is re-oriented to the artboard for which it is linked (if the artboard no longer exists on the page, the link will be removed), and locks the section title instance prevent accidental modification.

## Settings…
Presents a list of all symbols in the document, allowing the user to select a symbol which is intended to be used for section titles. Also allows for width, and horizontal and vertical offsets to be defined, applied next time user inserts new, or updates existing, section titles.

# Wireframe Tools

## Create Artboard Slice…
Creates a slice around your selected artboards, all artboards on the page, or all artboards on the page with additional padding for the intent of exporting as a wireframe (to accommodate a header and annotations). Additional options include the ability to set a slice density (.5x, 1x, 2x, 3x) and export format (JPG, PDF, PNG).

![Create Artboard Slice](https://raw.githubusercontent.com/sonburn/sncr-sketch-plugin/master/Screenshots/Create%20Artboard%20Slice.png)

## Include Selected Slice
To do...

## Preclude Selected Slice
To do...

## Export Wireframes…
Displays all designated wireframes in alert window with the ability to quickly export all wireframes, or select individual wireframes to export.

![Export Wireframes](https://raw.githubusercontent.com/sonburn/sncr-sketch-plugin/master/Screenshots/Export%20Wireframes.png)
