"use strict";

const owe = require("owe.js");

const Node = require("./Node");
const plugins = require("../plugins");

class PluginNode extends Node {
	constructor(preset, parentGraph) {
		super(["name"], parentGraph);
		this[Node.routes].add("plugin");

		this.name = preset.name;

		Object.defineProperty(this, "plugin", {
			enumerable: false,
			value: plugins.getByName(this.name)
		});

		if(!this.plugin)
			throw new owe.exposed.Error(`There is no plugin with the name '${this.name}'.`);

		this.plugin.addDependentNode(this);
	}

	get ports() {
		return this.plugin.ports;
	}
}

module.exports = PluginNode;
