const app = require("./app");
const connectDB = require("./config/db");
const { registerListeners } = require("./events/listeners");
require('dotenv').config();

const PORT = process.env.PORT;

app.listen( PORT, ()=>{
    console.log(`Server listening on http://localhost:${PORT}`)
})

connectDB();

registerListeners();