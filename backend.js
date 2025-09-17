import {promises as fs} from 'fs';
import {generateChecksum} from './integrity.js';
import {verifyChecksum} from './integrity.js';
import { logEvent } from './auditlogger.js';
import { log } from 'console';


//creating account
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
    logEvent(username, 'REGISTERED', 'Account Created');
    return newUser;
    } catch (err){
        console.error("error saving file", err);
    }
}

//creating note
export async function writeNote(username,title,content) {
    const filepath = './data.json';
    try{
        let users = [];
        try{
        const data = await fs.readFile(filepath, 'utf-8');

        users = JSON.parse(data);

        }catch(err){
            if(err.code !== "ENOENT") throw err
        }
        
        const user = users.find(u => u.username === username);
        if(!user){
            console.log(`user: ${username} not found`);
        }

        if(!user.note){
            user.note = [];
        }

        const newNote = {
            title,
            content,
            checksum: generateChecksum(content),
            date : new Date().toISOString().split("T")[0]
        }

        user.note.push(newNote);

        await fs.writeFile(filepath,JSON.stringify(users,null,2));

        console.log(`Note successfully saved for ${username}`);
        logEvent(username, 'CREATED', 'Note Created');
        return newNote;

    } catch (err) {
        console.error("Unable to save note: ", err);
    }
}

