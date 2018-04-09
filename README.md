# sncr-sketch-plugin
A plugin of Sketch actions which are useful in the workflows of the designers at Synchronoss Technologies Inc.



# Section Titles
A section title is a visually defining element or text to help differentiate groups of artboards within a page. This group of functions will allow you to manage linking section titles to artboards. A section title which has been linked to an artboard will ensure it is always positioned properly on your canvas after artboards have been moved.

## Link Selected Title and Artboard
Links the selected section title and artboard, replacing any pre-existing artboard link for the section title. Linking a section title will automatically run "Update All Linked Titles on Page", which will orient the newly linked section title in relation to the linked artboard.

The layer name of a linked section title will be updated to reflect that it has been linked. The layer name will display a "🔗" icon, followed by the first override if the section title is a symbol instance and has an override value, or the string value if the section title is a text layer, otherwise the remainder of the layer name will remain unchanged.

## Unlink Selected Titles
Removes links between selected section titles and linked artboards.

## Update All Linked Titles on Page
Updates the position and layer name of all linked section titles on the current page. If a section title is linked to an artboard which no longer exists on the page, the section title will be unlinked.

## Settings…
Displays options for setting the width and vertical and horizontal offsets of section titles.

![Section Title Settings](https://raw.githubusercontent.com/sonburn/sncr-sketch-plugin/master/Resources/Section%20Title%20Settings.png){ width=50% }



# Artboard Titles
While Sketch displays titles above each artboard on the canvas, these titles do not get exported in a slice encompassing an artboard (such as a wireframe slice). This group of functions will allow you to manage the creation of artboard titles, which are text layers containing the artboard name, placed on the background canvas and oriented to the respective artboard.

## Create Titles for Artboards on Page
Generates titles for all artboards (not precluded) on the current page. The text layers are positioned above the artboards by default, and on the background canvas. All titles are contained in a "Titles" group within the parent "SNCR" group at the top of the layers panel. If a "Titles" group already exists when this function is run, the group will be deleted and a new group will be created.

## Include Selected Artboards
Indicates the selected artboards should be included when new titles are created. This function is only necessary if the artboard was previously precluded.

## Preclude Selected Artboards
Indicates the selected artboards should not be included when new titles are created.

## Settings…
Displays an option for positioning the title above or below the artboard, as well as an offset distance.

![Artboard Title Settings](https://raw.githubusercontent.com/sonburn/sncr-sketch-plugin/master/Resources/Artboard%20Title%20Settings.png){ width=50% }



# Artboard Descriptions
An artboard description is a text layer oriented near an artboard, providing descriptive information about the artboard to which the description is linked. This group of functions will allow you to manage artboard descriptions.

## Add/Edit Description on Selected Artboard
Adds a new artboard description to the selected artboard, or edits an existing description if one already exists. The description will be automatically linked to the artboard, positioned near the artboard in accordance to feature settings, and apply the artboard description style.

![Artboard Description Add](https://raw.githubusercontent.com/sonburn/sncr-sketch-plugin/master/Resources/Artboard%20Description%20Add.png)

## Link Selected Description and Artboard
Links the selected artboard description and artboard, replacing any pre-existing artboard link for the artboard description. Linked artboard descriptions will be moved to the "Descriptions" group within the parent "SNCR" group at the top of the layers panel.

The layer name of a linked artboard description will be updated to reflect that it has been linked. The layer name will display a "🔗" icon, followed by the name of the artboard to which the description has been linked.

## Unlink Selected Descriptions
Removes links between selected artboard descriptions and linked artboards.

## Update All Linked Descriptions on Page
Updates the position and layer name of all linked artboard descriptions on the current page. If an artboard description is linked to an artboard which no longer exists on the page, the artboard description will be unlinked.

## Settings…
Displays options for setting the width, position, and vertical and horizontal offsets of artboard descriptions.

![Artboard Description Settings](https://raw.githubusercontent.com/sonburn/sncr-sketch-plugin/master/Resources/Artboard%20Description%20Settings.png)



# Artboard Layout

## Layout Artboards on Page
To do...

## Include Selected Artboards
To do...

## Preclude Selected Artboards
To do...

## Enable Automatic Layout for Page
To do...

## Disable Automatic Layout for Page
To do...

## Settings for Page…
Lays out all artboards on current page into groupings determined by artboard names (best used with numeric artboard prefixes, i.e. "1.0.0 Splash Screen"). Options include the ability to choose number of artboards displayed per row, and if the groupings should be dense (multiple groups on a row when space allows for it) or loose (treat each group as a new row), as well as the ability to sort the layer list and artboards alphabetically. Lastly, you can also control the spacing between your artboards and artboard groups.

![Artboard Layout Settings](https://raw.githubusercontent.com/sonburn/sncr-sketch-plugin/master/Resources/Artboard%20Layout%20Settings.png)



# Layer Annotations

## Create Annotations for Selected Artboards
To do...

## Designate Selected Layers as Annotations
To do...

## Link Selected Annotation and Object/Artboard
To do...

## Update All Linked Annotations on Page
To do...

## Settings…
To do...



# Wireframes

## Create Artboard Slice…
Creates a slice around your selected artboards, all artboards on the page, or all artboards on the page with additional padding for the intent of exporting as a wireframe (to accommodate a header and annotations). Additional options include the ability to set a slice density (.5x, 1x, 2x, 3x) and export format (JPG, PDF, PNG).

![Create Artboard Slice](https://raw.githubusercontent.com/sonburn/sncr-sketch-plugin/master/Resources/Create%20Artboard%20Slice.png)

## Include Selected Slice
To do...

## Preclude Selected Slice
To do...

## Export Wireframes…
Displays all designated wireframes in alert window with the ability to quickly export all wireframes, or select individual wireframes to export.

![Export Wireframes](https://raw.githubusercontent.com/sonburn/sncr-sketch-plugin/master/Resources/Export%20Wireframes.png)
