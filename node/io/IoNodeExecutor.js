"use strict";

const { mixins } = require("mixwith");

const NodeExecutor = require("../NodeExecutor");

class IoNodeExecutor extends mixins(NodeExecutor) {
	assign(preset, parentGraph) {
		super.assign(preset, parentGraph);

		Promise.all([this.api.name]).then(([name]) => {
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

		return this;
	}
}

module.exports = IoNodeExecutor;
