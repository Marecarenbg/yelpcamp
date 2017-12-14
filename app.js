var express = require("express");
var app = express();
var bodyParser = require("body-parser");
var mongoose = require("mongoose");
var flash      = require("connect-flash");
var passport = require("passport");
var LocalStrategy = require("passport-local");
var mehodOverride = require("method-override");
var Campground = require("./models/campground");
var Comment    = require("./models/comment");
var User       = require("./models/user");
// var seedDB      = require("./seeds");
// require('dotenv').config();


//require routes!!!
var commentRoutes = require("./routes/comments"),
    campgroundRoutes = require("./routes/campgrounds"),
    indexRoutes      = require("./routes/index");

     mongoose.Promise = global.Promise;


// mongoose.connect("mongodb://localhost/yelp_camp_v7");
mongoose.connect("mongodb://kamperica:123456@ds125565.mlab.com:25565/kamperica");

app.use(bodyParser.urlencoded({extended:true}));
app.set("view engine","ejs");
app.use(express.static(__dirname + "/public"));
app.use(mehodOverride("_method"));
app.use(flash());
// seedDB();

//Moment
app.locals.moment = require('moment');

//PASPORT CONFIGURATION
app.use(require("express-session")({
    secret: "Mare je najjaci na svetu",
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use(function(req, res, next){
    res.locals.currentUser = req.user;
    res.locals.error = req.flash("error");
    res.locals.success = req.flash("success");
    next();
});

app.use(indexRoutes);
app.use("/campgrounds/:id/comments", commentRoutes);
app.use("/campgrounds", campgroundRoutes);




app.listen(process.env.PORT, process.env.IP, function(){
    console.log("the YELP CAMP server has started");
});