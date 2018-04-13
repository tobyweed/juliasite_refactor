//Dependencies
const express = require("express");
const app = express();
const MongoClient = require('mongodb').MongoClient;
const bodyParser = require('body-parser');
const cloudinary = require('cloudinary');
const cloudinaryStorage = require('multer-storage-cloudinary');
const multer = require('multer');


//Setup
app.use(express.static(__dirname + "/public"));
app.use(bodyParser.urlencoded({extended: true}))
app.set("view engine", "ejs");

//cloudinary config
cloudinary.config({ 
  SECRET; 
});

//Cloudinary/multer setup
var storage = cloudinaryStorage({
  cloudinary: cloudinary,
  folder: '/julia_site',
  allowedFormats: ['jpg', 'png', 'jpeg']
})

var upload = multer({ 
    storage: storage
}).single('painting');


//++++++++++++++++++========================ROUTES==================+++++++++++======+++==+==+=+++++===+++==+++==+

//GALLERY=======================================================================

//Landing/paintings route
app.get("/",(req,res)=>{
    db.collection('paintings').find().toArray((err, collection)=>{
        if(err) return console.log(err);
        res.render("paintings",{paintings:collection, cloudinary:cloudinary});
    });
});

//Post route 
app.post('/paintings', upload, (req, res) => {
    db.collection('paintings').count().then( (numPaints)=> {
        db.collection('paintings').save({description: req.body.description, url: req.file.url, index: numPaints}, (err, result) => {
            if (err) {
                console.log(err)
            } else {
                res.redirect('/')
            }
        })
    })
})



//INFO ROUTES ==================================================================

//Statement
//get
app.get("/statement",(req,res)=>{
    db.collection("statement").findOne( (err,result) => {
        if(err) return console.log(err);
        console.log(result);
        res.render("info/statement",{statement:result});
    });
});

//post
app.post("/statement",(req,res)=>{
    console.log(req.body.text);
    db.collection('statement').replaceOne({},req.body,{upsert:true});
    res.redirect("/statement");
})

//Workshops
//get
app.get("/workshops",(req,res)=>{
    res.render("info/workshops");
});

//Contact
//get
app.get("/contact",(req,res)=>{
    res.render("info/contact");
});




//Connect to DB
var db;

MongoClient.connect('mongodb://username:password@ds237979.mlab.com:37979/testing', (err, client) => {
    if(err ){
        console.log(err);
    } else {
        db = client.db('testing');
        app.listen(process.env.PORT, process.env.IP, function(){
            console.log("server is listening");
        });
    }
});