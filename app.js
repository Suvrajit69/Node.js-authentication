require('dotenv').config()
const express = require('express')
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const bcrypt = require('bcrypt');
const saltRounds = 10;

const app = express()
const port = 3000

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended:true}));
app.use(express.static("public"));

mongoose.connect("mongodb://127.0.0.1:27017",{
    dbName: "userDB"})
.then(()=>console.log("database connected"))
.catch((e)=>console.log(e))

const userSchema = new mongoose.Schema({
  email: String,
  password: String
})


const User = new mongoose.model("User", userSchema);

app.get('/', (req, res) => {
  res.render('home')
})
app.get('/login', (req, res) => {
  res.render('login')
})
app.get('/register', (req, res) => {
  res.render('register')
})
app.post('/register', (req, res) => {

  bcrypt.hash(req.body.password, saltRounds, function(err, hash) {
    // Store hash in your password DB.
    const newUser = new User({
      email: req.body.username,
      password: hash
    });
    newUser.save()
    .then(()=>res.render("secrets"))
    .catch((e)=>console.log(e))
});
});

app.post('/login', (req,res)=>{
  const password = req.body.password;
  const username = req.body.username;

  User.findOne({email: username})
  .then((f)=>{
    if(f){
      bcrypt.compare(password, f.password, function(err, result) {
          // result === true
        if(result === true){
          res.render("secrets")
        };
    });
    
    }
  })
  .catch((e)=>console.log(e))

})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
