"use strict";

const owe = require("owe.js");

const nodeTypes = Object.create(null);

const node = {
	Node: require("./Node"),
	NodeExecutor: require("./NodeExecutor"),

	instanciate({ type }) {
		if(!(type in nodeTypes))
			throw new owe.exposed.Error(`Unknown node type '${type}'.`);

		return Object.assign(new nodeTypes[type].Model(), { type });
	},

	create(preset, parentGraph) {
		return this.instanciate(preset).assign(preset, parentGraph);
	},

	createExecutor(preset, parentGraph) {
		if(!(preset.type in nodeTypes))
			throw new owe.exposed.Error(`Unknown node type '${preset.type}'.`);

		return new nodeTypes[preset.type].Executor().assign(preset, parentGraph);
	},

	registerNodeType(type, { Model, Executor }) {
		if(typeof type !== "string")
			throw new TypeError("Node types have to be strings.");

		if(typeof Model !== "function" || typeof Executor !== "function")
			throw new TypeError("Node models and executors have to be classes.");

		if(type in nodeTypes)
			throw new Error(`There already is a '${type}' node type.`);

		nodeTypes[type] = { Model, Executor };
	}
};

node.registerNodeType("data", {
	Model: require("./data/DataNode"),
	Executor: require("./data/DataNodeExecutor")
});
node.registerNodeType("in", {
	Model: require("./io/IoNode"),
	Executor: require("./io/IoNodeExecutor")
});
node.registerNodeType("out", {
	Model: require("./io/IoNode"),
	Executor: require("./io/IoNodeExecutor")
});

module.exports = node;
