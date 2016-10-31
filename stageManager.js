"use strict";

const stageManager = require("../managers/stageManager");

module.exports = stageManager({
	stages: ["connect", "validate"],
	nonCriticalStages: ["connect", "validate"]
});
