"use strict";

const Edge = require("./Edge");

module.exports = {
	create(preset, parentGraph) {
		return Promise.resolve(new Edge(preset, parentGraph));
	}
};
