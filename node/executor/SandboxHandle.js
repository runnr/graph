"use strict";

class SandboxHandle {
	constructor(node) {
		this.ports = {
			in: {},
			out: {}
		};

		Object.keys(node.ports.in).forEach(portName => {
			this.ports.in[portName] = node.ports.in[portName].readable;
		});

		Object.keys(node.ports.out).forEach(portName => {
			this.ports.out[portName] = node.ports.out[portName].writable;
		});
	}
}

Object.freeze(SandboxHandle);
Object.freeze(SandboxHandle.prototype);

module.exports = SandboxHandle;
