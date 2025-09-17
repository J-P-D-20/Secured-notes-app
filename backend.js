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
            date : new Date().toISOString()
        }

        user.note.push(newNote);

        await fs.writeFile(filepath,JSON.stringify(users,null,2));

        console.log(`Note successfully saved for ${username}`);
        logEvent(username, 'CREATED', `Note "${title}" created`);
        return newNote; 

    } catch (err) {
        console.error("Unable to save note: ", err);
    }
}

//updating note
export async function updateNote(username, title, newContent) {
    const filepath = './data.json';

    try {
        let users = JSON.parse(await fs.readFile(filepath, 'utf-8'));
        const user = users.find(u => u.username === username);

        if (!user) {
            console.log(`User: ${username} not found`);
            return null;
        }

        if (!user.note) {
            console.log(`No notes found for user: ${username}`);
            return null;
        }

        const note = user.note.find(n => n.title === title);
        if (!note) {
            console.log(`Note with title "${title}" not found`);
            return null;
        }

        // Update content + checksum + date
        note.content = newContent;
        note.checksum = generateChecksum(newContent);
        note.date = new Date().toISOString();

        await fs.writeFile(filepath, JSON.stringify(users, null, 2));
        console.log(`Note "${title}" updated for ${username}`);
        logEvent(username, 'UPDATED', `Note "${title}" updated`);
        return note;

    } catch (err) {
        console.error("Unable to update note:", err);
        return null;
    }
}

//deleting note
export async function deleteNote(username, title) {
    const filepath = './data.json';

    try {
        let users = JSON.parse(await fs.readFile(filepath, 'utf-8'));
        const user = users.find(u => u.username === username);

        if (!user) {
            console.log(`User: ${username} not found`);
            return false;
        }

        if (!user.note) {
            console.log(`No notes found for user: ${username}`);
            return false;
        }

        const initialLength = user.note.length;
        user.note = user.note.filter(n => n.title !== title);

        if (user.note.length === initialLength) {
            console.log(`Note with title "${title}" not found`);
            return false;
        }

        await fs.writeFile(filepath, JSON.stringify(users, null, 2));
        console.log(`Note "${title}" deleted for ${username}`);
        logEvent(username, 'DELETED', `Note "${title}" deleted`);
        return true;

    } catch (err) {
        console.error("Unable to delete note:", err);
        return false;
    }
}