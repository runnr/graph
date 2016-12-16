"use strict";

const owe = require("owe.js");

const node = require("../node");

class GraphExecutor {
	constructor(graph, io = { in: {}, out: {} }) {
		if(!io || typeof io !== "object" || typeof io.in !== "object" || typeof io.out !== "object")
			throw new TypeError("Graph executors IO data has to be an object of the form { in: [in object], out: [out object] }.");

		Object.assign(this, {
			nodeMap: new Map(),
			api: graph,
			in: io.in,
			out: io.out
		});

		this.connected = graph.then(graph => {
			const nodes = graph.nodes;
			const edges = graph.edges;

			return Promise.all(Object.keys(nodes).map(nodeId => {
				return node.createExecutor(nodes[nodeId], this)
					.then(executor => {
						this.nodeMap.set(nodes[nodeId].id, executor);

						return executor.assigned;
					});
			})).then(() => Object.keys(edges).forEach(edgeId => {
				const edge = edges[edgeId];
				const fromNode = this.getNode(edge.from.node);
				const toNode = this.getNode(edge.to.node);

				if(!fromNode)
					throw new Error(`Could not find node ${edge.from.node}.`);

				if(!toNode)
					throw new Error(`Could not find node ${edge.to.node}.`);

				const source = fromNode.ports.out[edge.from.port];

				if(!source)
					throw new Error(`Could not find port '${edge.from.port}' in node ${fromNode.id}.`);

				const target = toNode.ports.in[edge.to.port];

				if(!target)
					throw new Error(`Could not find port '${edge.to.port}' in node ${toNode.id}.`);

				source.readable.pipe(target.writable);
			}));
		});

		owe(this);
	}

	getNode(id) {
		return this.nodeMap.get(id);
	}
}

module.exports = GraphExecutor;
