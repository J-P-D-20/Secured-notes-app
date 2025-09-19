import {promises as fs} from 'fs'



export async function deleteUser(username) {
    const filepath = './data.json';
    try{
        const data = await fs.readFile(filepath,'utf-8');
         let users = JSON.parse(data);

         const index = users.findIndex(u =>u.username === username);
         if(index === -1){
            console.error("User not found")
            return;
         }else{
            users.splice(index,1);
         }

         await fs.writeFile(filepath, JSON.stringify(users,null,2));
       
    } catch (err){
        console.error("error deleting user: ",err);
    }
}


export async function readLogs() {
    try{
        const logs = await fs.readFile(LOG_FILE,'utf-8'); 
        return logs
    } catch (err) {
        console.error("Error viewing logs: ", err);
    }
}