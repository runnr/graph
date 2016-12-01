"use strict";

const { mixins } = require("@runnr/mixin");

const NodeExecutor = require("../NodeExecutor");

class DataNodeExecutor extends mixins(NodeExecutor) {
	assign(preset, parentGraph) {
		const assigned = super.assign(preset, parentGraph);

		assigned.then(() => Promise.all([this.api.data, this.graph.connected]))
			.then(([data]) => this.ports.out.data.writable.write(data));

		return assigned;
	}
}

module.exports = DataNodeExecutor;
