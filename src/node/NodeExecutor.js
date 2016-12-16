"use strict";

const { mix, Mixin } = require("@runnr/mixin");
const { Assignable } = require("@runnr/helpers");

const Port = require("./Port");

const NodeExecutor = Mixin(superclass => class NodeExecutor extends mix(superclass).with(Assignable) {
	assign(preset, parentGraph) {
		Object.assign(this, {
			id: preset.id,
			type: preset.type,
			graph: parentGraph,
			api: parentGraph.api.nodes[preset.id],
			ports: {
				in: {},
				out: {}
			}
		});

		return this.api.ports.then(ports => {
			Object.keys(ports.in).forEach(portName => {
				this.ports.in[portName] = new Port(ports.in[portName]);
			});

			Object.keys(ports.out).forEach(portName => {
				this.ports.out[portName] = new Port(ports.out[portName]);
			});
		});
	}
});

module.exports = NodeExecutor;
