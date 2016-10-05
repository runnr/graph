"use strict";

const { mixins } = require("mixwith");
const sandboxedModule = require("sandboxed-module");

const Node = require("./Node");
const SandboxHandle = require("./SandboxHandle");

class PluginNode extends mixins(Node) {
	constructor(preset, parentGraph) {
		super();

		this.assign(preset, parentGraph);

		this.plugin = this.api.plugin;

		Promise.all([this.plugin.mainLocation, this.loaded]).then(([mainLocation]) => {
			this.sandbox = sandboxedModule.load(mainLocation, {
				globals: {
					runnr: new SandboxHandle(this)
				}
			});
		}).catch(() => process.exit(1));
	}
}

module.exports = PluginNode;
