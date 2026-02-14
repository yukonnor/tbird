require('dotenv').config();
const express = require('express');
const cors = require('cors');
const healthRouter = require('./routes/health');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.use('/api/health', healthRouter);

app.listen(PORT, () => {
  console.log(`tbird backend running on port ${PORT}`);
});
