var canvas = document.getElementById('atascii');
var context = canvas.getContext('2d');
// Atari 8-bit screen is 40x24
var cols = 40;
var rows = 24;

var charW = 16;
var charH = 16;

canvas.width = cols * charW;
canvas.height = rows * charH;
context.clearRect(0, 0, canvas.width, canvas.height);

// Diagnostic stuff
var overlay = document.getElementById('canvas-overlay');
overlay.style.width = (cols * charW).toString() +'px';
overlay.style.height = (rows * charH).toString() +'px';
var masterIndex = 0;
var masterStream;
var diagnosticMode = false;
var fullScreenMode = false;

//resize(canvas);
document.getElementById('atascii').style.background = '#005d8e';

// Globals
var screen;
var cursor = {'x':0,'y':0};

var img = new Image();
// If you don't wait for onload, then nothing happens.
img.onload = function () {
	var atasciiFont = new Sprite(img, 16, 16);
	screen = new Screen(cols, rows, atasciiFont);
	screen.initialize();
	screen.draw();
	var fs = document.getElementById('fileSelector');
	fs.style.display = 'block';
}
img.src = 'fontsets/atari-8bit-blue.png';


document.getElementById('fileSelector').onchange = function() {
	var elem = (typeof this.selectedIndex === "undefined" ? window.event.srcElement : this);
	var value = elem.value || elem.options[elem.selectedIndex].value;
	// Stop any running animations
	if (typeof screen === 'object') {
		screen.stop();
	}
	loadFileFromUrl( value );
}

document.getElementById('diagnostic').onclick = function() {
	if (this.checked) { diagnosticMode = true; }
	else { diagnosticMode = false; }

	var diags = document.getElementsByClassName("diagnostic");
	for (var i=0; i < diags.length; i++) {
		if ( diagnosticMode ) {
			diags.item(i).style.display = 'block';
		}
		else {
			diags.item(i).style.display = 'none';
		}
	}
}

document.getElementById('full-screen').onclick = function() {
	if (this.checked) { fullScreenMode = true; }
	else { fullScreenMode = false; }

	var container = document.getElementById('canvas-container');
	if ( fullScreenMode ) {
		resize(container);
		container.classList.add('fullscreen');
		if ( container.webkitRequestFullscreen ) {
			container.webkitRequestFullscreen(Element.ALLOW_KEYBOARD_INPUT);
			document.addEventListener('webkitfullscreenchange', exitHandler, false);
		}
		else if ( container.mozRequestFullScreen ) {
			container.mozRequestFullScreen();
			document.addEventListener('mozfullscreenchange', exitHandler, false);
		}
		else if ( container.msRequestFullscreen ) {
			container.msRequestFullscreen();
			document.addEventListener('MSFullscreenChange', exitHandler, false);
		}
		else if ( container.requestFullscreen ) {
			container.requestFullscreen();
			document.addEventListener('fullscreenchange', exitHandler, false);
		}
	}
	else {

		if ( document.webkitExitFullscreen ) {
			document.webkitExitFullscreen();
		}
		else if ( document.mozCancelFullScreen ) {
			document.mozCancelFullScreen();
		}
		else if ( document.msExitFullscreen ) {
			document.msExitFullscreen();
		}
		else if ( document.exitFullscreen ) {
			document.exitFullscreen();
		}
		container.setAttribute('style', '-ms-transform: scale(1,1); -webkit-transform: scale3d(1,1,1); -moz-transform: scale(1,1); -o-transform: scale(1,1); transform: scale(1,1);');
		container.classList.remove('fullscreen');
	}
}

function exitHandler() {
	var state = document.webkitIsFullScreen || document.mozFullScreen || document.msFullscreenElement;
	var container = document.getElementById('canvas-container');
	if ( !state ) {
		container.setAttribute('style', '-ms-transform-origin: left top; -webkit-transform-origin: left top; -moz-transform-origin: left top; -o-transform-origin: left top; transform-origin: left top; -ms-transform: scale(1,1); -webkit-transform: scale3d(1,1,1); -moz-transform: scale(1,1); -o-transform: scale(1,1); transform: scale(1,1);');
		container.classList.remove('fullscreen');
		document.getElementById('full-screen').checked = false;
	}
}


