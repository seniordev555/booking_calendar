/*
 * Authentication with google
 */
'use strict';

module.exports = function(app){
    var passport = require('passport')
        , GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;
    var config = require('config');

    var authCommon = require('./common');
    var strategyOpts = config.get('auth.google');
    strategyOpts.passReqToCallback = true;

    passport.use(new GoogleStrategy( strategyOpts,
        function (req, accessToken, refreshToken, profile, done) {
            var photo = null;
            if (profile.photos && profile.photos[0] && profile.photos[0].value) {
                photo = profile.photos[0].value;
            }
            var email = null;
            if (profile.emails && profile.emails[0] && profile.emails[0].value) {
                email = profile.emails[0].value;
            }

            var profileUrl = null;
            if (profile._json && profile._json.url) {
                profileUrl = profile._json.url;
            }

            var data = {
                'profileId': profile.id,
                'displayName' : profile.displayName,
                'profileType': 'google',
                'profileUrl': profileUrl,
                'accessToken': accessToken,
                'profilePhoto': photo,
                'email': email
            };

            authCommon.authenticated(req, data, done);
        }
    ));

    app.get('/auth/google',
        authCommon.invitationTokenReceiver,
        passport.authenticate(
            'google',
            { scope: ['https://www.googleapis.com/auth/plus.login', 'https://www.googleapis.com/auth/plus.profile.emails.read'] }
            ),
        function(req, res){
          // The request will be redirected to google for authentication, so this
          // function will not be called.
        });

    app.get('/auth/google/callback',
        passport.authenticate('google', { failureRedirect: config.baseUrl }),
        function(req, res) {
            var redirectUrl = authCommon.getBookingRedirectUrl(req);
            res.redirect(redirectUrl);
        });
};


