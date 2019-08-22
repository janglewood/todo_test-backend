const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const port = process.env.PORT || 3001;
const db = require('./queries');

app.use(bodyParser.json());
app.use(
    bodyParser.urlencoded({
        extended: true,
    })
);

app.get('/api', db.getUsers);
app.get('/user/:id', db.getUserById);
app.post('/form', db.createUser);
app.put('/edit/user/:id', db.updateUser);
app.delete('/delete', db.deleteUser);

app.listen(port, () => {
    console.log(`Listenning on port ${port}`);
});