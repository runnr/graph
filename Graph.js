"use strict";

const owe = require("owe.js");
const { mixins } = require("mixwith");

const UpdateEmitter = require("../events/UpdateEmitter");
const internalize = require("../helpers/internalize");
const filterObject = require("../helpers/filterObject");
const node = require("./node");
const edge = require("./edge");

const { update, type: updateType } = UpdateEmitter;

const container = Symbol("container");
const writable = Symbol("writable");

class Graph extends mixins(UpdateEmitter(["nodes", "edges"])) {
	constructor(parentContainer, isWritable = true) {
		super();
		internalize(this, ["nodes", "edges"]);

		Object.assign(this, {
			[container]: parentContainer,
			[writable]: !!isWritable,
			nodes: {},
			edges: {},
			idCount: 0
		});

		/* owe binding: */

		const exposed = ["nodes", "edges", "writable"];

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

	get writable() {
		return this[writable];
	}

	get nodes() {
		return super.nodes;
	}
	set nodes(val) {
		super.nodes = operations.prepareGraphList(this, "node", val);
	}

	get edges() {
		return super.edges;
	}
	set edges(val) {
		super.edges = operations.prepareGraphList(this, "edge", val);
	}
}

const operations = {
	prepareGraphList(graph, type, val) {
		Object.keys(val).forEach(id => val[id] = operations.instanciate(graph, type, val[id]));

		Object.defineProperty(val, "add", {
			value: graph.writable ? preset => this.add(graph, type, preset) : () => {
				throw new owe.exposed.Error(`The ${type} could not be added because the graph is not writable.`);
			}
		});

		return owe(val, owe.chain([
			owe.serve({
				closer: {
					filter: true
				}
			}), {
				router: id => this.get(graph, type, id)
			}
		]), "rebind");
	},

	instanciate(graph, type, preset) {
		preset = (type === "node" ? node : edge).create(preset, graph);
		preset.on("update", () => graph[update](updateType.change(type), preset));
		preset.on("delete", () => this.delete(graph, type, preset.id));

		return preset;
	},

	add(graph, type, preset) {
		if(!preset || typeof preset !== "object")
			throw new owe.exposed.TypeError(`Presets for ${type}s have to be objects.`);

		const id = preset.id = graph.idCount + 1;
		const instance = graph[`${type}s`][id] = this.instanciate(graph, type, preset);

		graph.idCount = id;

		graph[update](updateType.add(type), instance);

		return instance;
	},

	get(graph, type, id) {
		if(!(id in graph[`${type}s`]))
			throw new owe.exposed.Error(`There is no ${type} with the id ${id}.`);

		return graph[`${type}s`][id];
	},

	delete(graph, type, id) {
		if(!(id in graph[`${type}s`]))
			throw new owe.exposed.Error(`There is no ${type} with the id ${id}.`);

		delete graph[`${type}s`][id];

		graph[update](updateType.delete(type), id);
	},
};

module.exports = Graph;
