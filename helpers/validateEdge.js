"use strict";

const owe = require("owe.js");

function validateEdge(edge) {
	if(!(edge.from.port in edge.fromNode.ports.out))
		throw new owe.exposed.Error(`Edge start node does not offer an output port '${edge.from.port}'.`);

	if(!(edge.to.port in edge.toNode.ports.in))
		throw new owe.exposed.Error(`Edge end node does not offer an input port '${edge.to.port}'.`);

	return edge;
}

module.exports = validateEdge;
