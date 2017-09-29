'use strict';

process.env.NODE_ENV = 'test';

var chai = require('chai');
chai.should();

var mockery = require("mockery");
mockery.enable({
    warnOnUnregistered: false,
    warnOnReplace: false
});

// do not sent mail on testing
function mockMailer(expectedEmails, expectedTemplate, expectedData) {
    mockery.registerMock("./mailer", {
        "send": function (receivers, template, data, callback) {
            if (expectedEmails) {
                receivers.should.equals(expectedEmails);
            }
            
            if (expectedTemplate) {
                template.should.equals(template);
            }
            
            if (expectedData) {
                expectedData.should.equals(template);
            }
            callback();
        }
    });
}

mockMailer();

var server = require('../app');
var request = require('supertest');
var passportStub = require('passport-stub');

passportStub.install(server);
var req = request(server);


var User = require("mongoose").model("User");

after(function (done) {
    // Clean all user
    User.remove({}, done);
});

function loginWithAdmin(done) {
   User.create({"fullname": "Test admin", "role": "admin", "email": "admin@example.com"}, function (err, admin) {
        passportStub.login(admin); 
        done(err, admin);
    });
}

function loginWithUser(done) {
    User.create({"fullname": "Test user", "role": "user", "email": "user@example.com"}, function (err, user) {
        passportStub.login(user);
        done();
    });
}

describe("Bookings", function () {
    it("should not allow create booking on /api/bookings POST without user", function (done) {
        request(server).post('/api/bookings').end(function (err, res) {
            res.status.should.equal(403);
            done();
        });
    });
    
    it("should admin can create booking on /api/bookings POST", function (done) {
        loginWithAdmin(function (err, user) {
            request(server)
            .post("/api/bookings")
            .send({"production": "Foo"})
            .end(function (err, res) {
                res.status.should.equal(200);
                res.body.owner._id.should.equal(user.id);
                res.body.production.should.equal("Foo");
                done();
            });
        });
    });
    
    it("should user can create booking on /api/bookings POST", function (done) {
        loginWithUser(function (err, user) {
            request(server)
            .post("/api/bookings")
            .end(function (err, res) {
                res.status.should.equal(200);
                done();
            });
        });
    });
});