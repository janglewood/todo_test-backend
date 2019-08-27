const Pool = require('pg').Pool;
const pool = new Pool({
	user: 'antonkaratkevich',
	host: 'localhost',
	database: 'todo_test',
	port: 5432,
});
const crypto = require('crypto');
const util = require('util');

const getUsers = (req, res) => {
	pool.query('SELECT id, firstname, lastname FROM users', (err, result) => {
		if (err) {
			throw new Error(err.message);
		}
		res.status(200).json(result.rows);
	});
};

const getUserById = (req, res) => {
	const id = parseInt(req.params.id);

	pool.query(
		'SELECT * FROM users WHERE id = $1',
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
		'INSERT INTO users (firstname, lastname, email, description) VALUES ($1, $2, $3, $4)',
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

const registerUser = async (req, res) => {
	const { username, password, firstname, lastname } = req.body;
	const salt = process.env.DB_SALT;
	const getKey = util.promisify(crypto.pbkdf2);
	const key = await getKey(password, salt, 5000, 8, 'sha512');
	if (key) {
		pool.query(
			'INSERT INTO users (username, password, firstname, lastname) VALUES ($1, $2, $3, $4)',
			[username, key.toString('hex'), firstname, lastname],
			(err, result) => {
				if (err) {
					throw new Error(err.message);
				}
				res.status(200).send(`User register succced`);
			});
	} else {
		console.error('eerrrooor');
	}
}

module.exports = {
	getUsers,
	getUserById,
	createUser,
	updateUser,
	deleteUser,
	registerUser,
};