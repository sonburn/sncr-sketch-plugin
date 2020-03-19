@import '../library.js';

const document = sketch.getSelectedDocument();
const pages = document.pages;

var onRun = function(context) {
	const platforms = ['android','ios'];
	const fileName = String(document.sketchObject.displayName());
	const filePath = document.sketchObject.fileURL().URLByDeletingLastPathComponent();
	const fileBrand = fileName.substring(0,2);
	const fileVersion = fileName.substring(fileName.length - 10,fileName.length - 7);
	const assetsPage = pages[1];
	const androidPage = pages[2];
	const iosPage = pages[3];
	const newPageName = 'Symbols';

	platforms.forEach(p => {
		if (p === 'android') {
			// Modify for Android
			assetsPage.layers[1].sketchObject.removeFromParent();
			androidPage.name = newPageName;
			document.sketchObject.removePage(iosPage.sketchObject);
		} else {
			// Modify for iOS
			assetsPage.layers[0].sketchObject.removeFromParent();
			iosPage.name = newPageName;
			document.sketchObject.removePage(androidPage.sketchObject);
		}

		document.sketchObject.setCurrentPage(pages[0].sketchObject);

		let saveName = `${fileBrand}-cloud-` + p + `-en-${fileVersion}.sketch`;
		let saveURL = NSURL.URLWithString_relativeToURL(saveName,filePath);
		let file = openFile(saveURL,0);

		if (file) {
			let fileID = file.documentData().objectID();

			log(saveName + ' exists (' + fileID + ')');

			// Save the file with the existing ID...
			document.sketchObject.documentData().setObjectID(fileID);
		} else {
			log(saveName + ' does not exist');

			// Save the file, which will generate a new ID...
		}
	});

	function openFile(url,display) {
		var app = NSDocumentController.sharedDocumentController();
		var err = MOPointer.alloc().init();

		return app.openDocumentWithContentsOfURL_display_error(url,display,err);
	}

	function saveFile(file,url,mode) {
		file.saveDocumentToURL_saveMode_context_callback(url,mode,coscript,err => {
			try {
				fiber.cleanup();
			} catch (error) {
				fiber.cleanup();
				throw error;
			}
		});
	}

	// let fiber = require('sketch/async').createFiber();
	//
	// let libraryType = 1; // Android = 0, iOS = 1
	// let androidLibraryID = '712BEDAD-9DCD-4A64-A2F1-A49A69F48DFF';
	// let androidFileName = 'vz-cloud-android-en-2.0.sketch';
	// let iosLibraryID = '8A621D43-25F4-46C8-8D5E-998152406870';
	// let iosFileName = 'vz-cloud-ios-en-2.0.sketch';
	// let filePath = '/Users/jbur0001/Git/cloud/design/Single Client/Verizon/_Libraries/';
	//
	// let assetsPage = pages[1];
	// let androidPage = pages[2];
	// let iosPage = pages[3];
	// let newPageName = 'Symbols';
	//
	// if (libraryType === 0) {
	//   // Modify for Android
	//   assetsPage.layers[1].sketchObject.removeFromParent();
	//   androidPage.name = newPageName;
	//   document.sketchObject.removePage(iosPage.sketchObject);
	//   document.sketchObject.setCurrentPage(pages[0].sketchObject);
	//
	//   try {
	//     document.save(filePath + androidFileName);
	//   } finally {
	//     fiber.cleanup();
	//     context.document.documentData().setObjectID(androidLibraryID);
	//   }
	// } else {
	//   // Modify for iOS
	//   assetsPage.layers[0].sketchObject.removeFromParent();
	//   iosPage.name = newPageName;
	//   document.sketchObject.removePage(androidPage.sketchObject);
	//   document.sketchObject.setCurrentPage(pages[0].sketchObject);
	//
	//   try {
	//     document.save(filePath + iosFileName);
	//   } finally {
	//     fiber.cleanup();
	//     context.document.documentData().setObjectID(iosLibraryID);
	//   }
	// }
	//
	// context.document.reloadInspector();
}
