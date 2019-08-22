const Pool = require('pg').Pool;
const pool = new Pool({
    user: 'antonkaratkevich',
    host: 'localhost',
    database: 'todo_test',
    port: 5432,
});

const getUsers = (req, res) => {
    pool.query('SELECT id, firstname, lastname FROM profiles', (err, result) => {
        if (err) {
            throw new Error(err.message);
        }
        res.status(200).json(result.rows);
    });
};

const getUserById = (req, res) => {
    const id = parseInt(req.params.id);

    pool.query(
        'SELECT * FROM profiles WHERE id = $1',
        [id], 
        (err, result) => {
            if (err) {
                throw new Error(err.message);
            }
            res.status(200).json(result.rows);
    });
};

const createUser = (req, res) => {
    const { firstname, lastname, email, description } = req.body;

    pool.query(
        'INSERT INTO profiles (firstname, lastname, email, description) VALUES ($1, $2, $3, $4)',
        [firstname, lastname, email, description || 'none'],
        (err, result) => {
            if (err) {
                throw new Error(err.message);
            }
            res.status(201).send(`New user created`);
    });
};

const updateUser = (req, res) => {
    const id = parseInt(req.params.id);
    const { firstname, lastname, email, description } = req.body;

    pool.query(
        'UPDATE profiles SET firstname = $1, lastname = $2, email = $3, description = $4 WHERE id = $5',
        [firstname, lastname, email, description, id],
        (err, result) => {
            if (err) {
                throw new Error(err.message);
            }
        res.status(200).send(`User modified with ID: ${id}`);
        }
    );
};

const deleteUser = (req, res) => {
    const id = parseInt(req.body.id);
  
    pool.query(
        'DELETE FROM profiles WHERE id = $1',
        [id],
        (err, result) => {
            if (err) {
                throw new Error(err.message);
            }
        res.status(200).send(`User deleted with ID: ${id}`)
    });
  };

module.exports = {
    getUsers,
    getUserById,
    createUser,
    updateUser,
    deleteUser,
};