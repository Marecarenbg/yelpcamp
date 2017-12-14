var express = require("express");
var router = express.Router();
var Campground = require("../models/campground");
var middleware = require("../middleware");
var geocoder = require("geocoder");

var multer = require('multer');
var storage = multer.diskStorage({
  filename: function(req, file, callback) {
    callback(null, Date.now() + file.originalname);
  }
});
var imageFilter = function (req, file, cb) {
    // accept image files only
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/i)) {
        return cb(new Error('Only image files are allowed!'), false);
    }
    cb(null, true);
};
var upload = multer({ storage: storage, fileFilter: imageFilter})

var cloudinary = require('cloudinary');
cloudinary.config({ 
  cloud_name: 'marecare', 
  api_key: 165779323641496, 
  api_secret: "6b6N4gL8FolUWodui_uccyScdkI"
});





//index - show all campgrounds 
router.get("/", function(req, res){
    var noMatch = null;
    if(req.query.search){
        const regex = new RegExp(escapeRegex(req.query.search), 'gi');
           //get all campgrounds
    Campground.find({name: regex},function(err, allcampgrounds){
        if(err){
            console.log(err);
        } else {
            if (allcampgrounds.length <1) {
                noMatch = "No campgrounds match that query, please try again.";
            } 
            res.render("campgrounds/index",{campgrounds: allcampgrounds, page: 'campgrounds', noMatch: noMatch, pages: null});
        }
    });
    } else {
    //get all campgrounds
        res.redirect("/campgrounds/page/1");
    }
});

// PAGINATION INDEX - show all campgrounds
router.get("/page/:page", function (req, res) {
    var noMatch = null;
    var perPage = 6;
    var page = req.params.page || 1;
    Campground.find({}).skip((perPage * page) - perPage).limit(perPage).exec(function (err, allCampgrounds) {
        if (err) {
            return console.log(err);
        }
        Campground.count().exec(function (err, count) {
            if (err) {
                console.log(err);
            } else {
                res.render("campgrounds/index", {
                    campgrounds: allCampgrounds,
                    current: page,
                    pages: Math.ceil(count / perPage),
                    page: 'campgrounds',
                    noMatch: noMatch
                });
            }
        });
    });
});



//CREATE - add new campground to DB
router.post("/", middleware.isLoggedIn, upload.single('image'), function(req, res){

    //Local Variables 

    // get data from form and add to campgrounds array
    var name = req.body.name;
    var image = req.body.image ? req.body.image : "/images/temp.png";
    var desc = req.body.description;
    var author = {
        id: req.user._id,
        username: req.user.username
    };

    var cost = req.body.cost;


    //Location Code - Geocode Package
    geocoder.geocode(req.body.location, function (err,data) {
        var lat = data.results[0].geometry.location.lat;
        var lng = data.results[0].geometry.location.lng;
        var location = data.results[0].formatted_address;


        //Zarko Maslaric And Ian SchHelped Impliment the Image Upload 

        cloudinary.uploader.upload(req.file.path, function(result) {
            
            // add cloudinary url for the image to the campground object under image property
            
            //image variable needs to be here so the image can be stored and uploaded to cloudinary
            image = result.secure_url;

            //Captures All Objects And Stores Them
            var newCampground = {name: name, image: image, description: desc, author:author, cost: cost, location: location, lat: lat, lng: lng};

            // Create a new campground and save to DB by using the create method
            Campground.create(newCampground, function(err, newlyCreated){
                if(err){
                    //Logs Error
                    req.flash('error', err.message);

                    return res.redirect('back');

                } else {

                    //redirect back to campgrounds page

                    //Logs Error
                    console.log(newlyCreated);

                    //Redirects Back To Featured Campgrounds Page
                    res.redirect("/campgrounds");
                }
            });
        });
    });
});
// new show form to create campgrounds


router.get("/new", middleware.isLoggedIn, function(req,res){
    res.render("campgrounds/new");
});
// SHOW - Show more info about one campground
router.get("/:id", function(req, res){
    //find the campground witdh provided ID
    Campground.findById(req.params.id).populate("comments").exec(function(err, foundCampground){
        if(err){
            console.log(err);
        } else {
            console.log(foundCampground);
              res.render("campgrounds/show", {campground: foundCampground});
        }
    });
});

// EDIT CAMPGROUND ROUTE

router.get("/:id/edit", middleware.checkCampgroundOwnership, function(req, res) {
          Campground.findById(req.params.id, function(err, foundCampground){
             res.render("campgrounds/edit", {campground: foundCampground});
    });
});
 

//UPDATE CAMPGROUND ROUTE

router.put("/:id", middleware.checkCampgroundOwnership, function(req, res){
    console.log(req.body);
    //find and update the correct campground
    geocoder.geocode(req.body.location, function (err, data) {
    if (data && data.results && data.results.length) {
        var lat = data.results[0].geometry.location.lat;
        var lng = data.results[0].geometry.location.lng;
        var location = data.results[0].formatted_address;
    } else {
        var lat = 0;
        var lng = 0;
        var location = "";
    }
    
    var newData = {name: req.body.name, image: req.body.image, description: req.body.description, cost: req.body.cost, location: location, lat: lat, lng: lng};
    
    Campground.findByIdAndUpdate(req.params.id, {$set: newData}, function(err, updatedCampground){
        if(err){
            res.redirect("/campgrounds");
        } else {
            res.redirect("/campgrounds/" + req.params.id);
        }
    });
    // redirect somwehere(show page)
});
});

//DESTROY CAMPGROUND ROUTE
router.delete("/:id", middleware.checkCampgroundOwnership, function(req, res){
    Campground.findByIdAndRemove(req.params.id, function(err){
        if(err){
            res.redirect("/campgrounds");
        }else {
            res.redirect("/campgrounds");
        }
    });
});



function escapeRegex(text){
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
};
     


module.exports = router;

