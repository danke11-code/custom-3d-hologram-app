"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const tcpUploaderService_1 = require("../services/tcpUploaderService");
const router = (0, express_1.Router)();
router.post('/upload', tcpUploaderService_1.uploadBinsHandler);
exports.default = router;
