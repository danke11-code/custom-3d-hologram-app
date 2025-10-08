"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const connectionService_1 = require("../services/connectionService");
const router = (0, express_1.Router)();
router.post('/test', connectionService_1.testConnectionHandler);
router.post('/smartconfig', connectionService_1.smartConfigHandler);
exports.default = router;
