"use strict";

const owe = require("owe.js");
const { mixins } = require("mixwith");

const EventEmitter = require("../helpers/EventEmitter");

const graph = Symbol("graph");
const oweExposed = Symbol("exposed");
const oweRoutes = Symbol("routes");
const oweWritable = Symbol("writable");
const expose = Symbol("expose");

class Node extends mixins(EventEmitter) {
	constructor(preset, parentGraph) {
		// Node is an abstract class.
		// If instanciated directly, the intended concrete class will be read from preset.type and instanciated instead:
		if(new.target === Node) {
			if(typeof preset.id !== "number")
				throw new TypeError(`Invalid node id '${preset.id}'.`);

			if(!(preset.type in nodeTypes))
				throw new owe.exposed.Error(`Unknown node type '${preset.type}'.`);

			return Object.assign(new nodeTypes[preset.type](preset), {
				id: preset.id,
				type: preset.type,
				[graph]: parentGraph
			});
		}

		super();

		/* owe binding: */

		const exposed = this[oweExposed] = ["id", "type", "ports"];
		const routes = this[oweRoutes] = new Set([
			...exposed,
			"graph",
			"edges",
			"neighbours",
			"delete"
		]);

		owe(this, owe.serve({
			router: {
				deep: true,
				filter: owe.switch((destination, state) => state.value === this ? "root" : "deep", {
					// Allow all routes included in "routes" for this instance:
					root: owe.filter(routes),
					// Allow all routes for child objects of this instance:
					deep(destination, state) {
						return state.value.hasOwnProperty(destination);
					}
				}),
				writable: owe.filter(this[oweWritable] = new Set()),
				traversePrototype: true // Allow access to Node.prototype getters
			},
			closer: {
				filter: true,
				writable: true
			}
		}));
		owe.expose.properties(this, exposed);
	}

	[expose](property, options) {
		if(Array.isArray(property))
			return property.map(property => this[expose](property, options));

		this[oweRoutes].add(property);

		if(options && options.serializable)
			this[oweExposed].push(property);

		if(options && options.writable)
			this[oweWritable].add(property);
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

Object.assign(Node, { expose });

module.exports = Node;

const nodeTypes = {
	__proto__: null,

	data: require("./DataNode"),
	plugin: require("./PluginNode")
};