document.onkeydown = function(e) {
	if (diagnosticMode) {
		// ESC: stop
		if ( e.keyCode == 27 ) {
			if (typeof screen === 'object') {
				screen.stop();
			}
		}
		// LEFT: step backward one frame using diagnostic
		else if ( e.keyCode == 37 ) {
			if (typeof screen === 'object') {
				diagnosticRender( -1 );
			}
		}
		// RIGHT: step forward one frame using diagnostic
		else if ( e.keyCode == 39 ) {
			if (typeof screen === 'object') {
				diagnosticRender( 1 );
			}
		}
	}
}

function resize(element) {
	var scale = {x: 1, y: 1};
	scale.x = (window.innerWidth) / element.offsetWidth;
	scale.y = (window.innerHeight) / element.offsetHeight;
// 	console.log('window.innerWidth: ' + window.innerWidth);
// 	console.log('element.offsetWidth: ' + element.offsetWidth);
// 	console.log('window.innerHeight: ' + window.innerHeight);
// 	console.log('element.offsetHeight: ' + element.offsetHeight);
// 	console.log('scale.x: ' + scale.x);
// 	console.log('scale.y: ' + scale.y);

	if (scale.x < 1 || scale.y < 1) {
		scale = '1, 1';
	} else if (scale.x < scale.y) {
		scale = scale.x + ', ' + scale.x;
	} else {
		scale = scale.y + ', ' + scale.y;
	}
	element.setAttribute('style', '-ms-transform: scale(' + scale + '); -webkit-transform: scale3d(' + scale + ', 1); -moz-transform: scale(' + scale + '); -o-transform: scale(' + scale + '); transform: scale(' + scale + ');');
}



// Function is called when server-side dropdown onChange
function loadFileFromUrl( url ) {
	var oReq = new XMLHttpRequest();
	oReq.onload = function(e) {
		var result = oReq.response;
// 		console.log(oReq);
// 		console.log(result);
		// convert result ArrayBuffer to Uint8Array
		var byteArray = new Uint8Array(result);
		// Now convert it to normal array
		var stream = [].slice.call(byteArray);
		// reset globals
		var cursor = {'x':0,'y':0};
		screen.initialize();
		screen.draw();
		// Send array to our renderer
		render( stream );
	}
	oReq.open("GET", url);
	oReq.setRequestHeader('Content-Type', 'application/octet-stream');
	oReq.responseType = "arraybuffer";
	oReq.send();
}




// Function is called when file selector fires onChange 
function parseFile( files ) {
	var numFiles = files.length;
	for (var i = 0, numFiles = files.length; i < numFiles; i++) {
		var file = files[i];
		var fSize = file.size;
		var fType = file.type;
		var fName = file.name;
	}
	var reader = new FileReader();
	reader.onload = function(e) {
// 		console.log(e);
		var result = e.target.result;
// 		console.log(result);
		// convert data to ascii codes.
		var stream = result.split('');
		for (var i=0; i<stream.length; i++) {
			stream[i] = stream[i].charCodeAt(0);
		}
		// reset globals
		var cursor = {'x':0,'y':0};
		var stopAnim = false;
		screen.initialize();
		screen.draw();
		// send data to our renderer
		render( stream );
	};
	reader.readAsBinaryString(file);
}


function Screen(width, height, sprite) {
	this.width = width;
	this.height = height;
	this.sprite = sprite;
	this.spriteWidth = sprite.width;
	this.spriteHeight = sprite.height;
	this.data = [];
	this.updates = [];
	this.isPlaying = false;
}

