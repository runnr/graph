"use strict";

const owe = require("owe.js");
const { mix } = require("mixwith");

const MixinFactory = require("../../helpers/MixinFactory");

const UpdateEmitter = require("../../events/UpdateEmitter");

const graph = Symbol("graph");

const Node = MixinFactory((routableProperties = {}) => superclass => class Node extends mix(superclass).with(UpdateEmitter()) {
	constructor() {
		super(...arguments);

		/* owe binding: */

		const exposed = new Set(["id", "type", "ports"]);
		const routes = new Set([
			...exposed,
			"graph",
			"edges",
			"neighbours",
			"delete"
		]);
		const writable = new Set();

		Object.keys(routableProperties).forEach(property => {
			routes.add(property);

			if(routableProperties[property].exposed)
				exposed.add(property);

			if(routableProperties[property].writable)
				writable.add(property);
		});

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
				writable: owe.filter(writable),
				traversePrototype: true // Allow access to Node.prototype getters
			},
			closer: {
				filter: true,
				writable: true
			}
		}));
		owe.expose.properties(this, exposed);
	}

	assign(preset, parentGraph) {
		if(typeof preset.id !== "number")
			throw new TypeError(`Invalid node id '${preset.id}'.`);

		return Object.assign(this, {
			id: preset.id,
			[graph]: parentGraph
		});
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
		if(!this[graph].writable)
			throw new owe.exposed.Error("The node could not be deleted because its containing graph is not writable.");

		const edges = this.edges;

		edges.in.forEach(edge => edge.delete());
		edges.out.forEach(edge => edge.delete());

		this[UpdateEmitter.delete]();
	}
});

module.exports = Node;
