//Dependencies
const express = require("express");
const app = express();
const MongoClient = require('mongodb').MongoClient;
const bodyParser = require('body-parser');
const methodOverride = require('method-override');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const cookieParser = require('cookie-parser');
const session = require('express-session');

const middleware = require("./middleware");
const paintingRoutes = require("./routes/paintings");

//misc setup
app.set("view engine", "ejs");
app.use(express.static(__dirname + "/public"));
app.use(bodyParser.urlencoded({extended: true}));
app.use(methodOverride('_method'));
app.use(cookieParser());

//connect to db
var db;
MongoClient.connect('mongodb://'+ process.env.MONGO_USER + ':' + process.env.MONGO_PASSWORD + '@ds035633.mlab.com:35633/juliajensenstudio2', (err, client) => {
    if(err){
        console.log(err);
    } else {
        db = client.db('juliajensenstudio2');
    }
});

//passport setup
app.use(session({ secret: process.env.SECRET, resave: false, saveUninitialized: false }));
app.use(passport.initialize());
app.use(passport.session());
    
passport.serializeUser(function(user, done) {
    done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  done(null, { id: id, nickname: "test"})
});

passport.use(new LocalStrategy(
  function(username, password, done) {
      if (username === process.env.USERNAME && password === process.env.PASSWORD) {
          return done(null, { name: "test", id: '1234'});
      } else {
          return done(null, false, { message: 'Incorrect cred.' });
      }
  })
)

//isAuthenticated middleware for template login awareness
app.use(function (req, res, next) {
  res.locals.login = req.isAuthenticated();
  next();
});


//++++++++++++++++++===================ROUTES==================+++++++++++======

//Gallery
app.use("/",paintingRoutes);

//INFO ROUTES ==================================================================

//about
//get
app.get("/about",(req,res)=>{
    db.collection("about").findOne( (err,result) => {
        if (err) {
            console.log(err);
            return res.render("err");
        }
        db.collection('cv').findOne( (err,cv)=>{
            if (err) {
                console.log(err);
                return res.render("err");
            }
            db.collection('portrait').findOne( (err,portrait) => {
                if (err) {
                    console.log(err);
                    return res.render("err");
                }
                res.render("info/about", { cv:cv.url, about:result, portrait:portrait });
            });
        });
    });
});

//post
app.post("/about",(req,res)=>{
    db.collection('about').replaceOne({},req.body,{upsert:true});
    res.redirect("/about");
});

//workshops
//get
app.get("/workshops",(req,res)=>{
    db.collection("workshops").findOne( (err,result) => {
        if (err) {
            console.log(err);
            return res.render("err");
        }
        res.render("info/workshops",{workshops:result});
    });
});

//post
app.post("/workshops",(req,res)=>{
    db.collection('workshops').replaceOne({},req.body,{upsert:true});
    res.redirect("/workshops");
})

//Contact
//get
app.get("/contact",(req,res)=>{
    res.render("info/contact");
});



//AUTH==========================================================================
app.get('/login', (req,res) => {
    res.render('login');
});

app.post('/login', passport.authenticate('local', { 
      successRedirect: '/',
      failureRedirect: '/login'
    })
);

//logout
app.get("/logout", function(req,res){
    req.logout();
    res.redirect("/");
});



//Safety net.
app.get("*",function(req,res){
    res.render("empty");
})


//Start server
app.listen(process.env.PORT, process.env.IP, function(){
    console.log("server is listening");
});
