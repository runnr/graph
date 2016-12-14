"use strict";

const owe = require("owe.js");
const { mixins } = require("@runnr/mixin");
const { internalize } = require("@runnr/helpers");
const { UpdateEmitter } = require("@runnr/events");

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
		return super.assign(preset, graphContainer).then(() => {
			this.name = preset.name;
			this.constraint = preset.constraint;
		});
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
