"use strict";

const { mix, Mixin } = require("@runnr/mixin");

const UpdateEmitter = require("../events/UpdateEmitter");
const Persistable = require("../store/Persistable");

module.exports = Mixin(superclass => class GraphContainer extends mix(superclass).with(UpdateEmitter(["graph"])) {
	get graph() {
		return super.graph;
	}

	set graph(val) {
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
