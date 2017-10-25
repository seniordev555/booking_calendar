/*
 * Authentication with linkedin
 */
'use strict';

module.exports = function(app){
    var passport = require('passport'),
        LinkedInStrategy = require('passport-linkedin-oauth2').Strategy;
    var config = require('config');
    var linkedinConfig = config.get('auth.linkedin');
    linkedinConfig.state = true;
    linkedinConfig.passReqToCallback = true;

    var authCommon = require('./common');
    passport.use(new LinkedInStrategy(linkedinConfig,
        function (req, accessToken, refreshToken, profile, done) {
            var photo = null;
            if (profile.photos && profile.photos[0] && profile.photos[0].value) {
                photo = profile.photos[0].value;
            }

            var profileUrl = null;
            if (profile._json && profile._json.publicProfileUrl) {
                profileUrl = profile._json.publicProfileUrl;
            }

            var email = null;
            if (profile.emails && profile.emails[0] && profile.emails[0].value) {
                email = profile.emails[0].value;
            }

            var data = {
                'profileId': profile.id,
                'displayName' : profile.displayName,
                'profileType': 'linkedin',
                'profileUrl': profileUrl,
                'accessToken': accessToken,
                'profilePhoto': photo,
                'email': email
            };

            authCommon.authenticated(req, data, done);
        }
    ));

    app.get('/auth/linkedin',
            authCommon.invitationTokenReceiver,
            passport.authenticate('linkedin'),
            function (req, res) {
                // The request will be redirected to LinkedIn for authentication, so this
                // function will not be called.
            });

    app.get('/auth/linkedin/callback',
        passport.authenticate('linkedin', { failureRedirect: config.baseUrl }),
        function(req, res) {
            var redirectUrl = authCommon.getBookingRedirectUrl(req);
            res.redirect(redirectUrl);
        });
};


