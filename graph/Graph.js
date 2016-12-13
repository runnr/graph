"use strict";

const owe = require("owe.js");
const { mixins } = require("@runnr/mixin");
const { UpdateEmitter } = require("@runnr/events");

const Assignable = require("../../helpers/Assignable");
const internalize = require("../../helpers/internalize");
const stageManager = require("./stageManager");
const node = require("../node");
const edge = require("../edge");

const { update, type: updateType } = UpdateEmitter;

const container = Symbol("container");
const writable = Symbol("writable");

class Graph extends mixins(Assignable, UpdateEmitter(["nodes", "edges"])) {
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

		const exposed = ["nodes", "edges", "ports", "writable"];

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
		return stageManager({
			nodes: () => operations.prepareGraphList(this, "node", preset.nodes).then(nodes => this.nodes = nodes),
			edges: () => operations.prepareGraphList(this, "edge", preset.edges).then(edges => this.edges = edges)
		}).then(() => {
			this.idCount = preset.idCount;
		});
	}

	get container() {
		return this[container];
	}

	get writable() {
		return this[writable];
	}

	get ports() {
		const ports = {
			in: {},
			out: {}
		};

		Object.keys(this.nodes).forEach(id => {
			const node = this.nodes[id];

			if(node.type === "in" || node.type === "out")
				ports[node.type][node.name] = node.port;
		});

		return ports;
	}
}

const operations = {
	prepareGraphList(graph, type, val) {
		return Promise.all(Object.keys(val).map(id => this.create(graph, type, val[id]))).then(list => {
			const result = {};

			list.forEach(entry => result[entry.id] = entry);

			Object.defineProperty(result, "add", {
				value: graph.writable ? preset => this.add(graph, type, preset) : () => {
					throw new owe.exposed.Error(`The ${type} could not be added because the graph is not writable.`);
				}
			});

			return owe(result, owe.chain([
				owe.serve({
					closer: {
						filter: true
					}
				}), {
					router: id => this.get(graph, type, id)
				}
			]));
		});
	},

	create(graph, type, preset) {
		return (type === "node" ? node : edge).create(preset, graph).then(instance => {
			instance.on("update", () => graph[update](updateType.change(type), preset));
			instance.on("delete", () => this.delete(graph, type, preset.id));

			return instance;
		});
	},

	add(graph, type, preset) {
		if(!preset || typeof preset !== "object")
			throw new owe.exposed.TypeError(`Presets for ${type}s have to be objects.`);

		const id = preset.id = ++graph.idCount;

		return this.create(graph, type, preset).then(instance => {
			graph[`${type}s`][id] = instance;
			graph[update](updateType.add(type), instance);

			return instance;
		}, err => {
			// If reserved id will not be used and no other ids have already been reserved, reset idCount:
			if(graph.idCount === id)
				graph.idCount--;

			throw err;
		});
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
