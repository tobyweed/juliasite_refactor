const express = require("express");
const router = express.Router({mergeParams: true});
const MongoClient = require('mongodb').MongoClient;
const cloudinary = require('cloudinary');
const cloudinaryStorage = require('multer-storage-cloudinary');
const multer = require('multer');
const methodOverride = require('method-override');

//Connect to MongoDB
var db;
MongoClient.connect('mongodb://'+ process.env.MONGO_USER + ':' + process.env.MONGO_PASSWORD + '@ds035633.mlab.com:35633/juliajensenstudio2', (err, client) => {
    if(err ){
        console.log(err);
    } else {
        db = client.db('juliajensenstudio2');
    }
});

//Middleware
const middleware = require("../middleware");

//cloudinary config
cloudinary.config({ 
    cloud_name: process.env.CLOUD_USER, 
    api_key: process.env.CLOUD_API_KEY, 
    api_secret: process.env.CLOUD_API_SECRET
});

//Cloudinary/multer setup
const storage = cloudinaryStorage({
  cloudinary: cloudinary,
  folder: '/julia_site',
  allowedFormats: ['jpg', 'png', 'jpeg', 'pdf']
});

const upload = multer({ 
    storage: storage
}).single('painting');

//CV && PORTRAIT============================================================================
//Handled in the paintings.js router file because image uploads are not implemented in app.js.
router.post("/cv", upload, (req,res)=> {
    db.collection('cv').deleteMany({},(err,deleted)=>{
        if (err) {
            console.log(err);
            return res.render("err");
        }
        db.collection('cv').save({ url: req.file.secure_url }, (err, uploaded)=>{
            if (err) {
                console.log(err);
                return res.render("err");
            }
            res.redirect('/about');
        });
    });
});

router.post("/portrait", upload, (req,res)=> {
    db.collection('portrait').deleteMany({},(err,deleted)=> {
        if (err) {
            console.log(err);
            return res.render("err");
        }
        db.collection('portrait').save({ url: req.file.secure_url }, (err, uploaded)=>{
            if (err) {
                console.log(err);
                return res.render("err");
            }
            res.redirect('/about');
        });
    });
});


//GALLERY=======================================================================

//Landing/paintings
router.get("/",(req,res)=>{
    db.collection('paintings').find().sort({index:1}).toArray((err, collection)=>{
        if(err) {
            console.log(err);
            return res.render("err");
        } else {
            res.render("paintings", {paintings:collection, cloudinary:cloudinary});
        }
    });
});


//Show painting
router.get("/paintings/:index", (req,res)=>{
    let index = Number(req.params.index);
    db.collection('paintings').find().sort({index:1}).toArray((err, paintings)=>{
        if (err) {
            console.log(err);
            return res.render("err");
        }
        res.render("show", { painting : paintings[index], paintings : paintings});
    });
});

//Post
router.post('/paintings', upload, (req, res) => {
    db.collection('paintings').count().then( (numPaints)=> {
        db.collection('paintings').save({description: req.body.description, url: req.file.secure_url, index: numPaints}, (err, result) => {
            if (err) {
                console.log(err);
                return res.render("err");
            } else {
                res.redirect('/');
            }
        });
    });
});

//Update position
router.put('/paintings/:index/:mtn', (req,res)=> {
    let index = Number(req.params.index);
    let mtn = Number(req.params.mtn);
    let target_id;
    
    // Find the id of the painting being moved
    db.collection('paintings').findOne({index:index},(err,target)=>{
        if (err) {
            console.log(err);
            return res.render("err");
        }
        // Store id
        target_id = target._id;
        
        let incNums = [];
        let incVal;
        
        //Store all numbers between index and index+mtn, and whether those numbers should be pos or neg inc
        if(mtn <= 0){
            incVal = 1;
        } else  {
            incVal = -1;
        }
        for(var i = mtn; i != 0; i += incVal) {
            console.log(index);
            incNums.push(index+i);
            console.log(incNums);
        }
        
        console.log("incVal = " + incVal + " & incNums = " + incNums);
            
        // Find all documents with indices equal to values in incNums and subtract incVal from their indices
        db.collection('paintings').updateMany({index: { $in: incNums}}, 
        {$inc : { index : incVal}}, (err,paintings) => {
            if (err) {
                console.log(err);
                return res.render("err");
            }
            
            //Add mtn to the originally targeted document's index
            db.collection('paintings').update({_id : target_id },{ $inc : { index : mtn }}, (err,updated)=>{
                if (err) {
                    console.log(err);
                    return res.render("err");
                }
                
                res.redirect("/");
            });
        });
    });
});


//Destroy
router.delete('/paintings/:index', (req,res) => {
    let index = Number(req.params.index);
    db.collection('paintings').deleteOne({index : index }, (err, deleted)=> {
        if (err) {
            console.log(err);
            return res.render("err");
        }

        db.collection('paintings').updateMany( {index : { $gt : index }}, {$inc : { index : -1}}, (err,update)=>{
            if (err) {
                console.log(err);
                return res.render("err");
            }
            
            res.redirect("/");
        });
    });
});

module.exports = router;