import express from 'express'
import bcrypt from 'bcrypt';


const app = express();
app.use(express.json());


app.get("/", (req, res) =>{
    res.send("Hello world")
    res.send("Tabibito")
    res.send("Cabase")
    res.send("Auditor")
})



const listen = () =>{
    const PORT = 3000
    app.listen(PORT, () =>{
        console.log(`server is listening to port: ${PORT}`)
    })
}

listen();