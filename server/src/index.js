const express = require('express');
const cors = require('cors');
const server = require('http')
const documentRouter = require('./routes/documents');
const authRouter = require('./routes/authRoute');
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

const app = express();
app.use(cors());
app.use(express.json());
app.use('/document' , documentRouter);
app.use('/api/auth' , authRouter);
app.get('/document' , () => {
  console.log('Server is running');
} );

const PORT = process.env.PORT || 5000;
app.listen(PORT , () => {
  console.log(`Server is running in PORT ${PORT}`);
});