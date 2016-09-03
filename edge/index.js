"use strict";

const Edge = require("./Edge");

module.exports = {
	create(preset, parentGraph) {
		return new Edge(preset, parentGraph);
	}
};
