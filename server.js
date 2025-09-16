import { register,writeNote } from './backend.js';
import express from 'express'
import bcrypt from 'bcrypt';
<<<<<<< HEAD
import fs from 'fs/promises';
import jwt from 'jsonwebtoken';

=======
import rateLimit from 'express-rate-limit';
>>>>>>> a8787e95d6f746e99b58e0ef5d352c3728398b71



const app = express();
app.use(express.json());

<<<<<<< HEAD
// JWT Secret keys (use environment variables in production)
const JWT_SECRET = process.env.ACCESS_TOKEN_SECRET || 'fallback-secret';
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET || 'fallback-refresh-secret';

// Temporary storage for refresh tokens (for production, store securely)
let refreshTokens = [];
=======
// ✅ Availability Feature 1: Rate Limiting
const limiter = rateLimit({
    windowMs: 1 * 60 * 1000, 
    max: 50, 
    message: { error: "Too many requests. Please slow down and try again later." }
});
>>>>>>> a8787e95d6f746e99b58e0ef5d352c3728398b71

app.use(limiter);

// ✅ Availability Feature 2: Health Check Endpoint
app.get('/status', (req, res) => {
    res.status(200).json({
        status: "OK",
        uptime: `${process.uptime().toFixed(2)} seconds`,
        timestamp: new Date().toISOString()
    });
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

<<<<<<< HEAD
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
        const accessToken = jwt.sign({ name: user.name }, ACCESS_TOKEN_SECRET, { expiresIn: '10s' });
        res.json({ accessToken });
    });
=======
// ✅ Availability Feature 3: Global Error Handler
app.use((err, req, res, next) => {
    console.error("Unexpected Error:", err.message);
    res.status(500).json({ error: "Internal Server Error. Please try again later." });
});

// ✅ Availability Feature 4: Graceful Shutdown
process.on('SIGINT', () => {
    console.log("\nGracefully shutting down the server...");
    process.exit(0);
>>>>>>> a8787e95d6f746e99b58e0ef5d352c3728398b71
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

const listen = () =>{
    const PORT = 3000
    app.listen(PORT, () =>{
        console.log(`server is listening to port: ${PORT}`)
    })
}
 
listen();
