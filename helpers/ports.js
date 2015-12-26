"use strict";

const owe = require("owe.js");

const constraints = require("./constraints");

module.exports = {
	validatePort(port, name) {
		if(!port || typeof port !== "object")
			throw new owe.exposed.TypeError(`Port definition of '${name}' has to be an object.`);

		return Object.assign(port, {
			constraint: constraints.validate(port.constraint)
		});
	},

	validate(ports) {
		if(!ports || typeof ports !== "object")
			throw new owe.exposed.TypeError("Port definitions have to be objects.");

		if(Object.keys(ports).length !== 2 || typeof ports.in !== "object" && typeof ports.out !== "object")
			throw new owe.exposed.TypeError("Port definitions must consist of an 'in' and an 'out' object.");

		Object.keys(ports.in).forEach(name => ports.in[name] = this.validatePort(ports.in[name], name));
		Object.keys(ports.out).forEach(name => ports.out[name] = this.validatePort(ports.out[name], name));

		return ports;
	}
};
