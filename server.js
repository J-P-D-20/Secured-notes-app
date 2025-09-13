import express from 'express'
import bcrypt from 'bcrypt';


const app = express();
app.use(express.json());


app.get("/", (req, res) =>{
    res.send("Hello world")
<<<<<<< HEAD
    res.send("Tabibito")
=======
    res.send("Cabase")
>>>>>>> 88ec217175aceccae3c37094c5c5bfc9768d273a
})



const listen = () =>{
    const PORT = 3000
    app.listen(PORT, () =>{
        console.log(`server is listening to port: ${PORT}`)
    })
}

listen();