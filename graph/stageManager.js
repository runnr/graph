"use strict";

const { stageManager } = require("@runnr/managers");

module.exports = stageManager({
	stages: ["nodes", "edges"],
	nonCriticalStages: ["nodes", "edges"]
});
