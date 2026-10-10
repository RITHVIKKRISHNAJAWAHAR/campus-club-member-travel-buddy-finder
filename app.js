const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(__dirname));

mongoose.connect(process.env.MONGO_URI || 'mongodb://user_455r75v4e:p455r75v4e@db01.dbhost.dev:5050/db_455r75v4e')
.then(() => console.log('MongoDB connected'))
.catch(err => console.error('MongoDB connection error:', err));

const memberSchema = new mongoose.Schema({
    memberId: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    clubName: { type: String, required: true },
    year: { type: Number, required: true },
    role: { type: String, required: true },
    points: { type: Number, required: true },
    interests: { type: String },
    status: { type: String }
});
const Member = mongoose.model('Member', memberSchema);

const buddySchema = new mongoose.Schema({
    buddyId: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    destination: { type: String, required: true },
    age: { type: Number, required: true },
    budget: { type: Number, required: true },
    tripDuration: { type: Number, required: true },
    interests: { type: String },
    status: { type: String }
});
const Buddy = mongoose.model('Buddy', buddySchema);

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});
app.post('/members', async (req, res) => {
    try {
        const newMember = new Member(req.body);
        await newMember.save();
        res.send(`<h3>Member added successfully!</h3><a href="/">Back to Home</a>`);
    } catch (err) {
        res.status(400).send(`Error: ${err.message} <br><a href="/">Back</a>`);
    }
});

app.get('/members', async (req, res) => {
    try {
        const members = await Member.find().sort({ points: -1 });
        let html = `<h2>Campus Club Members (Descending Order of Points)</h2><table border="1" cellpadding="8"><tr><th>ID</th><th>Name</th><th>Club</th><th>Year</th><th>Role</th><th>Points</th></tr>`;
        members.forEach(m => {
            html += `<tr><td>${m.memberId}</td><td>${m.name}</td><td>${m.clubName}</td><td>${m.year}</td><td>${m.role}</td><td>${m.points}</td></tr>`;
        });
        html += `</table><br><a href="/">Back to Home</a>`;
        res.send(html);
    } catch (err) {
        res.status(500).send('Error retrieving members');
    }
});

app.get('/members/filter-club', async (req, res) => {
    try {
        const { clubName, minPoints } = req.query;
        const members = await Member.find({ clubName: clubName, points: { $gt: Number(minPoints) } });
        let html = `<h2>Members in '${clubName}' with > ${minPoints} points</h2><table border="1" cellpadding="8"><tr><th>Name</th><th>Club</th><th>Role</th><th>Points</th></tr>`;
        members.forEach(m => {
            html += `<tr><td>${m.name}</td><td>${m.clubName}</td><td>${m.role}</td><td>${m.points}</td></tr>`;
        });
        html += `</table><br><a href="/">Back to Home</a>`;
        res.send(html);
    } catch (err) {
        res.status(500).send(err.message);
    }
});

app.get('/members/search', async (req, res) => {
    try {
        const member = await Member.findOne({ memberId: req.query.memberId }, 'name clubName role points');
        if (!member) return res.send(`<h3>Member not found</h3><a href="/">Back</a>`);
        let html = `<h2>Member Details</h2><p><b>Name:</b> ${member.name}</p><p><b>Club Name:</b> ${member.clubName}</p><p><b>Role:</b> ${member.role}</p><p><b>Points:</b> ${member.points}</p><br><a href="/">Back to Home</a>`;
        res.send(html);
    } catch (err) {
        res.status(500).send(err.message);
    }
});

app.post('/members/update', async (req, res) => {
    try {
        const { memberId, newRole, newPoints } = req.body;
        await Member.findOneAndUpdate({ memberId }, { role: newRole, points: Number(newPoints) });
        res.send(`<h3>Member updated successfully!</h3><a href="/">Back to Home</a>`);
    } catch (err) {
        res.status(400).send(err.message);
    }
});

app.post('/members/increase-points', async (req, res) => {
    try {
        const { clubName, addPoints } = req.body;
        await Member.updateMany({ clubName }, { $inc: { points: Number(addPoints) } });
        res.send(`<h3>Points increased successfully for club ${clubName}!</h3><a href="/">Back to Home</a>`);
    } catch (err) {
        res.status(400).send(err.message);
    }
});

app.get('/members/range', async (req, res) => {
    try {
        const { min, max } = req.query;
        const members = await Member.find({ points: { $gte: Number(min),$lte: Number(max) } });
        let html = `<h2>Members with Points between ${min} and ${max}</h2><table border="1" cellpadding="8"><tr><th>ID</th><th>Name</th><th>Club</th><th>Points</th></tr>`;
        members.forEach(m => {
            html += `<tr><td>${m.memberId}</td><td>${m.name}</td><td>${m.clubName}</td><td>${m.points}</td></tr>`;
        });
        html += `</table><br><a href="/">Back to Home</a>`;
        res.send(html);
    } catch (err) {
        res.status(500).send(err.message);
    }
});

