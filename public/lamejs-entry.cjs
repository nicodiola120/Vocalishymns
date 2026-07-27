// Polyfill: Lame.js references MPEGMode as a bare global without importing it
var MPEGMode = require('./node_modules/lamejs/src/js/MPEGMode.js');
module.exports = require('./node_modules/lamejs/src/js/index.js');
