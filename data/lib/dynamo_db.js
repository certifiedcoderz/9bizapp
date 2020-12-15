var aws = require('aws-sdk');
var AWS = require("aws-sdk");
var _ = require('underscore');
var mongodb = require('mongodb');
var async = require('async');
var moment = require('moment');
var redis = require('redis');
var w = require('cc_w')();

module.exports = function(setting){
    var p_aws_accessKeyId = setting.aws_accessKeyId;
    var p_aws_secretAccessKey = setting.aws_secretAccessKey;

    module.save = function(data_type,parent_tbl_id,item, callback){
        aws.config.update({ accessKeyId: p_aws_accessKeyId, secretAccessKey: p_aws_secretAccessKey});

        AWS.config.update({
            region: "us-east-1",
            accessKeyId: p_aws_accessKeyId, secretAccessKey: p_aws_secretAccessKey,
        });

        var docClient = new AWS.DynamoDB.DocumentClient()
        var params = {
            TableName:data_type,
            Key:item,
        };


        console.log("Updating the item...");
        console.log(params);
        console.log('end');
        docClient.update(params, function(err, data) {
            if (err) {
                console.error("Unable to update item. Error JSON:", JSON.stringify(err, null, 2));
            } else {
                console.log("UpdateItem succeeded:", JSON.stringify(data, null, 2));
            }
        });
    }

    return module;
}
