const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const dotenv = require('dotenv');
const {connectToDatabase} = require('./database');
const responseHandler = require('./middlewares/handlingMiddleware');
const { handleOAuthCallback } = require('./services/smtp/email/emailSender');
dotenv.config();
const app = express();

const corsOptions = {
  origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization'],
  credentials: true 
};

app.use((req, res, next) => {
  req.setTimeout(0); 
  next();
});

app.use(cors(corsOptions));
app.options('*', cors(corsOptions)); 


app.use(bodyParser.json({ limit: '1024mb' }));
app.use(bodyParser.urlencoded({ limit: '1024mb', extended: true }));
app.use(responseHandler);


app.use('/', require('./routes/media'));
app.get('/', (req, res) => {
  res.send('<h1>Hello World</h1>');
});

app.get('/oauth2callback', async (req, res) => {
  const { code } = req.query; // The authorization code from Google
  try {
    const tokens = await handleOAuthCallback(code);
    res.status(200).json({ tokens }); // Or redirect to your app with the token info
  } catch (error) {
    res.status(400).json({ message: 'Error handling OAuth callback', error });
  }
});


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
