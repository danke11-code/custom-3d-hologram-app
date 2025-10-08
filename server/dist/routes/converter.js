"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const converterService_1 = require("../services/converterService");
const router = (0, express_1.Router)();
const TMP_DIR = path_1.default.join(path_1.default.resolve(__dirname, '..', '..'), 'tmp');
const storage = multer_1.default.diskStorage({
    destination: (_req, _file, cb) => cb(null, TMP_DIR),
    filename: (_req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`)
});
const upload = (0, multer_1.default)({ storage });
router.post('/convert', upload.array('files'), converterService_1.convertMediaHandler);
router.get('/jobs', converterService_1.getJobsHandler);
router.get('/download/:filename', converterService_1.downloadBinHandler);
exports.default = router;
