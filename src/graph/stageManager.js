"use strict";

const stageManager = require("../../managers/stageManager");

module.exports = stageManager({
	stages: ["nodes", "edges"],
	nonCriticalStages: ["nodes", "edges"]
});
