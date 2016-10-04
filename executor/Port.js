"use strict";

const stream = require("stream");

const constraints = require("../constraints");

class Port {
	constructor({ constraint, binary }) {
		const readable = this.readable = new stream.Readable({
			read() {},
			objectMode: !binary
		});

		this.writable = new stream.Writable({
			write(data, encoding, callback) {
				try {
					readable.push(constraints.match(data, constraint));
				}
				catch(err) {}

				callback();
			},
			objectMode: !binary
		});

		this.writable.setDefaultEncoding("utf8");
	}
}

module.exports = Port;
