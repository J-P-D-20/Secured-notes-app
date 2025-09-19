const password = 'pass123'
const hash = await bcrypt.hash(password, 13)
const isMatch = await bcrypt.compare(password, hash)

console.log(isMatch)