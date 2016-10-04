"use strict";

const Node = require("./Node");

class DataNode extends Node {
	constructor(preset, parentGraph) {
		super(preset, parentGraph);

		Promise.all([this.api.data, this.graph.connected]).then(([data]) => {
			this.ports.out.data.writable.write(data);
		});
	}
}

module.exports = DataNode;
