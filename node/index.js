"use strict";

const owe = require("owe.js");

const Node = require("./Node");

const nodeTypes = {
	__proto__: null,

	data: require("./DataNode")
};

module.exports = {
	Node,

	create(preset, parentGraph) {
		if(!(preset.type in nodeTypes))
			throw new owe.exposed.Error(`Unknown node type '${preset.type}'.`);

		return new nodeTypes[preset.type]().assign(preset, parentGraph);
	},

	registerNodeType(type, nodeType) {
		if(typeof type !== "string")
			throw new TypeError("Node types have to be strings.");

		if(type in nodeTypes && nodeType !== nodeTypes[nodeType])
			throw new Error(`There already is a '${type}' node type.`);

		nodeTypes[type] = nodeType;

		return nodeType;
	}
};
