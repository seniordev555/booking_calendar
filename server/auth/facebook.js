/*
 * Authentication with facebook
 */
'use strict';

module.exports = function(app){
    var passport = require('passport')
        , FacebookStrategy = require('passport-facebook').Strategy;
    var config = require('config');

    var authCommon = require('./common');

    var strategyOpts = config.get('auth.facebook');
    strategyOpts.passReqToCallback = true;

    passport.use(new FacebookStrategy(strategyOpts,
        function (req, accessToken, refreshToken, profile, done) {

            var photo = null;
            if (profile.photos && profile.photos[0] && profile.photos[0].value) {
                photo = profile.photos[0].value;
            }

            var email = null;
            if (profile.emails && profile.emails[0] && profile.emails[0].value) {
                email = profile.emails[0].value;
            }

            var data = {
                'profileId': profile.id,
                'displayName' : profile.displayName,
                'profileType': 'facebook',
                "email": email,
                //@see http://www.oneminuteinfo.com/2015/08/getting-facebook-user-profile-url-by-id.html
                'profileUrl': 'https://www.facebook.com/app_scoped_user_id/' + profile.id,
                'accessToken': accessToken,
                'profilePhoto': photo
            };

            authCommon.authenticated(req, data, done);
        }
    ));

    // GET /auth/facebook
    //   Use passport.authenticate() as route middleware to authenticate the
    //   request.  The first step in Facebook authentication will involve
    //   redirecting the user to facebook.com.  After authorization, Facebook will
    //   redirect the user back to this application at /auth/facebook/callback
    app.get('/auth/facebook',
        authCommon.invitationTokenReceiver,
        passport.authenticate('facebook', {scope: ['public_profile', 'email']}),
        function(req, res){
          // The request will be redirected to Facebook for authentication, so this
          // function will not be called.
        });

    // GET /auth/facebook/callback
    //   Use passport.authenticate() as route middleware to authenticate the
    //   request.  If authentication fails, the user will be redirected back to the
    //   login page.  Otherwise, the primary route function function will be called,
    //   which, in this example, will redirect the user to the home page.
    app.get('/auth/facebook/callback',
        passport.authenticate('facebook', { failureRedirect: config.baseUrl }),
        function(req, res) {
            var redirectUrl = authCommon.getBookingRedirectUrl(req);
            res.redirect(redirectUrl);
        });
};


