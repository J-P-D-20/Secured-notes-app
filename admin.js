import {promises as fs} from 'fs'


export async function getAllNotes() {
    const filepath = './data.json';
    try{
          const data = await fs.readFile(filepath, 'utf-8');
        const users = JSON.parse(data);

    return users.flatMap(user =>
        (user.note || []).map(n => ({
            username: user.username,
            ...n
        }))
    );

    } catch (err){
        if(err.code == "ENOENT"){
            return [];
        }
    }

}


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