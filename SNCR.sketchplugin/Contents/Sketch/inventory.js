var com = com || {};

com.sncr = {}

com.sncr.config = {
	rowCount = 10;
	rowHeight = 0;
	xPad = 400;
	yPad = 300;
}

com.sncr.common = {
	init: function (context) {
		com.sncr.context = context;
		com.sncr.doc = context.document;
		com.sncr.selection = context.selection;
	}
}