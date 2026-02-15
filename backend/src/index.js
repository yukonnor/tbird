require('dotenv').config();
const express = require('express');
const cors = require('cors');
const requestLogger = require('./middleware/requestLogger');
const errorHandler = require('./middleware/errorHandler');
const healthRouter = require('./routes/health');
const ebirdRouter = require('./routes/ebirdRoutes');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: process.env.CORS_ORIGIN || 'http://localhost:5173' }));
app.use(express.json());
app.use(requestLogger);

app.use('/api/health', healthRouter);
app.use('/api/ebird', ebirdRouter);

app.use(errorHandler);

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`tbird backend running on port ${PORT}`);
  });
}

module.exports = app;
