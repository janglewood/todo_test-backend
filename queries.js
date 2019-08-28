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

passport.use(new JwtStrategy(options, async (jwt_payload, done) => {
	const request = await pool.query('SELECT id, role FROM users WHERE id = $1', [jwt_payload.id]);
	const result = request.rows[0];
	const isUserHasToken = result.id === jwt_payload.id;
	if (isUserHasToken) {
		done(null, { authUserId: jwt_payload.id, role: result.role });
	} else {
		done(null);
	}
}));

const getUsers = async (req, res) => {
	const request = await pool.query('SELECT id, firstname, lastname FROM users');
	res.status(200).send(request.rows);
};

const getUserById = async (req, res) => {
	const id = parseInt(req.params.id);
	const request = await pool.query(
		'SELECT id, firstname, lastname, email, description FROM users WHERE id = $1',
		[id]
	);
	res.status(200).send(request.rows);
};

const createUser = async (req, res) => { //add ability to add username & password & role
	const { firstname, lastname, email, description } = req.body;
	const request = await pool.query(
		'INSERT INTO users (firstname, lastname, email, description) VALUES ($1, $2, $3, $4)',
		[firstname, lastname, email, description || 'none']
	);
	res.status(201).send(`New user created`);
};

const updateUser = async (req, res) => {
	const id = parseInt(req.params.id);
	const { firstname, lastname, email, description } = req.body;
	const request = await pool.query(
		'UPDATE users SET firstname = $1, lastname = $2, email = $3, description = $4 WHERE id = $5',
		[firstname, lastname, email, description, id]
	);
	res.status(200).send(`User modified with ID: ${id}`);
};

const deleteUser = async (req, res) => {
	const id = parseInt(req.body.id);
	const request = await pool.query(
		'DELETE FROM users WHERE id = $1',
		[id]
	);
	res.status(200).send(`User deleted with ID: ${id}`);
};

const registerUser = async (req, res) => {
	const { username, password, firstname, lastname } = req.body;
	const salt = process.env.DB_SALT;
	const getKey = util.promisify(crypto.pbkdf2);
	const key = await getKey(password, salt, 5000, 8, 'sha512');
	if (key) {
		const request = await pool.query(
			'INSERT INTO users (username, password, firstname, lastname, role) VALUES ($1, $2, $3, $4, $5)',
			[username, key.toString('hex'), firstname, lastname, 'USER']
		);
		const getToken = await pool.query(
			'SELECT id, role FROM users WHERE username = $1',
			[username]
		);

		const { id, role } = getToken.rows[0];
		const token = jwt.sign({ id: id }, process.env.DB_PUBLIC_KEY);
		res.status(200).send({ id: id, token: token, role: role, firstname: firstname });
	};
};

const loginUser = async (req, res) => {
	const { username, password } = req.body;
	const salt = process.env.DB_SALT;
	const getKey = util.promisify(crypto.pbkdf2);
	const key = await getKey(password, salt, 5000, 8, 'sha512');
	if (key) {
		const request = await pool.query(
			'SELECT password, id, role, firstname FROM users WHERE username = $1',
			[username]
		);
		const { id, role, firstname } = request.rows[0];
		const hashedPassword = request.rows[0].password;
		if (!request.rows.length) {
			res.status(500).send(`User '${username}' is not exist`);
		} else if (key.toString('hex') === hashedPassword) {
			const token = jwt.sign({ id: id }, process.env.DB_PUBLIC_KEY);
			res.status(200).send({ id: id, token: token, role: role, firstname: firstname });
		} else {
			res.status(500).send('Password is invalid');
		}
	};
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