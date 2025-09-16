import {promises as fs} from 'fs';


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
            date : new Date().toISOString()
        }

        user.note.push(newNote);

        await fs.writeFile(filepath,JSON.stringify(users,null,2));

        console.log(`Note successfully saved for ${username}`);
        return newNote;

    } catch (err) {
        console.error("Unable to save note: ", err);
    }
}