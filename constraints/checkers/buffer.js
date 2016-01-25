"use strict";

function buffer(value) {
	return value instanceof Buffer;
}

buffer.binary = true;

module.exports = buffer;
