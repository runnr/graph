"use strict";

const { Mixin } = require("mixwith");

const UpdateEmitter = require("../events/UpdateEmitter");

const Graph = require("./Graph");

const graph = Symbol("graph");

const eventType = UpdateEmitter.type.change("graph");

module.exports = Mixin(superclass => class GraphContainer extends superclass {
	get graph() {
		return this[graph];
	}

	set graph(val) {
		if(!(val instanceof Graph))
			throw new TypeError(`${this.constructor.name}#graph has to be an instance of Graph.`);

		if(val === this[graph])
			return;

		if(this.persist) {
			if(this[graph])
				this[graph].removeListener("update", this.persist);

			if(val)
				val.on("update", this.persist);
		}

		this[graph] = val;

		if(this[UpdateEmitter.update])
			this[UpdateEmitter.update](eventType, val);
	}
});
