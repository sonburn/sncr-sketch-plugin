@import '../library.js';

const document = sketch.getSelectedDocument();
const page = document.selectedPage;

var onRun = function(context) {
	sketch.UI.getInputFromUser(
		"Increment amount (e.g. 1, 2 -1):",
		{
			initialValue: '',
		},
		(err,val) => {
			if (err) {
				// most likely the user canceled the input
				return
			}

			if (val) {
				var amount = Number(val);

				if (Number.isInteger(amount) && amount !== 0) {
					page.layers.forEach(l => {
						var types = ['Artboard','SymbolMaster'];

						if (types.includes(l.type)) {
							let version = l.name.substr(0,l.name.indexOf(' '));
							let versionParts = version.split('.');
							let remainder = l.name.substr(l.name.indexOf(' '));

							let newName = [versionParts[0],(Number(versionParts[1]) + amount), versionParts[2],versionParts[3]].join('.') + remainder;

							l.name = newName;
						}
					});

					sketch.UI.message('Artboards incremented by ' + amount);
				} else {
					sketch.UI.alert('Increment Version Numbers for Artboards on Page','Please provide a valid number to increment by.');
				}
			}
		}
	);
}
