const express = require('express');
const documentRouter = require('./routes/documents');
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

const app = express();

app.use(express.json());
app.use('/document' , documentRouter);
app.get('/document' , () => {
  console.log('Server is running');
} );

const PORT = process.env.PORT || 5000;
app.listen(PORT , () => {
  console.log(`Server is running in PORT ${PORT}`);
});