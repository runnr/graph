"use strict";

const { mixins } = require("mixwith");

const NodeExecutor = require("./NodeExecutor");

class DataNodeExecutor extends mixins(NodeExecutor) {
	assign(preset, parentGraph) {
		super.assign(preset, parentGraph);

		Promise.all([this.api.data, this.graph.connected]).then(([data]) => {
			this.ports.out.data.writable.write(data);
		});

		return this;
	}
}

module.exports = DataNodeExecutor;
