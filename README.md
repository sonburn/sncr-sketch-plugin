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

# Section Titles

## Add/Insert
Adds an instance of the designated section title¹ symbol to the page, or inserts one above selected artboard(s). Once section title is added/inserted, user should apply override to set the section title name, link to an artboard, and then run "Update All in Document".

¹Will eventually be designated within the settings for this group of functions. Currently set to "Wireframe/Section".

## Link Selected
Links the selected section title and artboard together. Meant to be used in conjunction with "Update All in Document", which will re-orient section titles to their linked artboards, in the case the artboards have been moved.

Any link created between a section title and artboard will replace any previous link if one existed.

## Unlink Selected
Removes links for selected section titles, to break their relationships to any artboards.

## Select All on Page
Selects all section titles on the current page, facilitating the ability to run another process against all selected section titles at once.

## Update All in Document
Updates all the section titles within document; updates the layer name to match the override name, re-orients to a linked artboard if link is present, locks layer to prevent accidental augmentation.

# Artboard Descriptions

## Link Selected
Links the selected artboard description and artboard together. Any link created between an artboard description and artboard will replace any previous link, if one existed.

## Select All on Page
Selects all artboard descriptions on the current page, facilitating the ability to run another process against all selected artboard descriptions at once.

## Update All on Page
Updates all linked artboard descriptions on the current page; updates the layer name to match the linked artboard name, moves the artboard description to the SNCR > Descriptions directory, and re-orients the position in the case the artboards have been moved.
