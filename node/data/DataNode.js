"use strict";

const owe = require("owe.js");
const { mixins } = require("mixwith");

const internalize = require("../../../helpers/internalize");
const UpdateEmitter = require("../../../events/UpdateEmitter");

const Node = require("../Node")({
	data: {
		exposed: true,
		writable: true
	},
	constraint: {
		exposed: true,
		writable: true
	}
});

const constraints = require("../../constraints");

const gotData = Symbol("gotData");

class DataNode extends mixins(Node, UpdateEmitter(["data", "constraint"])) {
	constructor() {
		super(...arguments);
		internalize(this, ["data", "constraint"]);
	}

	assign(preset, graphContainer) {
		super.assign(preset, graphContainer);

		this[gotData] = false;

		this.constraint = preset.constraint;

		if(preset.data !== undefined)
			this.data = preset.data;

		return this;
	}

	get ports() {
		return {
			in: {},
			out: {
				data: {
					constraint: this.constraint
				}
			}
		};
	}

	get data() {
		return super.data;
	}
	set data(value) {
		if(this[gotData] && !this.graph.writable)
			throw new owe.exposed.Error("The node could not be changed because its containing graph is not writable.");

		super.data = constraints.match(value, this.constraint);
		this[gotData] = true;
	}

	get constraint() {
		return super.constraint;
	}
	set constraint(value) {
		if(this[gotData] && !this.graph.writable)
			throw new owe.exposed.Error("The node could not be changed because its containing graph is not writable.");

		super.constraint = constraints.validate(value);

		// Remove data from this DataNode if the new constraint does not allow it:
		if(this[gotData])
			try {
				constraints.match(this.data, this.constraint);
			}
			catch(err) {
				this.data = undefined;
			}
	}
}

module.exports = DataNode;
