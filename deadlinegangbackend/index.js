const dns = require('dns');
dns.setDefaultResultOrder('ipv4first');
dns.setServers(['8.8.8.8', '8.8.4.4']);

const express = require('express');
const app = express();
const cookieParser = require('cookie-parser');
const cors = require('cors');
const dotenv = require('dotenv');
dotenv.config();

const port = process.env.PORT || 5000;
require('./db');

console.log('FRONTEND_URL:', process.env.FRONTEND_URL);

const allowedOrigins = [
    process.env.FRONTEND_URL,
    'http://localhost:3000',  // always allow local dev
].filter(Boolean); // remove undefined

console.log('Allowed origins:', allowedOrigins);

app.use(
    cors({
        origin: function (origin, callback) {
            console.log('Request origin:', origin);
            if (!origin || allowedOrigins.includes(origin)) {
                callback(null, true);
            } else {
                console.log('CORS blocked:', origin);
                callback(new Error('Not allowed by CORS'));
            }
        },
        credentials: true
    })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use((req, res, next) => {
    console.log('REQUEST:', req.method, req.url);
    next();
});
app.use(cookieParser({
    httpOnly: true,
    secure: true,
    sameSite: 'none',
    maxAge: 1000 * 60 * 60 * 24 * 7,
    signed: true
}));

const authRoutes = require('./routes/authRoutes');
const classroomRoutes = require('./routes/classroomRoutes');

app.use('/auth', authRoutes);
app.use('/class', classroomRoutes);

app.get('/', (req, res) => {
    res.send('Hello World!');
});

app.listen(port, () => {
    console.log(`DeadlineGang backend app listening on port ${port}`);
});
