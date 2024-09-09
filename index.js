require('dotenv').config();
const express = require('express');
const app = express();
const cors = require('cors');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');

// Connect to DB
mongoose.connect(process.env.MONGO_URI).catch((e) => console.log(e));
mongoose.connection.on("error", (e) => {
	console.log("Mongoose connection error: " + e);
});

// Data
let userSchema = mongoose.Schema(
	{
		username: {
			type: String,
			required: true,
		}
	},
	{
		versionKey: false
	}
);
let User = mongoose.model("User", userSchema);

let exerciseSchema = mongoose.Schema(
	{
		username: {
			type: String,
			required: true
		},
		description: {
			type: String,
			required: true
		},
		duration: {
			type: Number,
			required: true
		},
		date: String,
		userId: {
			type: String,
			required: true
		}
	},
	{
		versionKey: false
	}
);
let Exercise = mongoose.model("Exercise", exerciseSchema);

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(cors());
app.use(express.static('public'));
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html');
});

// Date check helper function
const checkDate = (date) => {
    if (!date) {
        return (new Date(Date.now())).toDateString();
    } else {
        const parts = date.split('-');
        const year = parseInt(parts[0]);
        const month = parseInt(parts[1]) - 1;
        const day = parseInt(parts[2]);

        const utcDate = new Date(Date.UTC(year, month, day));
        return new Date(utcDate.getTime() + utcDate.getTimezoneOffset() * 60000).toDateString();
    }
}

// Create Users
app.route("/api/users").post(async (req, res) => {
	let username = req.body.username;
	let user = await User.create({ username });
	res.json(user);
}).get(async (req, res) => {
	let userList = await User.find();
	res.json(userList);
});

// Add Exercise Data
app.post("/api/users/:_id/exercises", async (req, res) => {
	let description = req.body.description;
	let duration = parseInt(req.body.duration);
	let date = checkDate(req.body.date);
	let userId = req.params._id;
	let user = await User.findById(userId).select("username");

	let exerciseData = await Exercise.create({
		username: user.username,
		description,
		duration,
		date,
		userId: userId
	});
	return res.json({
		_id: user._id,
		username: user.username,
		date: exerciseData.date,
		duration: Number(exerciseData.duration),
		description: exerciseData.description
	});
})

// Check Exercise Logs
app.get("/api/users/:_id/logs", async (req, res) => {
	let userId = req.params._id;
	let user = await User.findById(userId).select("username");
	let count = await Exercise.find({ userId: userId }).exec();
	count = count.length;

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

	let log = await Exercise.find({ userId: userId }).exec();
	log = log.filter((exercise) => {
		let exerciseDate = new Date(exercise.date);
		if (from && exerciseDate < from) {
			return false;
		}
		if (to && exerciseDate > to) {
			return false;
		}
		return true;
	});

	if (limit && log.length > limit) {
		log = log.splice(0, limit);
	}

	res.json({
		_id: userId,
		username: user.username,
		count: count,
		log
	});
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
});
