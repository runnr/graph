"use strict";

const Port = require("./Port");

class Node {
	constructor(preset, parentGraph) {
		// Node is an abstract class.
		// If instanciated directly, the intended concrete class will be read from preset.type and instanciated instead:
		if(new.target === Node) {
			if(!(preset.type in nodeTypes))
				throw new Error(`Unknown node type '${preset.type}'.`);

			return new nodeTypes[preset.type](preset, parentGraph);
		}

		this.id = preset.id;
		this.type = preset.type;
		this.graph = parentGraph;
		this.api = parentGraph.api.nodes[preset.id];

		this.ports = {
			in: {},
			out: {}
		};

		this.loaded = this.api.ports.then(ports => {
			Object.keys(ports.in).forEach(portName => {
				this.ports.in[portName] = new Port(ports.in[portName]);
			});

			Object.keys(ports.out).forEach(portName => {
				this.ports.out[portName] = new Port(ports.out[portName]);
			});
		});
	}
}

module.exports = Node;

const nodeTypes = {
	__proto__: null,

	data: require("./DataNode"),
	plugin: require("./PluginNode")
};
