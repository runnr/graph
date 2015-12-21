"use strict";

const owe = require("owe.js");
const internalize = require("../helpers/internalize");
const Node = require("./Node");
const Edge = require("./Edge");

const container = Symbol("container");
const nodes = Symbol("nodes");
const edges = Symbol("edges");
const update = Symbol("update");

class Graph extends require("../EventEmitter") {
	constructor(preset, parentContainer) {
		super();
		Object.assign(this, preset);
		internalize(this, ["nodes", "edges"]);

		this[container] = parentContainer;

		if(!this.nodes)
			this.nodes = {};

		if(!this.edges)
			this.edges = {};

		if(!this.idCount)
			this.idCount = 0;

		/* owe binding: */

		const exposed = ["nodes", "edges"];

		owe(this, owe.serve({
			router: {
				filter: new Set([...exposed, "container"])
			},
			closer: {
				filter: true
			}
		}));
		owe.expose.properties(this, exposed);
	}

	[update](type, value) {
		// Emit update to notify this graph's runner, which then sets a dirty mark to trigger DB persistence:
		this.emit("update");
		this.emit(type, value);
	}

	get container() {
		return this[container];
	}

	get nodes() {
		return this[nodes];
	}
	set nodes(val) {
		this[nodes] = operations.prepareGraphList(this, "Node", val);

		this[update]("updateNodes");
	}

	get edges() {
		return this[edges];
	}
	set edges(val) {
		this[edges] = operations.prepareGraphList(this, "Edge", val);

		this[update]("updateEdges");
	}
}

const operations = {
	prepareGraphList(graph, type, val) {
		Object.keys(val).forEach(id => val[id] = operations[`instanciate${type}`](graph, val[id]));

		Object.defineProperty(val, "add", {
			value: this[`add${type}`].bind(this, graph)
		});

		return owe(val, owe.chain([
			owe.serve({
				closer: {
					filter: true
				}
			}), {
				router: this[`get${type}`].bind(this, graph)
			}
		]), "rebind");
	},

	instanciateNode(graph, node) {
		node = node instanceof Node ? node : new Node(node, graph);
		node.on("delete", this.deleteNode.bind(this, graph, node.id));
		return node;
	},

	instanciateEdge(graph, edge) {
		edge = new Edge(edge, graph);
		edge.on("delete", this.deleteEdge.bind(this, graph, edge.id));
		return edge;
	},

	addNode(graph, node) {
		if(!node || typeof node !== "object")
			throw new owe.exposed.TypeError("Nodes have to be objects.");

		const id = graph.idCount + 1;

		node.id = id;

		node = graph.nodes[id] = this.instanciateNode(graph, node);
		graph.idCount = id;

		graph[update]("addNode", node);

		return node;
	},

	addEdge(graph, edge) {
		if(!edge || typeof edge !== "object")
			throw new owe.exposed.TypeError("Edges have to be objects.");

		const id = graph.idCount + 1;

		edge.id = id;
		edge = graph.edges[id] = this.instanciateEdge(graph, edge);
		graph.idCount = id;

		graph[update]("addEdge", edge);

		return edge;
	},

	getNode(graph, id) {
		if(!(id in graph.nodes))
			throw new owe.exposed.Error(`There is no node with the id ${id}.`);

		return graph.nodes[id];
	},

	getEdge(graph, id) {
		if(!(id in graph.edges))
			throw new owe.exposed.Error(`There is no edge with the id ${id}.`);

		return graph.edges[id];
	},

	deleteNode(graph, id) {
		if(!(id in graph.nodes))
			throw new owe.exposed.Error(`There is no node with the id ${id}.`);

		delete graph.nodes[id];

		graph[update]("deleteNode", id);
	},

	deleteEdge(graph, id) {
		if(!(id in graph.edges))
			throw new owe.exposed.Error(`There is no edge with the id ${id}.`);

		delete graph.edges[id];

		graph[update]("deleteEdge", id);
	}
};

module.exports = Graph;
