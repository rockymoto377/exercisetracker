require('dotenv').config()
const express = require('express')
const app = express()
const cors = require('cors')
const bodyParser = require('body-parser');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(cors())
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

// Data
let Users = [];
let Exercises = new Map();

// Create Users
app.route("/api/users").post((req, res) => {
	let username = req.body.username;
	let _id = Users.length;
	res.json({
		username: username,
		_id: _id
	});
	Users.push({ username: username, id: _id });
}).get((req, res) => {
	res.json(Users);
});

// Helper function to add data to the map
function addExerciseData(id, data) {
	if (Exercises.get(id)) {
		Exercises.get(id).push(data);
	} else {
		Exercises.set(id, [data]);
	}
}

// Add Exercise Data
app.post("/api/users/:_id/exercises", (req, res) => {
	let description = req.body.description;
	let duration = parseInt(req.body.duration);
	let date = new Date(req.body.date || new Date());
	let _id = req.params._id;
	let username = Users[_id].username;

	res.json({
		_id: _id,
		username: username,
		date: date.toDateString(),
		duration: duration,
		description: description
	});
	addExerciseData(_id, {
		description: description,
		duration: duration,
		date: date.toDateString()
	});
})

// Check Exercise Logs
app.get("/api/users/:_id/logs", (req, res) => {
	let _id = req.params._id;
	let username = Users[_id].username;
	let count = Exercises.get(_id).length;

	let from = false;
	if (req.query.from !== "") {
		from = new Date(req.query.from);
	} 
	let to = false;
	if (req.query.to !== "") {
		to = req.query.to;
	}
	let limit = false;
	if (req.query.limit !== "") {
		limit = parseInt(req.query.limit);
	} 

	let log = Exercises.get(_id).filter((exercise) => {
		let exerciseDate = new Date(exercise.date);
		if (from && exerciseDate < from) {
			return false
		}
		if (to && exerciseDate > to) {
			return false
		}
		return true;
	})

	if (limit && log.length > limit) {
		log = log.splice(0, limit);
	}

	res.json({
		_id: _id,
		username: username,
		count: count,
		log
	});
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
});