Screen.prototype = {
	play: function() {
		this.isPlaying = true;
	},
	stop: function() {
		this.isPlaying = false;
	},
	clearScreen: function() {
		for (var y=0; y<this.height; y++) {
			this.data[y] = [];
			for (var x=0; x<this.width; x++) {
				//this.data[y][x] = Math.floor(Math.random() * (255 - 1 + 1) + 1);
				this.data[y][x] = 32;
			}
		}
	},
	initialize: function() {
		this.play();
		this.clearScreen();
	},
	randomize: function() {
		for (var y=0; y<this.height; y++) {
			this.data[y] = [];
			for (var x=0; x<this.width; x++) {
				this.data[y][x] = Math.floor(Math.random() * (255 - 1 + 1) + 1);
			}
		}
	},
	getData: function(x,y) {
		return this.data[y][x]
	},
	setData: function(x,y,data) {
		if ( typeof this.data[y] === 'undefined' || typeof this.data[y][x] === 'undefined' ) {
			throw("ERROR: Screen.setData() invalid coordinates: " + x + "," + y);
		}
		this.data[y][x] = data;
	},
	scrollUp: function( amt ) {
		// Iterate over each line and replace it with 
		// the data from the next line
		for (var y=0; y < this.height; y++) {
			for (var x=0; x < this.width; x++ ) {
				// Check if we're within threshold amt
				if ( y < ( this.height - amt) ) {
					var theChar = this.getData( x, y + amt );
					this.setData( x, y, theChar );
				}
				// If not, then this is the bottom. Fill with empty space.
				else {
					this.setData( x, y, 32 );
				}
			}
		}
		this.draw();
	},
	shiftUp: function( y, amt ) {
		// Iterate over each line and replace it with 
		// the data from the next line
		for ( y; y < this.height; y++) {
			for (var x=0; x < this.width; x++ ) {
				// Check if we're within threshold amt
				if ( y < ( this.height - amt) ) {
					var theChar = this.getData( x, y + amt );
					this.setData( x, y, theChar );
				}
				// If not, then this is the bottom. Fill with empty space.
				else {
					this.setData( x, y, 32 );
				}
			}
		}
		this.draw();
	},
	shiftDown: function( y, amt ) {
		var z = this.height - 1;
		// Iterate over each line and replace it with 
		// the data from the next line
		for ( y; z > y; z--) {
			for (var x=0; x < this.width; x++ ) {
				var theChar = this.getData( x, z - amt );
				this.setData( x, z, theChar );
			}
		}
		this.draw();
	},
	shiftLeft: function( x, y, amt ) {
		for ( x; x < this.width; x++ ) {
			// Check if we're within threshold amt
			if ( x < ( this.width - amt) ) {
				var theChar = this.getData( x + amt, y );
				this.setData( x, y, theChar );
			}
			// If not, then this is end of line. Fill with empty space.
			else {
				this.setData( x, y, 32 );
			}
		}
		this.draw();
	},
	shiftRight: function( x, y, amt ) {
		var z = this.width - 1;
		for ( x; z > x; z-- ) {
			var theChar = this.getData( z - amt, y );
			this.setData( z, y, theChar );
		}
		this.setData( x, y, 32 );
		this.draw();
	},
	clearLine: function( y ) {
		for (var x=0; x<this.width; x++) {
			this.setData( x, y, 32 );
		}
		this.draw();
	},
	isLineBlank: function( y ) {
		var lineBlank = true;
		// Iterate over all columns, looking for any character other than space
		for (var x=0; x<this.width; x++) {
			if ( this.getData( x, y ) != 32 ) {
				lineBlank = false;
			}
		}
		return lineBlank;
	},

	draw: function() {
		context.clearRect(x,y,this.width,this.height);
		for (var y=0; y<this.height; y++) {
			for (var x=0; x<this.width; x++) {
				if (this.data[y][x]) {
					this.sprite.draw( this.data[y][x], x*this.spriteWidth, y*this.spriteHeight );
				}
			}
		}
	},
	drawCursor: function(x,y) {
		thisX = x*this.spriteWidth;
		thisY = y*this.spriteHeight;
		context.fillStyle = 'rgba(225,225,0,0.5)';
		context.fillRect(thisX,thisY,this.spriteWidth,this.spriteHeight);
	},
	log: function() {
		var str = '';
		for (var y=0; y<this.height; y++) {
			for (var x=0; x<this.width; x++) {
				str += this.data[y][x];
			}
			str += '\r\n';
		}
// 		console.log(this.data);
// 		console.log(str);
	}
};


function Sprite(img, width, height) {
	this.img = img;
	this.width = width;
	this.height = height;
}
Sprite.prototype = {
	draw: function(position, x, y) {
		context.drawImage(
			this.img,
			position * this.width,
			0,
			this.width,
			this.height,
			x, 
			y,
			this.width,
			this.height
		);
	}
};

