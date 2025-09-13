import express from 'express'
import bcrypt from 'bcrypt';


const app = express();
app.use(express.json());


app.get("/", (req, res) =>{
    res.send("Hello world")
<<<<<<< HEAD
=======
    res.send("Cabase")
>>>>>>> f00e2fc3d9ec3387ec987e58b0c79ae8bd362d2b
    res.send("Auditor")
})



const listen = () =>{
    const PORT = 3000
    app.listen(PORT, () =>{
        console.log(`server is listening to port: ${PORT}`)
    })
}

listen();