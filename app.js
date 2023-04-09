require('dotenv').config()
const express = require('express')
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const md5 = require("md5")

const app = express()
const port = 3000
console.log(md5('qwe'))
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
  const newUser = new User({
    email: req.body.username,
    password: md5(req.body.password)
  });
  newUser.save()
  .then(()=>res.render("secrets"))
  .catch((e)=>console.log(e))
})

app.post('/login', (req,res)=>{
  const password = md5(req.body.password);
  const username = req.body.username;

  User.findOne({email: username})
  .then((f)=>{
    if(f){
      if(f.password === password){
        res.render("secrets")
      }
    }
  })
  .catch((e)=>console.log(e))

})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
