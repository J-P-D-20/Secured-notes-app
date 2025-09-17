import { register,writeNote } from './backend.js';
import express from 'express'
import bcrypt from 'bcrypt';
import fs from 'fs/promises';
import jwt from 'jsonwebtoken';

import rateLimit from 'express-rate-limit';



const app = express();
app.use(express.json());

// JWT Secret keys (use environment variables in production)
const JWT_SECRET = process.env.ACCESS_TOKEN_SECRET || 'fallback-secret';
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET || 'fallback-refresh-secret';
const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET || JWT_SECRET;

// Temporary storage for refresh tokens (for production, store securely)
let refreshTokens = [];
// ✅ Availability Feature 1: Rate Limiting
const limiter = rateLimit({
    windowMs: 1 * 60 * 1000, 
    max: 50, 
    message: { error: "Too many requests. Please slow down and try again later." }
});

app.use(limiter);

// ✅ Availability Feature 2: Health Check Endpoint
app.get('/status', (req, res) => {
    res.status(200).json({
        status: "OK",
        uptime: `${process.uptime().toFixed(2)} seconds`,
        timestamp: new Date().toISOString()
    });
});

// READ NOTES (auth required). Users can only read their own; admins can read any.
// GET /notes?username={username}&title={optionalTitle}
app.get('/notes', authenticateToken, async (req, res) => {
    try {
        const { username: requestedUsername, title } = req.query;
        const requester = req.user; // { username, role }

        // Determine effective username scope
        let username = requestedUsername || requester.username;

        // If requester is not admin, they can only access their own notes
        if (requester.role !== 'admin' && username !== requester.username) {
            return res.status(403).json({ error: 'Forbidden: cannot access other users\' notes' });
        }

        const result = await readFile('./data.json', 'utf-8', username || null, title || null);

        // If username and title were provided but nothing found
        if (username && title && !result) {
            return res.status(404).json({ error: 'Note not found for specified user/title' });
        }

        // Admin without username: return all users
        if (!requestedUsername && requester.role === 'admin' && !title) {
            return res.json({ users: result });
        }

        // If only username is provided, return that user's notes (array)
        if (username && !title) {
            return res.json({ username, notes: result || [] });
        }

        // username + title returns a single note object
        return res.json({ username, title, note: result });
    } catch (err) {
        console.error('Error reading notes:', err);
        return res.status(500).json({ error: 'Failed to read notes' });
    }
});

app.post('/registration' , async (req,res) => {
    try{
    const {username,password,role} = req.body;
    const hashedPassword = await bcrypt.hash(password, 13);

    const saveUser = await register(username,hashedPassword,role);

    console.log(saveUser);
    res.status(200).send("Account Created Successfully")
    } catch (err) {
        console.error("Registration Error",err);
        res.status(500).send("registration error");
    }
})

//LOGIN
app.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        // You’d normally fetch user from DB
        const data = await fs.readFile('./data.json', 'utf-8');
        const users = JSON.parse(data);  
        const user = users.find(u => u.username === username);

        if (!user) return res.status(400).send("User not found");

        const match = await bcrypt.compare(password, user.password);
        if (!match) return res.status(400).send("Invalid password");

        // Sign JWT
        const token = jwt.sign(
            { username: user.username, role: user.role },
            JWT_SECRET,
            { expiresIn: "1h" }
        );

        res.json({ token });
    } catch (err) {
        console.error("Login Error", err);
        res.status(500).send("login error");
    }
});

// Middleware to check JWT
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Expect "Bearer <token>"

    if (!token) return res.sendStatus(401);

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user; // attach user info
        next();
    });
}

app.post('/token', (req, res) => {
    const { token } = req.body;
    if (!token) return res.sendStatus(401);
    if (!refreshTokens.includes(token)) return res.sendStatus(403);

    jwt.verify(token, REFRESH_TOKEN_SECRET, (err, user) => {
        if (err) return res.sendStatus(403);
        const accessToken = jwt.sign({ name: user.name }, ACCESS_TOKEN_SECRET, { expiresIn: '10m' });
        res.json({ accessToken });
    });
});

// ✅ Availability Feature 3: Global Error Handler
app.use((err, req, res, next) => {
    console.error("Unexpected Error:", err.message);
    res.status(500).json({ error: "Internal Server Error. Please try again later." });
});

// ✅ Availability Feature 4: Graceful Shutdown
process.on('SIGINT', () => {
    console.log("\nGracefully shutting down the server...");
    process.exit(0);
});

app.post('/writeNote', async (req,res) =>{
    try{
        const {username,title,content} = req.body;

        await writeNote(username,title,content);

        res.status(200).send("Note saved Successfully");
    } catch (err){
        console.error("error saving note", err);
    }
})

app.put('/notes', async (req, res) => {
    const { username, title, newContent } = req.body;
    const updated = await updateNote(username, title, newContent);
    if (updated) res.json({ message: "Note updated successfully", updated });
    else res.status(404).json({ error: "Note not found" });
});

app.delete('/notes', async (req, res) => {
    const { username, title } = req.body;
    const deleted = await deleteNote(username, title);
    if (deleted) res.json({ message: "Note deleted successfully" });
    else res.status(404).json({ error: "Note not found" });
});

const listen = () =>{
    const PORT = 3000
    app.listen(PORT, () =>{
        console.log(`server is listening to port: ${PORT}`)
    })
}
 
listen();
