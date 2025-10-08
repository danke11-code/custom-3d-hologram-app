"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const path_1 = __importDefault(require("path"));
const converter_1 = __importDefault(require("./routes/converter"));
const uploader_1 = __importDefault(require("./routes/uploader"));
const connection_1 = __importDefault(require("./routes/connection"));
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
app.use(express_1.default.json());
const ROOT_DIR = path_1.default.resolve(__dirname, '..');
const OUTPUT_DIR = path_1.default.join(ROOT_DIR, 'output');
app.use('/output', express_1.default.static(OUTPUT_DIR));
app.use('/api/converter', converter_1.default);
app.use('/api/uploader', uploader_1.default);
app.use('/api/connection', connection_1.default);
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
    console.log(`Server listening on http://localhost:${PORT}`);
});
