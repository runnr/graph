"use strict";

const owe = require("owe.js");

const Node = require("./Node");
const plugins = require("../plugins");

class PluginNode extends Node {
	constructor(preset) {
		super();
		this[Node.expose]("pluginId", {
			serializable: true
		});
		this[Node.expose]("plugin");

		this.pluginId = preset.pluginId;

		Object.defineProperty(this, "plugin", {
			enumerable: false,
			value: plugins.getById(this.pluginId)
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
