"use strict";

const owe = require("owe.js");
const { mixins } = require("mixwith");

const Node = require("./Node");
const plugins = require("../plugins");

class PluginNode extends mixins(Node({
	pluginId: {
		exposed: true
	},
	plugin: {}
})) {
	assign(preset, parentGraph) {
		super.assign(preset, parentGraph);

		this.pluginId = preset.pluginId;

		Object.defineProperty(this, "plugin", {
			enumerable: false,
			configurable: true,
			value: plugins.getById(this.pluginId)
		});

		if(!this.plugin)
			throw new owe.exposed.Error(`There is no plugin with the name '${this.name}'.`);

		this.plugin.addDependentNode(this);

		this.loaded = this.plugin.loaded;

		return this;
	}

	get ports() {
		return this.plugin.ports;
	}
}

module.exports = PluginNode;
