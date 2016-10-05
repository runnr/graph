"use strict";

const { Mixin } = require("mixwith");

const generateLock = require("../../helpers/generateLock");

const Port = require("./Port");

const Node = Mixin(superclass => class Node extends superclass {
	constructor() {
		super(...arguments);

		this.loaded = generateLock();
	}

	assign(preset, parentGraph) {
		this.id = preset.id;
		this.type = preset.type;
		this.graph = parentGraph;
		this.api = parentGraph.api.nodes[preset.id];

		this.ports = {
			in: {},
			out: {}
		};

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

module.exports = Node;
