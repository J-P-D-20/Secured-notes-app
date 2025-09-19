import {promises as fs} from 'fs';
import {generateChecksum} from './integrity.js';
import {verifyChecksum} from './integrity.js';
import { logEvent } from './auditLogger.js';


//readFile function with user and note validation
export async function readFile(filepath, encoding = 'utf-8', username = null, title = null) {
    try {
        const data = await fs.readFile(filepath, encoding);
        const users = JSON.parse(data);
        
        // If username is provided, check if user exists
        if (username) {
            const user = users.find(u => u.username === username);
            
            if (!user) {
                console.log(`❌ User '${username}' does not exist in data.json`);
                logEvent(username, 'READ_FILE_FAILED', `User not found`);
                return null;
            }
            
            console.log(`✅ User '${username}' found in data.json`);
            
            // If title is provided, check if note with that title exists for the user
            if (title && user.note) {
                const note = user.note.find(n => n.title === title);
                
                if (!note) {
                    console.log(`❌ Note with title '${title}' does not exist for user '${username}'`);
                    logEvent(username, 'READ_NOTE_FAILED', `Note "${title}" not found`);
                    return null;
                }
                
                // Verify checksum integrity
                const isValid = verifyChecksum(note.content, note.checksum);
                if (!isValid) {
                    console.log(`⚠️ Integrity check FAILED for note '${title}'`);
                    logEvent(username, 'INTEGRITY_FAILED', `Note "${title}" checksum mismatch`);
                } else {
                    console.log(`✅ Integrity check PASSED for note '${title}'`);
                }

                console.log(`✅ Note '${title}' found for user '${username}'`);
                console.log(`📝 Note Content: ${note.content}`);
                console.log(`📅 Date: ${note.date}`);
                console.log(`🔒 Checksum: ${note.checksum}`);
                return note;
            }
            
            // If only username provided, display all notes for the user
            if (user.note && user.note.length > 0) {
                console.log(`📚 Notes for user '${username}':`);
                user.note.forEach((note, index) => {
                    console.log(`${index + 1}. Title: ${note.title}`);
                    console.log(`   Content: ${note.content}`);
                    console.log(`   Date: ${note.date}`);
                    console.log(`   Checksum: ${note.checksum}`);
                    
                    // Verify each note integrity
                    const isValid = verifyChecksum(note.content, note.checksum);
                    if (!isValid) {
                        console.log(`⚠️ Integrity check FAILED for "${note.title}"`);
                        logEvent(username, 'INTEGRITY_FAILED', `Note "${note.title}" checksum mismatch`);
                    } else {
                        console.log(`✅ Integrity check PASSED for "${note.title}"`);
                    }

                    console.log('---');
                });
                logEvent(username, 'READ_ALL_NOTES', `User notes retrieved`);
                return user.note;
            } else {
                console.log(`📝 No notes found for user '${username}'`);
                logEvent(username, 'READ_ALL_NOTES', `No notes found`);
                return [];
            }
        }
        
        // If no username provided, return all data
        logEvent('SYSTEM', 'READ_FILE', `All users data retrieved`);
        return users;
    } catch (err) {
        console.error(`Error reading file ${filepath}:`, err);
        logEvent(username, 'READ_FILE_FAILED', `ERROR - ${err.message}`);
        throw err;
    }
}


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
        logEvent(username, 'REGISTER_FAILED', `ERROR - ${err.message}`);
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
            logEvent(username, 'NOTE_CREATION_FAILED', 'User not found');
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
        logEvent(username, 'NOTE_CREATED', `Note "${title}" created`);
        return newNote; 

    } catch (err) {
        console.error("Unable to save note: ", err);
        logEvent(username, 'NOTE_CREATION_FAILED', `ERROR - ${err.message}`);
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
            logEvent(username, 'NOTE_UPDATE_FAILED', 'User not found');
            return null;
        }

        if (!user.note) {
            console.log(`No notes found for user: ${username}`);
            logEvent(username, 'NOTE_UPDATE_FAILED', 'No notes for user');
            return null;
        }

        const note = user.note.find(n => n.title === title);
        if (!note) {
            console.log(`Note with title "${title}" not found`);
            logEvent(username, 'NOTE_UPDATE_FAILED', `Note "${title}" not found`);
            return null;
        }

        // Update content + checksum + date
        note.content = newContent;
        note.checksum = generateChecksum(newContent);
        note.date = new Date().toISOString();

        await fs.writeFile(filepath, JSON.stringify(users, null, 2));
        console.log(`Note "${title}" updated for ${username}`);
        logEvent(username, 'NOTE_UPDATED', `Note "${title}" updated`);

        return note;

    } catch (err) {
        console.error("Unable to update note:", err);
        logEvent(username, 'NOTE_UPDATE_FAILED', `ERROR - ${err.message}`);
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
            logEvent(username, 'NOTE_DELETE_FAILED', 'User not found');
            return false;
        }

        if (!user.note) {
            console.log(`No notes found for user: ${username}`);
            logEvent(username, 'NOTE_DELETE_FAILED', 'No notes for user');
            return false;
        }

        const initialLength = user.note.length;
        user.note = user.note.filter(n => n.title !== title);

        if (user.note.length === initialLength) {
            console.log(`Note with title "${title}" not found`);
            logEvent(username, 'NOTE_DELETE_FAILED', `Note "${title}" not found`);
            return false;
        }

        await fs.writeFile(filepath, JSON.stringify(users, null, 2));
        console.log(`Note "${title}" deleted for ${username}`);
        logEvent(username, 'NOTE_DELETED', `Note "${title}" deleted`);
        return true;

    } catch (err) {
        console.error("Unable to delete note:", err);
        logEvent(username, 'NOTE_DELETE_FAILED', `ERROR - ${err.message}`);
        return false;
    }
}
