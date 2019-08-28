const express = require('express');
const bodyParser = require('body-parser');
require('dotenv').config();
const app = express();
const port = process.env.DB_PORT || 3001;
const db = require('./queries');
const passport = require('passport');

app.use(bodyParser.json());
app.use(
    bodyParser.urlencoded({
        extended: true,
    })
);

const checkRoles = (roles) => {
    return (req, res, next) => {
        const { user } = req;
        if (roles.includes(user.role)) {
            next();
        } else {
            throw new Error('You are not administrator!!!');
        }
    }
};

const checkUserPermissions = () => (req, res, next) => {
    const pageId = parseInt(req.params.id);
    const authId = req.user.authUserId;
    const role = req.user.role;
    if (pageId === authId || role === 'ADMIN') {
        next();
    } else {
        throw new Error('You are not administrator'); // fix that, user can get info about other, but dont edit
    };
};

app.get('/users', passport.authenticate('jwt', { session: false }), checkRoles(['ADMIN', 'USER']), (req, res) => db.getUsers(req, res));
app.get('/user/:id', passport.authenticate('jwt', { session: false }), checkRoles(['ADMIN', 'USER']), (req, res) => db.getUserById(req, res));
app.post('/users', passport.authenticate('jwt', { session: false }), checkRoles(['ADMIN']), (req, res) => db.createUser(req, res));
app.put('/user/:id', passport.authenticate('jwt', { session: false }), checkUserPermissions(), (req, res) => db.updateUser(req, res));
app.delete('/users', passport.authenticate('jwt', { session: false }), checkRoles(['ADMIN']), (req, res) => db.deleteUser(req, res));
app.post('/register', db.registerUser);
app.post('/login', db.loginUser);

app.listen(port, () => {
    console.log(`Listenning on port ${port}`);
});