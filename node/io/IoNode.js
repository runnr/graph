"use strict";

const owe = require("owe.js");
const { mixins } = require("mixwith");

const internalize = require("../../../helpers/internalize");
const UpdateEmitter = require("../../../events/UpdateEmitter");

const Node = require("../Node")({
	name: {
		exposed: true,
		writable: true
	},
	constraint: {
		exposed: true,
		writable: true
	},
	port: {}
});

const constraints = require("../../constraints");

class IoNode extends mixins(Node, UpdateEmitter(["name", "constraint"])) {
	constructor() {
		super(...arguments);
		internalize(this, ["name", "constraint"]);
	}

	assign(preset, graphContainer) {
		super.assign(preset, graphContainer);

		this.name = preset.name;
		this.constraint = preset.constraint;

		return this;
	}

	get ports() {
		const port = {
			data: this.port
		};

		return this.type === "in" ? {
			in: {},
			out: port
		} : {
			in: port,
			out: {}
		};
	}

	get port() {
		return {
			constraint: this.constraint
		};
	}

	get name() {
		return super.name;
	}
	set name(value) {
		if(!this.graph.writable)
			throw new owe.exposed.Error("The node could not be changed because its containing graph is not writable.");

		super.name = value;
	}

	get constraint() {
		return super.constraint;
	}
	set constraint(value) {
		if(!this.graph.writable)
			throw new owe.exposed.Error("The node could not be changed because its containing graph is not writable.");

		super.constraint = constraints.validate(value);
	}
}

module.exports = IoNode;
