"use strict";

const owe = require("owe.js");
const { mixins } = require("mixwith");

const UpdateEmitter = require("../helpers/UpdateEmitter");
const internalize = require("../helpers/internalize");
const filterObject = require("../helpers/filterObject");
const Node = require("./Node");
const Edge = require("./Edge");

const { update, type: updateType } = UpdateEmitter;

const container = Symbol("container");

class Graph extends mixins(UpdateEmitter(["nodes", "edges"])) {
	constructor(parentContainer) {
		super();
		internalize(this, ["nodes", "edges"]);

		Object.assign(this, {
			[container]: parentContainer,
			nodes: {},
			edges: {},
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

	get loaded() {
		return Promise.all(Object.keys(this.nodes).map(id => this.nodes[id].loaded)).then(() => true);
	}

	get container() {
		return this[container];
	}

	get nodes() {
		return super.nodes;
	}
	set nodes(val) {
		super.nodes = operations.prepareGraphList(this, "Node", val);
	}

	get edges() {
		return super.edges;
	}
	set edges(val) {
		super.edges = operations.prepareGraphList(this, "Edge", val);
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
		node.on("update", () => graph[update](updateType.change("node"), node));
		node.on("delete", this.deleteNode.bind(this, graph, node.id));

		return node;
	},

	instanciateEdge(graph, edge) {
		edge = new Edge(edge, graph);
		edge.on("update", () => graph[update](updateType.change("edge"), edge));
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

		graph[update](updateType.add("node"), node);

		return node;
	},

	addEdge(graph, edge) {
		if(!edge || typeof edge !== "object")
			throw new owe.exposed.TypeError("Edges have to be objects.");

		const id = graph.idCount + 1;

		edge.id = id;
		edge = graph.edges[id] = this.instanciateEdge(graph, edge);
		graph.idCount = id;

		graph[update](updateType.add("edge"), edge);

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

		graph[update](updateType.delete("node"), id);
	},

	deleteEdge(graph, id) {
		if(!(id in graph.edges))
			throw new owe.exposed.Error(`There is no edge with the id ${id}.`);

		delete graph.edges[id];

		graph[update](updateType.delete("edge"), id);
	}
};

module.exports = Graph;
