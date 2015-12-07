"use strict";

const owe = require("owe.js");

const graph = Symbol("graph");

class Edge extends require("events") {
	constructor(preset, parentGraph) {
		if(preset instanceof Edge)
			return preset;

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

		if(!(this.from.port in this.fromNode.ports.out))
			throw new owe.exposed.Error(`Edge start node does not offer an output port '${this.from.port}'.`);

		if(!(this.to.port in this.toNode.ports.in))
			throw new owe.exposed.Error(`Edge end node does not offer an input port '${this.to.port}'.`);

		/* owe binding: */

		const that = this;
		const exposed = ["id", "from", "to"];
		const routes = new Set([...exposed, "delete"]);

		owe(this, owe.serve({
			router: {
				deep: true,
				filter: owe.switch(function() {
					return this.value === that ? "root" : "deep";
				}, {
					// Allow all routes included in "routes" for this instance:
					root: routes,
					// Allow all routes for child objects of this instance:
					deep(route) {
						return this.value.hasOwnProperty(route);
					}
				})
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
		this.emit("delete");
	}
}

module.exports = Edge;
