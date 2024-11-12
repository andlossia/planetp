const express = require('express');
const bodyParser = require('body-parser');
const rateLimit = require('express-rate-limit');
const cors = require('cors');
const dotenv = require('dotenv');
const {connectToDatabase} = require('./database');
const responseHandler = require('./middlewares/handlingMiddleware');

dotenv.config();
const app = express();

const corsOptions = {
  origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization'],
  credentials: true
};

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300, 
  handler: (req, res, next) => {
    responseHandler(req, res, next, 429, 'Too many requests');
  },
  headers: true, 
});
app.use(limiter);


app.use(cors(corsOptions));
app.options('*', cors(corsOptions)); 

app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));
app.use(responseHandler);

app.use('/', require('./routes/media'));
app.use('/api/v1', require('./routes/router'));



const startServer = async () => {
  try {
    await connectToDatabase();
    const port = process.env.PORT || 8080;
    app.listen(port, (err) => {
      if (err) {
        console.error(`Error starting server: ${err.message}`);
        process.exit(1);
      } else {
        console.log(`Server running at http://localhost:${port}`);
      }
    });
  } catch (err) {
    console.error(`Failed to connect to database: ${err.message}`);
    process.exit(1);
  }
};

startServer();