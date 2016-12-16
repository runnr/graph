"use strict";

const { mixins } = require("@runnr/mixin");

const NodeExecutor = require("../NodeExecutor");

class IoNodeExecutor extends mixins(NodeExecutor) {
	assign(preset, parentGraph) {
		return super.assign(preset, parentGraph)
			.then(() => this.api.name)
			.then(name => {
				if(this.type === "in") {
					if(!this.graph.in[name])
						throw new ReferenceError(`There is no graph input named '${name}'.`);

					this.graph.in[name].pipe(this.ports.out.data.writable);
				}
				else {
					if(!this.graph.out[name])
						throw new ReferenceError(`There is no graph output named '${name}'.`);

					this.ports.in.data.readable.pipe(this.graph.out[name]);
				}
			});
	}
}

module.exports = IoNodeExecutor;
