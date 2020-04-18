const winston = require('winston');
require('winston-mongodb');
require('express-async-errors');
const Joi = require('joi');
Joi.objectId = require('joi-objectid')(Joi);
const debug = require('debug')('app:startup');
const express = require ('express');
const helmet = require('helmet');
const dotenv = require('dotenv');
const {auth,log} = require ('./middleware/logger');
const morgan = require('morgan');
const genreService = require('./src/routes/genres');
const customerService = require ('./src/routes/customers');
const filmService = require('./src/routes/films');
const rentalService = require('./src/routes/rentals');
const registrationService = require( './src/routes/user');
const authenticationService = require('./src/utils/auth');
const errorMiddleware = require('./src/utils/middleware/error');
const mongoose = require('mongoose');

const app = express();
dotenv.config();

// process.on('uncaughtException', (ex)=>{
//     winston.error(ex.message,ex)
//     process.exit(1);
// })

winston.handleExceptions( new winston.transports.File({filename:'uncaughtExceptions.log'}))

process.on('unhandledRejection', (ex)=>{
    winston.error(ex.message, ex)
    process.exit(1);
    // throw ex
})

winston.add(winston.transports.File,{filename: 'logfile.log'});
winston.add(winston.transports.MongoDB,{db: process.env.MONGODB_URL});

app.use(express.json());
app.use(log);
app.use(auth);
app.use(helmet());

if(process.env.NODE_ENV === "development"){
    app.use(morgan('tiny'));
    debug('Morgan enabled...');
}

mongoose.connect(process.env.MONGODB_URL, {useNewUrlParser:true, useUnifiedTopology:true, useFindAndModify: false})
.then(db => console.log('MongoDb connected'), err=> console.log('Failed to connect to MongoDB', err))

app.use('/api/films/genre', genreService);
app.use('/api/customer', customerService);
app.use('/api/films', filmService);
app.use('/api/rentals', rentalService);
app.use('/api/users', registrationService);
app.use('/api/auth', authenticationService);
app.use(errorMiddleware);

const port = process.env.PORT || 4110
app.listen(port, ()=> {
    console.log(`listening on port ${port}`);
})