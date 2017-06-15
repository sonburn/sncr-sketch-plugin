var SNCR = {
	init: function(context, command){
		this.sketchApp = COScript.app("Sketch")
		this.appSupportPath = NSFileManager.defaultManager().URLsForDirectory_inDomains(NSApplicationSupportDirectory,NSUserDomainMask).firstObject().path()
		this.pluginFolderPath = this.appSupportPath.stringByAppendingPathComponent("com.bohemiancoding.sketch3/Plugins/sncr-sketch-plugin/SNCR.sketchplugin")
		this.pluginURL = NSURL.fileURLWithPath(this.pluginFolderPath)

		this.context = context;
		this.extend(context);
		this.pluginRoot = this.scriptPath
			.stringByDeletingLastPathComponent()
			.stringByDeletingLastPathComponent()
			.stringByDeletingLastPathComponent();
		this.pluginSketch = this.pluginRoot + "/Contents/";
		this.doc = context.document;
		this.docData = this.doc.documentData();
		this.page = this.doc.currentPage();
		this.artboard = this.page.currentArtboard();
		this.current = this.artboard || this.page;
		coscript.setShouldKeepAround(true);
		if(command && command == "layout-bar"){
			this.LayoutBar();
			return false;
		}
		if(command){
			switch(command){
				case "layout-artboards":
					this.layoutArtboards();
					break;
				case "create-artboard-titles":
					this.createTitles();
					break;
				case "create-artboard-slice":
					this.createSlice();
					break;
				case "export-wireframes":
					this.exportWireframes();
					break;
			}
		}
	},
	extend: function( options, target ){
		var target = target || this;
		for ( var key in options ){
			target[key] = options[key];
		}
		return target;
	}
};

SNCR.extend({
	layoutArtboards: function(){
		this.sketchApp.delegate().runPluginCommandWithIdentifier_fromBundleAtURL_context('layout-artboards',this.pluginURL,null);
	},
	createTitles: function(){
		this.sketchApp.delegate().runPluginCommandWithIdentifier_fromBundleAtURL_context('create-artboard-titles',this.pluginURL,null);
	},
	createSlice: function(){
		this.sketchApp.delegate().runPluginCommandWithIdentifier_fromBundleAtURL_context('create-artboard-slice',this.pluginURL,null);
	},
	exportWireframes: function(){
		this.sketchApp.delegate().runPluginCommandWithIdentifier_fromBundleAtURL_context('export-wireframes',this.pluginURL,null);
	}
});

SNCR.extend({
	LayoutBar: function(){
		var self = this,
			identifier = "sncr.sketch",
			threadDictionary = NSThread.mainThread().threadDictionary(),
			LayoutBar = threadDictionary[identifier];
		if(!LayoutBar){
			LayoutBar = NSPanel.alloc().init();
			LayoutBar.setStyleMask(NSTitledWindowMask + NSFullSizeContentViewWindowMask);
			LayoutBar.setBackgroundColor(NSColor.colorWithRed_green_blue_alpha(0, 0, 0, 1));
			LayoutBar.setTitleVisibility(NSWindowTitleHidden);
			LayoutBar.setTitlebarAppearsTransparent(true);
			LayoutBar.setFrame_display(NSMakeRect(0, 0, 300, 50), false);
			LayoutBar.setMovableByWindowBackground(true);
			LayoutBar.setHasShadow(true);
			LayoutBar.setLevel(NSFloatingWindowLevel);
			var contentView = LayoutBar.contentView(),
				getImage = function(size, name){
					var isRetinaDisplay = (NSScreen.mainScreen().backingScaleFactor() > 1)? true: false;
						suffix = (isRetinaDisplay)? "@2x": "",
						imageURL = NSURL.fileURLWithPath(self.pluginSketch + "/Resources/" + name + suffix + ".png"),
						image = NSImage.alloc().initWithContentsOfURL(imageURL);
					return image
				},
				addButton = function(rect, name, callAction){
					var button = NSButton.alloc().initWithFrame(rect),
						image = getImage(rect.size, name);

					button.setImage(image);
					button.setBordered(false);
					button.sizeToFit();
					button.setButtonType(NSMomentaryChangeButton);
					button.setCOSJSTargetFunction(callAction);
					button.setAction("callAction:");
					return button;
				},
				addImage = function(rect, name){
					var view = NSImageView.alloc().initWithFrame(rect),
						image = getImage(rect.size, name);
					view.setImage(image);
					return view;
				},

				closeButton = addButton( NSMakeRect(20, 10, 30, 30), "close-control",
					function(sender){
						coscript.setShouldKeepAround(false);
						threadDictionary.removeObjectForKey(identifier);
						LayoutBar.close();
				}),
				layoutArtboardsButton = addButton( NSMakeRect(100, 10, 30, 30), "layout-artboards",
					function(sender){
						self.init(self.context, "layout-artboards");
				}),
				createTitlesButton = addButton( NSMakeRect(150, 10,30,30), "create-artboard-titles",
					function(sender){
						self.init(self.context, "create-artboard-titles");
				}),
				createSliceButton = addButton( NSMakeRect(200, 10,30,30), "create-artboard-slice",
					function(sender){
						self.init(self.context, "create-artboard-slice");
				}),
				exportWireframesButton = addButton( NSMakeRect(250, 10,30,30), "export-wireframes",
					function(sender){
						self.init(self.context, "export-wireframes");
				}),
				separater = addImage( NSMakeRect(70, 10, 10, 30), "separate");
			contentView.addSubview(closeButton);
			contentView.addSubview(separater);
			contentView.addSubview(layoutArtboardsButton);
			contentView.addSubview(createTitlesButton);
			contentView.addSubview(createSliceButton);
			contentView.addSubview(exportWireframesButton);
			threadDictionary[identifier] = LayoutBar;
			LayoutBar.center();
			LayoutBar.makeKeyAndOrderFront(nil);
		}
	}
});

function layoutBar(context) {
	SNCR.init(context, "layout-bar");
}
