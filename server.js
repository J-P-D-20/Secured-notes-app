import { register } from './backend.js';
import express from 'express'
import bcrypt from 'bcrypt';
import rateLimit from 'express-rate-limit';



const app = express();
app.use(express.json());

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

const listen = () =>{
    const PORT = 3000
    app.listen(PORT, () =>{
        console.log(`server is listening to port: ${PORT}`)
    })
}
 
listen();
