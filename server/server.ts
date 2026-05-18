import express from 'express';
import cors from 'cors';
import generateDocsRouter from './routes/generateDocsRoute';

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api', generateDocsRouter);

const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;

app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});