"use strict";

const { Mixin } = require("mixwith");

const generateLock = require("../../helpers/generateLock");

const Port = require("./Port");

const NodeExecutor = Mixin(superclass => class NodeExecutor extends superclass {
	constructor() {
		super(...arguments);

		this.loaded = generateLock();
	}

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

		this.api.ports.then(ports => {
			Object.keys(ports.in).forEach(portName => {
				this.ports.in[portName] = new Port(ports.in[portName]);
			});

			Object.keys(ports.out).forEach(portName => {
				this.ports.out[portName] = new Port(ports.out[portName]);
			});
		}).then(this.loaded.unlock);
	}
});

module.exports = NodeExecutor;
