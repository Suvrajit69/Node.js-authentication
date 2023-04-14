const express = require("express")
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const passportLocalMongoose = require("passport-local-mongoose");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const findOrCreate = require("mongoose-findorcreate")
const dotenv = require("dotenv");
const app = express()
const port = 3000

dotenv.config()
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended:true}));
app.use(express.static("public"));

app.use(session({
  secret: "keyboard cat",
  resave: false,
  saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect("mongodb://127.0.0.1:27017",{
    dbName: "userDB"})
.then(()=>console.log("database connected"))
.catch((e)=>console.log(e))

const userSchema = new mongoose.Schema({
  email: String,
  password: String,
  googleId: String,
  name: String,
  secret: String
})

userSchema.plugin(passportLocalMongoose)
userSchema.plugin(findOrCreate)

const User = new mongoose.model("User", userSchema);

passport.use(new LocalStrategy(User.authenticate()));

passport.serializeUser((user, done)=>{
  done(null, user.id)
});
passport.deserializeUser( async (id, done)=>{
  const user = await User.findById(id);
  done(null, user)
});

passport.use(new GoogleStrategy({
  clientID: process.env.CLIENT_ID,
  clientSecret: process.env.CLIENT_SECRETS,
  callbackURL: "http://localhost:3000/auth/google/secrets"
},
function(accessToken, refreshToken, profile, cb) {
  User.findOrCreate({ name: profile.displayName ,googleId: profile.id}, function (err, user) {
    return cb(err, user);
  });
}
));

app.get("/", (req, res) => {
  res.render("home")
})

app.get("/auth/google",
  passport.authenticate("google", { scope: ["profile"] 
}));

app.get("/auth/google/secrets", 
  passport.authenticate("google", { failureRedirect: "/login" }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect("/secrets");
  });
app.get("/login", (req, res) => {
  res.render("login")
})
app.get("/register", (req, res) => {
  res.render("register")
})

app.get("/secrets", (req, res) => {
  User.find({"secret":{$ne: null}}).then((foundUser)=>{
    if(foundUser){
      res.render("secrets", {usersWithSecrets: foundUser})
    }
  }).catch((err)=>{console.log(err)})
});

app.get("/submit",(req,res)=>{
  if(req.isAuthenticated()){
    res.render("submit")
  }else{
    res.redirect("/")
  }
})
app.post("/submit", async (req, res) => {
  const submittedSecret = req.body.secret;
  const user = await User.findById(req.user.id).then((foundUser)=>{
    if(err){
      console.log(err)
    }else{
      if(foundUser){
        foundUser.secret = submittedSecret;
        foundUser.save()
        .then(()=>{res.redirect("/secrets")});
      }
    }
  })
})
app.get("/logout", function(req, res){
  req.logout(function(err) {
    if (err) {
       console.log(err); 
      }else{
        res.redirect("/");
      }
  });
});

app.post("/register", (req, res) => {
  User.register({username: req.body.username, active: true}, req.body.password)
  .then(()=>{   
        passport.authenticate("local")(req, res, () => {res.redirect("/secrets");});

  })
  .catch((err)=>{
    console.log(err)
    res.redirect("/register")
  })
  
  
});

app.post("/login", (req,res)=>{
  const user = new User({
    username: req.body.username,
    password: req.body.username
  });
  req.login(user,(err)=>{
    if(err){
      // console.log(err)
    res.redirect("/login")
    }else{
      passport.authenticate("local")(req, res, () => {res.redirect("/secrets");});  
    }
  })
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
