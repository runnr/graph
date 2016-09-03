"use strict";

const owe = require("owe.js");

const { mixins } = require("mixwith");

const UpdateEmitter = require("../../events/UpdateEmitter");

const validateEdge = require("../helpers/validateEdge");

const graph = Symbol("graph");

class Edge extends mixins(UpdateEmitter()) {
	constructor(preset, parentGraph) {
		if(typeof preset.id !== "number")
			throw new TypeError(`Invalid edge id '${preset.id}'.`);

		if(!preset.from || !preset.to || typeof preset.from !== "object" || typeof preset.to !== "object")
			throw new owe.exposed.TypeError("Edge endpoints have to be objects.");

		if(typeof preset.from.node !== "number" || typeof preset.to.node !== "number")
			throw new owe.exposed.TypeError("Edge node ids have to be numbers.");

		if(typeof preset.from.port !== "string" || typeof preset.to.port !== "string")
			throw new owe.exposed.TypeError("Edge ports have to be strings.");

		if(!(preset.from.node in parentGraph.nodes))
			throw new owe.exposed.Error("Edge start node does not exist.");

		if(!(preset.to.node in parentGraph.nodes))
			throw new owe.exposed.Error("Edge end node does not exist.");

		if(parentGraph.edges)
			for(const id of Object.keys(parentGraph.edges)) {
				const edge = parentGraph.edges[id];

				if(edge.from.node === preset.from.node && edge.from.port === preset.from.port
					&& edge.to.node === preset.to.node && edge.to.port === preset.to.port)
					throw Object.assign(new owe.exposed.Error("There already is an edge between the given ports."), {
						existingEdge: edge.id
					});
			}

		super();

		Object.assign(this, {
			id: preset.id,
			[graph]: parentGraph,
			from: {
				node: preset.from.node,
				port: preset.from.port
			},
			to: {
				node: preset.to.node,
				port: preset.to.port
			}
		});

		// Check if I/O ports exist and that their constraints are compatible:
		validateEdge(this);

		/* owe binding: */

		const exposed = ["id", "from", "to"];
		const routes = new Set([...exposed, "delete"]);

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
				traversePrototype: true // Allow access to Edge.prototype getters
			},
			closer: {
				filter: true
			}
		}));
		owe.expose.properties(this, exposed);
	}

	get fromNode() {
		return this[graph].nodes[this.from.node];
	}

	get toNode() {
		return this[graph].nodes[this.to.node];
	}

	delete() {
		if(!this.graph.writable)
			throw new owe.exposed.Error("The edge could not be deleted because its containing graph is not writable.");

		this[UpdateEmitter.delete]();
	}
}

module.exports = Edge;
