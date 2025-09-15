import express from 'express'
import bcrypt from 'bcrypt';


const app = express();
app.use(express.json());

const user = [

]


app.post('/registration' , async (req,res) => {
    const {username,password,role} = req.body;
    const hash = await bcrypt.hash(password, 13);

    user.push({
        username,
        password: hash,
        role
    })

    console.log(user);
    res.send("Account Created Successfully")
})







const listen = () =>{
    const PORT = 3000
    app.listen(PORT, () =>{
        console.log(`server is listening to port: ${PORT}`)
    })
}

listen();