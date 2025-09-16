import {promises as fs} from 'fs';
import { json } from 'stream/consumers';




export async function register(username,password,role) {
    const filepath = './data.json';

    try{
        let users = [];
        try{
        const data = await fs.readFile(filepath,'utf-8');
        users = JSON.parse(data)
    } catch (err) { 
        if(err.code !== "ENOENT") throw err;
    }
    let newUser = {username,password,role};

    users.push(newUser);

    await fs.writeFile(filepath, JSON.stringify(users,null,2))
    
    console.log("User saved succesfully");
    return newUser;
    } catch (err){
        console.error("error saving file", err);
    }
}