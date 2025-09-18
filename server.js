import { register, writeNote, readFile, updateNote, deleteNote } from './backend.js';
import { getAllNotes, deleteUser } from './admin.js';
import express from 'express'
import bcrypt from 'bcrypt';
import fs from 'fs/promises';
import jwt from 'jsonwebtoken';
import { readLogs } from './auditlogger.js';
import rateLimit from 'express-rate-limit';



const app = express();
app.use(express.json());

// JWT Secret keys (use environment variables in production)
const JWT_SECRET = process.env.ACCESS_TOKEN_SECRET || 'fallback-secret';
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET || 'fallback-refresh-secret';

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

//registration
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

    const data = await fs.readFile('./data.json', 'utf-8');
    const users = JSON.parse(data);
    if (users.find(u => u.username === username)) {
    return res.status(400).send("Username already exists");
}

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

app.post('/logout', authenticateToken, async (req, res) => {
    try {
        const blacklist = await loadBlacklist();
        blacklist.push(req.token);
        await saveBlacklist(blacklist);

        res.status(200).json({ message: "Logged out successfully" });
    } catch (err) {
        console.error("Logout Error:", err);
        res.status(500).json({ error: "Failed to logout" });
    }
});

// Load blacklist
async function loadBlacklist() {
    try {
        const data = await fs.readFile('./blacklist.json', 'utf-8');
        return JSON.parse(data);
    } catch (err) {
        return [];
    }
}

// Save blacklist
async function saveBlacklist(blacklist) {
    await fs.writeFile('./blacklist.json', JSON.stringify(blacklist, null, 2), 'utf-8');
}

// Middleware to check JWT + blacklist
async function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.sendStatus(401);

    const blacklist = await loadBlacklist();
    if (blacklist.includes(token)) {
        return res.status(403).json({ error: "Token has been logged out" });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        req.token = token; // store token for logout
        next();
    });
}


//Admin Checker
function authorizeRole(role){
    return(req,res,next) =>{
        if(req.user.role !== role){
            return res.sendStatus(403);
        }
        next();
    }
}

app.post('/token', (req, res) => {
    const { token } = req.body;
    if (!token) return res.sendStatus(401);
    if (!refreshTokens.includes(token)) return res.sendStatus(403);

    jwt.verify(token, REFRESH_TOKEN_SECRET, (err, user) => {
        if (err) return res.sendStatus(403);
        const accessToken = jwt.sign({ username: user.username, role: user.role }, JWT_SECRET, { expiresIn: '1h' });
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

app.post('/writeNote', authenticateToken ,async (req,res) =>{
    try{
        const username = req.user.username;
        const {title,content} = req.body;

        await writeNote(username,title,content);

        res.status(200).send("Note saved Successfully");
    } catch (err){
        console.error("error saving note", err);
        res.status(500).send("Error saving note");
    }
})

//ADMIN FUNCTION PREVILIGES

//VIEW ALL NOTES
app.get('/getAllNotes', authenticateToken, authorizeRole('admin'), async (req,res) =>{
    try{
         const notes = await getAllNotes();
         res.status(200).send(notes);
    } catch (err){
        res.status(500).send("Error retrieving notes");
    }
})


//VIEW LOGS
app.get('/viewLogs',authenticateToken,authorizeRole('admin'), async (req,res) =>{
    try{
        const logs = await readLogs();
        res.status(200).send(logs);
    } catch (err){
        res.status(500).send("Error viewing logs");
        console.error("Error viewing logs",err)
    }
})

//DELETE USER 
app.post('/deleteUser', authenticateToken,authorizeRole('admin'), async (req,res) =>{
    try{
        const {username} = req.body;
        await deleteUser(username);
        res.status(200).send(`User ${username} deleted successfully`);
    } catch(err){
        res.status(500).send("Error deleting user");
        console.error("error deletin user: ", err)
    }
})

app.put('/notes', authenticateToken, async (req, res) => {
    const { title, newContent } = req.body;
    const username = req.user.username;
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
