"use strict";

const owe = require("owe.js");
const { mixins } = require("mixwith");

const EventEmitter = require("../helpers/EventEmitter");
const internalize = require("../helpers/internalize");
const filterObject = require("../helpers/filterObject");
const Node = require("./Node");
const Edge = require("./Edge");

const container = Symbol("container");
const nodes = Symbol("nodes");
const edges = Symbol("edges");
const update = Symbol("update");

class Graph extends mixins(EventEmitter) {
	constructor(parentContainer) {
		super();
		internalize(this, ["nodes", "edges"]);

		Object.assign(this, {
			[container]: parentContainer,
			[nodes]: {},
			[edges]: {},
			idCount: 0
		});

		/* owe binding: */

		const exposed = ["nodes", "edges"];

		owe(this, owe.serve({
			router: {
				filter: owe.filter(new Set([...exposed, "container"])),
				traversePrototype: true // Allow access to Graph.prototype getters
			},
			closer: {
				filter: true
			}
		}));
		owe.expose.properties(this, exposed);
	}

	assign(preset) {
		if(!preset)
			return this;

		Object.assign(this, filterObject(preset, ["nodes", "edges", "idCount"]));

		if(!this.nodes)
			this.nodes = {};

		if(!this.edges)
			this.edges = {};

		if(!this.idCount)
			this.idCount = 0;

		return this;
	}

	[update](type, value) {
		// Emit "update" to notify this graph's runner, which then sets a dirty mark to trigger DB persistence:
		this.emit("update");

		// type is emitted to enable UIs / nodes in active runners to listen for concrete graph modifications:
		this.emit(type, value);
	}

	get loaded() {
		return Promise.all(Object.keys(this[nodes]).map(id => this[nodes][id].loaded)).then(() => true);
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
		node.on("update", () => graph[update]("updateNode", node));
		node.on("delete", this.deleteNode.bind(this, graph, node.id));
		return node;
	},

	instanciateEdge(graph, edge) {
		edge = new Edge(edge, graph);
		edge.on("update", () => graph[update]("updateEdge", edge));
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
