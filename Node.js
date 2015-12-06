"use strict";

const owe = require("owe.js");

const graph = Symbol("graph");
const oweRoutes = Symbol("routes");
const oweWritable = Symbol("writable");

class Node extends require("events") {
	constructor(preset, parentGraph) {
		// Node is an abstract class.
		// If instanciated directly, the intended concrete class will be read from preset.type and instanciated instead:
		if(new.target === Node) {
			if(typeof preset.id !== "number")
				throw new TypeError(`Invalid node id '${preset.id}'.`);

			if(!(preset.type in nodeTypes))
				throw new owe.exposed.Error(`Unknown node type '${preset.type}'.`);

			return Object.assign(new nodeTypes[preset.type](preset, parentGraph), {
				id: preset.id,
				type: preset.type
			});
		}

		super();

		this[graph] = parentGraph;

		/* owe binding: */

		const exposed = ["id", "type", "ports", ...preset];
		const routes = this[oweRoutes] = new Set([
			...exposed,
			"graph",
			"edges",
			"neighbours",
			"delete"
		]);

		const that = this;

		owe(this, owe.serve({
			router: {
				deep: true,
				filter: owe.switch(function() {
					return this.value === that ? "root" : "deep";
				}, {
					// Allow all routes included in "routes" for this instance:
					root: routes,
					// Allow all routes for child objects of this instance:
					deep: true
				}),
				writable: this[oweWritable] = new Set()
			},
			closer: {
				filter: true
			}
		}));
		owe.expose.properties(this, exposed);
	}

	get graph() {
		return this[graph];
	}

	get ports() {
		throw new owe.exposed.Error(`Node#ports was not implemented by '${this.constructor.name}'.`);
	}

	get edges() {
		const res = {
			in: new Set(),
			out: new Set()
		};

		Object.keys(this[graph].edges).forEach(id => {
			const edge = this[graph].edges[id];

			if(edge.from.node === this.id)
				res.out.add(edge);
			else if(edge.to.node === this.id)
				res.in.add(edge);
		});

		return {
			in: [...res.in],
			out: [...res.out]
		};
	}

	get neighbours() {
		const edges = this.edges;

		return {
			before: [...new Set(edges.in.map(edge => edge.fromNode))],
			after: [...new Set(edges.out.map(edge => edge.toNode))]
		};
	}

	delete() {
		const edges = this.edges;

		edges.in.forEach(edge => edge.delete());
		edges.out.forEach(edge => edge.delete());

		this.emit("delete");
	}
}

Object.assign(Node, {
	routes: oweRoutes,
	writable: oweWritable
});

module.exports = Node;

const nodeTypes = {
	__proto__: null,

	data: require("./DataNode"),
	plugin: require("./PluginNode")
};
