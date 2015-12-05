"use strict";

const internalize = require("../helpers/internalize");

const Node = require("./Node");

const plugins = require("../plugins");

const data = Symbol("data");
const constraint = Symbol("constraint");

class DataNode extends Node {
	constructor(preset, parentGraph) {
		super(["data", "constraint"], parentGraph);
		this[Node.writable].add("data", "constraint");
		internalize(this, ["data", "constraint"]);

		this.constraint = preset.constraint;
		this.data = preset.data;

		Object.defineProperty(this, "ports", {
			value: {
				in: {},
				out: {
					data: this.constraint
				}
			}
		});
	}

	get data() {
		return this[data];
	}
	set data(value) {
		this[data] = plugins.constraints.match(value, this.constraint);
	}

	get constraint() {
		return this[constraint];
	}
	set constraint(value) {
		this[constraint] = plugins.constraints.validate(value);

		// Remove data from this DataNode if the new constraint does not allow it:
		if(data in this)
			try {
				plugins.constraints.match(this[data], this[constraint]);
			}
			catch(err) {
				this[data] = undefined;
			}
	}
}

module.exports = DataNode;
