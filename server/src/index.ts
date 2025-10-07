import express from 'express';
import cors from 'cors';
import path from 'path';
import converterRouter from './routes/converter';
import uploaderRouter from './routes/uploader';

const app = express();
app.use(cors());
app.use(express.json());

const OUTPUT_DIR = path.join(process.cwd(), 'server', 'output');
app.use('/output', express.static(OUTPUT_DIR));

app.use('/api/converter', converterRouter);
app.use('/api/uploader', uploaderRouter);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
