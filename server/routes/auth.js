/* 
 * Common setup for authentication with passport
 */
'use strict';

module.exports = function(app){
    var passport = require('passport');
    var User = require("mongoose").model("User");
    
    // Passport session setup.
    //   To support persistent login sessions, Passport needs to be able to
    //   serialize users into and deserialize users out of the session.  Typically,
    //   this will be as simple as storing the user ID when serializing, and finding
    //   the user by ID when deserializing.  However, since this example does not
    //   have a database of user records, the complete Facebook profile is serialized
    //   and deserialized.
    passport.serializeUser(function(user, done) {
      done(null, user);
    });

    passport.deserializeUser(function(obj, done) {
        User.findById(obj._id, function (err, user) {
            done(null, user);
        });
    });

    app.use(passport.initialize());
    app.use(passport.session());

    app.get('/logout', function(req, res){
        req.logout();
        res.redirect('/');
    });

    app.get('/me', function(req, res){
        if (req.user) {
            var data = req.user.toObject();
            data.id = data._id;
            res.json(data);
        } else {
            res.status(403).json({message: "No session found"});
        }        
    });
    
    
    //setup required social networks for auth
    var facebookAuth = require('../auth/facebook');
    var googleAuth = require('../auth/google');
    var linkedinAuth = require('../auth/linkedin');
    facebookAuth(app);
    googleAuth(app);
    linkedinAuth(app);

};