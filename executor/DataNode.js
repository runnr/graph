"use strict";

const { mixins } = require("mixwith");

const Node = require("./Node");

class DataNode extends mixins(Node) {
	constructor(preset, parentGraph) {
		super();

		this.assign(preset, parentGraph);

		Promise.all([this.api.data, this.graph.connected]).then(([data]) => {
			this.ports.out.data.writable.write(data);
		});
	}
}

module.exports = DataNode;
