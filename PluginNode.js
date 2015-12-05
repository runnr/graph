"use strict";

const owe = require("owe.js");

const Node = require("./Node");
const plugins = require("../plugins");

class PluginNode extends Node {
	constructor(preset, parentGraph) {
		super(["name"], parentGraph);
		this[Node.routes].add("plugin");

		this.name = preset.name;
	}

	get plugin() {
		const plugin = plugins.get(this.name);

		if(!plugin)
			throw new owe.exposed.Error(`There is no plugin with the name '${this.name}'.`);

		return plugin;
	}

	get ports() {
		return this.plugin.ports;
	}
}

module.exports = PluginNode;
