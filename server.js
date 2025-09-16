import { register,writeNote } from './backend.js';
import express from 'express'
import bcrypt from 'bcrypt';


const app = express();
app.use(express.json());



app.post('/registration' , async (req,res) => {
    try{
    const {username,password,role} = req.body;
    const hashedPassword = await bcrypt.hash(password, 13);

    const saveUser = await register(username,hashedPassword,role);

    console.log(saveUser);
    conso
    res.status(200).send("Account Created Successfully")
    } catch (err) {
        console.error("Registration Error",err);
        res.status(500).send("registration error");
    }
})

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
