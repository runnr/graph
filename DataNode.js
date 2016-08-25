"use strict";

const internalize = require("../helpers/internalize");
const { update, type: updateType } = require("../helpers/UpdateEmitter");

const Node = require("./Node");

const constraints = require("./constraints");

const data = Symbol("data");
const constraint = Symbol("constraint");

class DataNode extends Node {
	constructor(preset) {
		super();
		this[Node.expose](["data", "constraint"], {
			serializable: true,
			writable: true
		});
		internalize(this, ["data", "constraint"]);

		this.constraint = preset.constraint;

		if(preset.data !== undefined)
			this.data = preset.data;

		Object.defineProperty(this, "ports", {
			get: () => ({
				in: {},
				out: {
					data: {
						constraint: this.constraint
					}
				}
			})
		});
	}

	get data() {
		return this[data];
	}
	set data(value) {
		this[data] = constraints.match(value, this.constraint);
		this[update](updateType.change("data"), value);
	}

	get constraint() {
		return this[constraint];
	}
	set constraint(value) {
		this[constraint] = constraints.validate(value);

		// Remove data from this DataNode if the new constraint does not allow it:
		if(data in this)
			try {
				constraints.match(this[data], this[constraint]);
			}
			catch(err) {
				this[data] = undefined;
			}

		this[update](updateType.change("constraint"), value);
	}
}

module.exports = DataNode;
