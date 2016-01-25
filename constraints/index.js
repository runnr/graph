"use strict";

const owe = require("owe.js");

const checkers = {
	__proto__: null,

	none() {
		return true;
	},
	string: require("./checkers/string"),
	number: require("./checkers/number"),
	boolean: require("./checkers/boolean"),
	period: require("./checkers/period"),
	date: require("./checkers/date"),
	buffer: require("./checkers/buffer"),
	file: require("./checkers/file")
};

module.exports = {
	validate(constraint) {
		if(constraint instanceof Array) {
			if(constraint.length === 0)
				throw new owe.exposed.Error("Empty constraint lists are invalid.");

			return constraint.map(constraint => {
				if(constraint instanceof Array)
					throw new owe.exposed.Error("Nested constraint lists are invalid.");

				return this.validate(constraint)[0];
			});
		}

		if(constraint == null)
			constraint = "none";

		if(typeof constraint !== "object")
			constraint = {
				name: constraint,
				meta: {}
			};

		if(!constraint.meta || typeof constraint.meta !== "object")
			throw new owe.exposed.Error("Constraint metadata has to be an object.");

		if(!(constraint.name in checkers))
			throw new owe.exposed.Error(`Invalid constraint '${constraint}'.`);

		return [constraint];
	},

	match(data, constraint) {
		if(!constraint.some(constraint => checkers[constraint.name](data, constraint.meta)))
			throw new owe.exposed.Error(`'${data}' does not pass the given constraints.`);

		return data;
	}
};
