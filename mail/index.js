##############################################################################
##############################################################################
/*
#* This file is subject to the terms and conditions defined in
#* file 'LICENSE.txt', which is part of this source code package.
#*/
# #Certified CoderZ
# #DOQBox
# 9biZApp Framework
# Mail Service
# Writen by Brandon 'Tank9' Poole Sr.
##############################################################################
##############################################################################

module.exports = function(setting){
    var aws = require('aws-sdk');
    var w = require('cc_w')();
    var aws_key = setting.aws_key;
    var aws_secret = setting.aws_secret;

    module.send_email = function(mail,callback){
        aws.config.update({accessKeyId:aws_key,secretAccessKey:aws_secret, region:'us-east-1'});
        var ses = new aws.SES();
        var params = {
            Destination: {
                CcAddresses: [
                    String(mail.to)
                ]
            },
            Message: {
                Body: {
                    Html: {
                        Charset: "UTF-8",
                        Data: String(mail.body)
                    },
                    Text: {
                        Charset: "UTF-8",
                        Data: String(mail.body)
                    }
                },
                Subject: {
                    Charset: 'UTF-8',
                    Data: String(mail.subject)
                }
            },
            Source: mail.from,
            ReplyToAddresses: [
                String(mail.to)
            ],
        };
        ses.sendEmail(params, function(err,data){
            if(err){
                console.log('Email Send Error');
                console.log(data);
                console.log(err);
                console.log('Email Send Error End');
            }
            callback(mail);
        });
    }
    function send_email_html(mail, call_back){
    }

    return module;
}
##############################################################################
##############################################################################
/*
#* This file is subject to the terms and conditions defined in
#* file 'LICENSE.txt', which is part of this source code package.
#*/
# #Certified CoderZ
# #DOQBox
# 9biZApp Framework
# Mail Service
# Writen by Brandon 'Tank9' Poole Sr.
##############################################################################
##############################################################################