function diagnosticRender( direction ) {
	// make global copies of the stream for diagnostic tools
	masterIndex = masterIndex + direction;
	// call the draw routine
	drawChar(masterStream,masterIndex);
}

function render( stream ) {
	// make global copies of the stream for diagnostic tools
	masterIndex = 0;
	masterStream = stream.slice(0);
	// output stream length
	if (diagnosticMode) {
		console.log('stream.length: ' + stream.length);
		console.log(stream);
	}
	// call the draw routine
	drawChar(stream,0);
}

function drawChar(stream,i) {
	var streamLen = stream.length;
	if (i < streamLen ) {
		var charCode = stream[i];
		var msg = '';
		if (charCode == 20) { msg = '●'; }
		if (charCode == 27) { msg = '[esc]'; }
		if (charCode == 28) { msg = '[up]'; }
		if (charCode == 29) { msg = '[down]'; }
		if (charCode == 30) { msg = '[left]'; }
		if (charCode == 31) { msg = '[right]'; }
		if (charCode == 125) { msg = '[clear screen]'; }
		if (charCode == 126) { msg = '[delete]'; }
		if (charCode == 127) { msg = '[tab]'; }
		if (charCode == 155) { msg = '[EOL]'; }
		if (charCode == 156) { msg = '[delete line]'; }
		if (charCode == 157) { msg = '[insert line]'; }
		if (charCode == 158) { msg = '[clear tab stop]'; }
		if (charCode == 159) { msg = '[set tab stop]'; }
		if (charCode == 253) { msg = '[buzzer]'; }
		if (charCode == 254) { msg = '[delete char]'; }
		if (charCode == 255) { msg = '[insert char]'; }
		msg = ' ' + msg;
		if ( diagnosticMode ) {
			console.log('i:'+i,'\tx:'+cursor.x,'\ty:'+cursor.y,'\tcode:'+charCode + msg);
		}


		// Parse the ASCII codes

		// Cursor movement
		if ( 
			( charCode >= 28 && charCode <= 31 ) ||
			( charCode >= 125 && charCode <= 127 ) ||
			( charCode >= 155 && charCode <= 159 ) ||
			( charCode >= 253 && charCode <= 255 ) 
		) {
			// Move up
			if (charCode == 28) {
				if (cursor.y > 0) {
					cursor.y -= 1;
				}
				else if (cursor.y == 0) {
					cursor.y = rows-1;
				}
			}
			// Move down
			else if (charCode == 29) {
				if (cursor.y < rows-1) {
					cursor.y += 1;
				}
				else if (cursor.y == rows-1) {
					cursor.y = 0;
				}
			}
			// Move left
			else if (charCode == 30) {
				if (cursor.x > 0) {
					cursor.x -= 1;
				}
				// If cursor is at first col, then we move to the last col
				else if (cursor.x == 0) {
					cursor.x = cols-1;
				}

			}
			// Move right
			else if (charCode == 31) {
				if (cursor.x < cols-1) {
					cursor.x += 1;
				}
				// If cursor is at last col, then we move to the first col
				else if (cursor.x == cols-1) {
					cursor.x = 0;
				}
			}
			// Clear screen and put cursor in upper left
			else if (charCode == 125) {
// 						console.log('CLEAR');
				screen.clearScreen();
				cursor.x = 0;
				cursor.y = 0;
			}
			// Backspace
			else if (charCode == 126) {
				if (cursor.x > 0) {
					// move cursor back one
					cursor.x -= 1;
					// erase character at this point
					screen.setData( cursor.x, cursor.y, 32 );
					screen.draw();
				}
				// If we're on the first column, then we need to go back to
				// last column of previous line and erase whatever character
				// is there. However, if the CURRENT line is blank, we also
				// need to shift the screen up and erase the blank line before
				// moving the cursor and doing what I just described.
				else {
					if ( screen.isLineBlank( cursor.y ) ) {
						// Clear this line
						screen.clearLine( cursor.y );
						// Shift all rows (below this point) up 1 line 
						screen.shiftUp( cursor.y, 1);
					}
					// move cursor to end of previous line
					cursor.x = screen.width - 1;
					cursor.y -= 1;
					// erase character at this point
					screen.setData( cursor.x, cursor.y, 32 );
					screen.draw();
				}
			}
			// Tab 
			// Default value of 8?
			// Looks like tab always moves to a tab stop, not a set # of characters.
			else if (charCode == 127) {
				// Formula to find next tab stop:
				// Add 1 to x, to make it 1-indexed
				// Divide x by tabwidth (8 spaces here)
				// Discard remainder (convert to Int)
				// Add 1
				// Multiply by 8.
				// Subtract 1 (to convert back to 0-index style)
				// Only apply this formula if we're not in the last tab stop range
				if (cursor.x < (screen.width - 9)) {
					var nextStop = (parseInt((cursor.x+1)/8) + 1) * 8 - 1;
					cursor.x = nextStop;
				}
				// If we're in the last tab stop range, move to last character position
				else if (cursor.x < (screen.width - 2)) {
					cursor.x = screen.width - 1;
				}
				// If we're in the 40th column, then treat like an EOL
				else {
					// Move cursor to start of next line
					cursor.x = 0;
					// If we're anywhere but the bottom,
					// simply move to the next row
					if ( cursor.y < screen.height - 1) {
						cursor.y++;
					}
					// If we're at the bottom of the screen,
					// then shift the contents of the screen up 1 row
					else {
						screen.scrollUp(1);
					}
				}


				//  CODE COMING SOON
			}
			// Return / EOL
			else if (charCode == 155) {
				// Move cursor to start of next line
				cursor.x = 0;
				// If we're anywhere but the bottom,
				// simply move to the next row
				if ( cursor.y < screen.height - 1) {
					cursor.y++;
				}
				// If we're at the bottom of the screen,
				// then shift the contents of the screen up 1 row
				else {
					screen.scrollUp(1);
				}
			}
			// Delete Line
			// Seems like this command might actually delete up to 
			// three consecutive lines on screen, if user has typed
			// without hitting 'return'
			else if (charCode == 156) {
				// Clear this line
				screen.clearLine( cursor.y );
				// Move to beginning of line
				cursor.x = 0;
				// Shift all rows (below this point) up 1 line 
				screen.shiftUp( cursor.y, 1);
				// Need to add complexity to handle consecutive lines
			}
			// Insert Line
			else if (charCode == 157) {
				// Move cursor to beginning of line
				cursor.x = 0;
				// Shift all rows (below this point) down 1 line 
				screen.shiftDown( cursor.y, 1);
				// Clear original line
				screen.clearLine( cursor.y );
				// Need to add complexity to handle consecutive lines
			}
			// Buzzer
			else if (charCode == 253) {
				var buzzer = document.getElementById('buzzer');
				buzzer.play();
			}
			// Delete character
			// This command is also multi-line aware.
			else if (charCode == 254) {
				// Shift everything after cursor one char to the left
				screen.shiftLeft( cursor.x, cursor.y, 1);
				// Need to add complexity to handle consecutive lines
			}
			// Insert character
			// This command is also multi-line aware.
			else if (charCode == 255) {
				// Shift everything after cursor one char to the right
				screen.shiftRight( cursor.x, cursor.y, 1);
				// Need to add complexity to handle consecutive lines
			}
		}

		// Character rendering
		else {
			// ATASCII uses escape to indicate that the next byte
			// is a character to be rendered, not a command to execute.
			// So simply increment the index and continue rendering.
			if ( charCode == 27) {
				i++;
				charCode = stream[i];
			}
			screen.setData(cursor.x, cursor.y, charCode);
			screen.draw();
			// If we're on the last column, typing a character is like an EOL.
			// The character gets placed, but everything underneath gets shifted
			// down one line. 
			if ( cursor.x == cols-1 ) {
				// Move cursor to beginning of line
				cursor.x = 0;
				// Move cursor down 1 line
				cursor.y++;
				// Shift all rows (below this point) down 1 line 
				screen.shiftDown( cursor.y, 1);
				// Clear original row
				screen.clearLine( cursor.y );
			}
			else {
				cursor.x++;
			}
		}
		
		if ( diagnosticMode ) {
			screen.drawCursor(cursor.x,cursor.y);
		}

	}

	i++;
	if ( i < streamLen && screen.isPlaying ) {
		setTimeout( function(){ 
			masterIndex = i;
			drawChar(stream,i)
		}, 1);
	}
}
