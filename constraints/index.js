"use strict";

const owe = require("owe.js");

const constraints = {
	none() {},
	string() {},
	number() {},
	integer() {},
	boolean() {},
	date() {},
	time() {},
	datetime() {},
	period() {},
	file() {},
	directory() {}
};

module.exports = {
	validate(constraint) {
		if(constraint == null)
			constraint = "none";

		if(!(constraint in constraints))
			throw new owe.exposed.Error(`Invalid constraint '${constraint}'.`);

		return constraint;
	},

	match(data, constraint) {
		constraint = this.validate(constraint);

		return data;
	}
};
