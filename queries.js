const Pool = require('pg').Pool;
const pool = new Pool({
	user: 'antonkaratkevich',
	host: 'localhost',
	database: 'todo_test',
	port: 5432,
});
const crypto = require('crypto');
const util = require('util');
const jwt = require('jsonwebtoken');
const passport = require('passport');
const passportJWT = require('passport-jwt');

const ExtractJwt = passportJWT.ExtractJwt;
const JwtStrategy = passportJWT.Strategy;

const options = {
	secretOrKey: process.env.DB_PUBLIC_KEY,
	jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
};

passport.use(new JwtStrategy(options, (jwt_payload, done) => {
	pool.query('SELECT id, role FROM users WHERE id = $1', [jwt_payload.id], (err, result) => {
		const isUserHasToken = result.rows.some(item => item.id === jwt_payload.id);
		if (isUserHasToken) {
			done(null, { authUserId: jwt_payload.id, role: result.rows[0].role });
		} else {
			done(null);
		}
	});
}));

const getUsers = (req, res) => {
	const { authUserId } = req.user;
	pool.query('SELECT role FROM users WHERE id = $1', [authUserId], (err, result) => {
		if (err) {
			throw new Error(err.message);
		}
		pool.query('SELECT id, firstname, lastname FROM users', (err, result) => {
			if (err) {
				throw new Error(err.message);
			}
			res.send(result.rows)
		});
	});
};

const getUserById = (req, res) => {
	const id = parseInt(req.params.id);
	const { authUserId } = req.user;
	pool.query('SELECT role FROM users WHERE id = $1', [authUserId], (err, result) => {
		if (err) {
			throw new Error(err.message);
		}
		pool.query(
			'SELECT id, firstname, lastname, email, description FROM users WHERE id = $1', //dont take all info
			[id],
			(err, result) => {
				if (err) {
					throw new Error(err.message);
				}
				res.status(200).json(result.rows);
			});
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
		'UPDATE users SET firstname = $1, lastname = $2, email = $3, description = $4 WHERE id = $5',
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
		'DELETE FROM users WHERE id = $1',
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
			'INSERT INTO users (username, password, firstname, lastname, role) VALUES ($1, $2, $3, $4, $5)',
			[username, key.toString('hex'), firstname, lastname, 'USER'],
			(err, result) => {
				if (err) {
					throw new Error(err.message);
				}
				pool.query(
					'SELECT id, role, firstname FROM users WHERE username = $1',
					[username],
					(err, result) => {
						const token = jwt.sign({ id: result.rows[0].id }, process.env.DB_PUBLIC_KEY);
						const { id, role, firstname } = result.rows[0];
						res.status(200).send({ id: id, token: token, role: role, firstname: firstname });
					}
				)
			});
	} else {
		console.error('eerrrooor');
	}
};

const loginUser = async (req, res) => {
	const { username, password } = req.body;
	const salt = process.env.DB_SALT;
	const getKey = util.promisify(crypto.pbkdf2);
	const key = await getKey(password, salt, 5000, 8, 'sha512');
	if (key) {
		pool.query(
			'SELECT password, id, role, firstname FROM users WHERE username = $1',
			[username],
			(err, result) => {
				if (err) {
					throw new Error(err.message);
				} else if (!result.rows.length) {
					res.status(500).send(`User '${username}' is not exist`);
				} else if (key.toString('hex') === result.rows[0].password) {
					const token = jwt.sign({ id: result.rows[0].id }, process.env.DB_PUBLIC_KEY);
					const { id, role, firstname } = result.rows[0];
					res.status(200).send({ id: id, token: token, role: role, firstname: firstname });
				}
			});
	} else {
		console.error('eerrrooor');
	}
};

module.exports = {
	getUsers,
	getUserById,
	createUser,
	updateUser,
	deleteUser,
	registerUser,
	loginUser
};