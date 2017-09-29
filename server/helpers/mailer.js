// Init nodemailer with app config
// Compile email template
// Send email to receiver
'use strict';

var nodemailer = require('nodemailer');

// create reusable transporter object using the default SMTP transport
var jade = require('jade');
var path = require('path');
var config = require("config");
var moment = require('moment');
var transporter = nodemailer.createTransport(config.mailer);
var EmailTemplate = require('email-templates').EmailTemplate;

function Mailer(transporter) {
    this.transporter = transporter;
}

Mailer.prototype.send = function(receivers, template, data, callback) {
    var transporter = this.transporter;
    data.moment = moment;
    var templatePath = path.join(__dirname + '/../', template);
    var sender = transporter.templateSender(new EmailTemplate(templatePath), {
        "from": config.mailer.from
    });
    var complided = jade.compileFile(path.join(templatePath, 'subject.jade'));
    var subject = complided(data);
    
    sender({
        to: receivers,
        bcc: 'thirdstreetadr@gmail.com',
        subject: subject
    }, data, function (err, info) {
        callback();
    });
};

var mailer = new Mailer(transporter); 
// init mailer
module.exports = mailer;
