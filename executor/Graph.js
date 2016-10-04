"use strict";

const owe = require("owe.js");

const Node = require("./Node");

class Graph {
	constructor(graph) {
		this.nodeMap = new Map();
		this.api = graph;

		this.connected = graph.then(graph => {
			const nodes = graph.nodes;
			const edges = graph.edges;

			Object.keys(nodes).forEach(nodeId => this.nodeMap.set(
				nodes[nodeId].id, new Node(nodes[nodeId], this)
			));

			return Promise.all(Object.keys(edges).map(edgeId => {
				const edge = edges[edgeId];
				const fromNode = this.get(edge.from.node);
				const toNode = this.get(edge.to.node);

				if(!fromNode)
					throw new Error(`Could not find node ${edge.from.node}.`);

				if(!toNode)
					throw new Error(`Could not find node ${edge.to.node}.`);

				return Promise.all([fromNode.loaded, toNode.loaded]).then(() => {
					const source = fromNode.ports.out[edge.from.port];

					if(!source)
						throw new Error(`Could not find port '${edge.from.port}' in node ${fromNode.id}.`);

					const target = toNode.ports.in[edge.to.port];

					if(!target)
						throw new Error(`Could not find port '${edge.to.port}' in node ${toNode.id}.`);

					source.readable.pipe(target.writable);
				});
			}));
		});

		owe(this);
	}

	get(id) {
		return this.nodeMap.get(id);
	}
}

module.exports = Graph;
