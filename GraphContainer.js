"use strict";

const { Mixin } = require("mixwith");

const Graph = require("./Graph");

const graph = Symbol("graph");

module.exports = Mixin(superclass => class GraphContainer extends superclass {
	get graph() {
		return this[graph];
	}

	set graph(val) {
		if(!(val instanceof Graph))
			throw new TypeError("Runner#graph has to be an instance of Graph.");

		this[graph] = val;
	}
});
