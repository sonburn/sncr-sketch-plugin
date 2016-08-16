var onRun = function(context) {
  log('Select all slice in page.');
    
  var doc = context.document
  // Unselect everything
  doc.currentPage().deselectAllLayers()

  // Recursive execute through all layers:
  selectSliceRecursive(doc.currentPage())
};

function selectSliceRecursive(layer) {
  if (layer instanceof MSSymbolInstance) {
    layer.select_byExpandingSelection(true, true)
    log("  " + layer.name())
    return
  }
  try {
    var children = layer.layers()
    for (var i = 0; i < children.length; i++) {
      selectSliceRecursive(children.objectAtIndex(i))
    }
  } catch(e) {
  }
};