app.post('/members/delete', async (req, res) => {
    try {
        await Member.findOneAndDelete({ memberId: req.body.memberId });
        res.send(`<h3>Member deleted successfully!</h3><a href="/">Back to Home</a> | <a href="/members">View Remaining Members</a>`);
    } catch (err) {
        res.status(400).send(err.message);
    }
});

app.post('/buddies', async (req, res) => {
    try {
        const newBuddy = new Buddy(req.body);
        await newBuddy.save();
        res.send(`<h3>Travel Buddy added successfully!</h3><a href="/">Back to Home</a>`);
    } catch (err) {
        res.status(400).send(`Error: ${err.message} <br><a href="/">Back</a>`);
    }
});

app.get('/buddies', async (req, res) => {
    try {
        const buddies = await Buddy.find().sort({ budget: -1 });
        let html = `<h2>Travel Buddies (Descending Order of Budget)</h2><table border="1" cellpadding="8"><tr><th>ID</th><th>Name</th><th>Destination</th><th>Age</th><th>Budget</th><th>Duration</th></tr>`;
        buddies.forEach(b => {
            html += `<tr><td>${b.buddyId}</td><td>${b.name}</td><td>${b.destination}</td><td>${b.age}</td><td>${b.budget}</td><td>${b.tripDuration} days</td></tr>`;
        });
        html += `</table><br><a href="/">Back to Home</a>`;
        res.send(html);
    } catch (err) {
        res.status(500).send('Error retrieving travel buddies');
    }
});

app.get('/buddies/filter-destination', async (req, res) => {
    try {
        const { destination, minBudget } = req.query;
        const buddies = await Buddy.find({ destination: destination, budget: { $gt: Number(minBudget) } });
        let html = `<h2>Travelers to '${destination}' with Budget > ${minBudget}</h2><table border="1" cellpadding="8"><tr><th>Name</th><th>Destination</th><th>Budget</th><th>Duration</th></tr>`;
        buddies.forEach(b => {
            html += `<tr><td>${b.name}</td><td>${b.destination}</td><td>${b.budget}</td><td>${b.tripDuration} days</td></tr>`;
        });
        html += `</table><br><a href="/">Back to Home</a>`;
        res.send(html);
    } catch (err) {
        res.status(500).send(err.message);
    }
});

app.get('/buddies/search', async (req, res) => {
    try {
        const buddy = await Buddy.findOne({ buddyId: req.query.buddyId }, 'name destination budget tripDuration');
        if (!buddy) return res.send(`<h3>Travel Buddy not found</h3><a href="/">Back</a>`);
        let html = `<h2>Travel Buddy Details</h2><p><b>Name:</b> ${buddy.name}</p><p><b>Destination:</b> ${buddy.destination}</p><p><b>Budget:</b> ${buddy.budget}</p><p><b>Trip Duration:</b> ${buddy.tripDuration} days</p><br><a href="/">Back to Home</a>`;
        res.send(html);
    } catch (err) {
        res.status(500).send(err.message);
    }
});

app.post('/buddies/update', async (req, res) => {
    try {
        const { buddyId, newDestination, newBudget } = req.body;
        await Buddy.findOneAndUpdate({ buddyId }, { destination: newDestination, budget: Number(newBudget) });
        res.send(`<h3>Travel Buddy updated successfully!</h3><a href="/">Back to Home</a>`);
    } catch (err) {
        res.status(400).send(err.message);
    }
});

app.post('/buddies/increase-budget', async (req, res) => {
    try {
        const { destination, addAmount } = req.body;
        await Buddy.updateMany({ destination }, { $inc: { budget: Number(addAmount) } });
        res.send(`<h3>Budget increased successfully for travelers to ${destination}!</h3><a href="/">Back to Home</a>`);
    } catch (err) {
        res.status(400).send(err.message);
    }
});

app.get('/buddies/range', async (req, res) => {
    try {
        const { min, max } = req.query;
        const buddies = await Buddy.find({ budget: { $gte: Number(min),$lte: Number(max) } });
        let html = `<h2>Travel Buddies with Budget between ${min} and ${max}</h2><table border="1" cellpadding="8"><tr><th>ID</th><th>Name</th><th>Destination</th><th>Budget</th></tr>`;
        buddies.forEach(b => {
            html += `<tr><td>${b.buddyId}</td><td>${b.name}</td><td>${b.destination}</td><td>${b.budget}</td></tr>`;
        });
        html += `</table><br><a href="/">Back to Home</a>`;
        res.send(html);
    } catch (err) {
        res.status(500).send(err.message);
    }
});

app.post('/buddies/delete', async (req, res) => {
    try {
        await Buddy.findOneAndDelete({ buddyId: req.body.buddyId });
        res.send(`<h3>Travel Buddy deleted successfully!</h3><a href="/">Back to Home</a> | <a href="/buddies">View Remaining Buddies</a>`);
    } catch (err) {
        res.status(400).send(err.message);
    }
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});