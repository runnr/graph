"use strict";

const { mix, Mixin } = require("mixwith");

const UpdateEmitter = require("../events/UpdateEmitter");
const Persistable = require("../store/Persistable");

const Graph = require("./Graph");

module.exports = Mixin(superclass => class GraphContainer extends mix(superclass).with(UpdateEmitter(["graph"])) {
	get graph() {
		return super.graph;
	}

	set graph(val) {
		if(!(val instanceof Graph))
			throw new TypeError(`${this.constructor.name}#graph has to be an instance of Graph.`);

		if(val === super.graph)
			return;

		if(this instanceof Persistable) {
			if(super.graph)
				super.graph.removeListener("update", this.persist);

			val.on("update", this.persist);
		}

		super.graph = val;
	}
});
