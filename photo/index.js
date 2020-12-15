##############################################################################
##############################################################################
/*
#* This file is subject to the terms and conditions defined in
#* file 'LICENSE.txt', which is part of this source code package.
#*/
# #Certified CoderZ
# #DOQBox
# 9biZApp Framework
# Photo Service
# Writen by Brandon 'Tank9' Poole Sr.
##############################################################################
##############################################################################

module.exports = function(setting){
    var w = require('cc_w')({});
    var aws = require('aws-sdk');
    var async = require('async');
    const uuid = require('uuid/v4');
    var fs = require('fs');
    var gm = require('gm').subClass({ imageMagick: true });
    var request = require('request');
    var P_PHOTO_URL ="https://s3.amazonaws.com/"+setting.aws_s3_bucket+"/";
    var G_FILE_PATH = setting.photo_file_path;
    var G_SHOW_LOG = setting.G_SHOW_LOG;
    var G_AWS_KEY = setting.aws_key;
    var P_AWS_SECRET = setting.aws_secret;
    var G_AWS_S3_BUCKET = setting.aws_s3_bucket;
    var G_PHOTO_SIZE_ALBUM = '';
    var G_PHOTO_SIZE_MID = 'mid_size_';
    var G_PHOTO_SIZE_THUMB = 'thumb_size_';
    var G_PHOTO_SIZE_MOBILE = 'mobile_size_';

    module.get_photo_url = function(item, size){
        if(item && item.photofilename){
            return P_PHOTO_URL + size + item.photofilename;
        }
        else{
            return null;
        }
    }
    module.save_mobile_local = function(helper, callback){
        helper.new_photo_file_name = uuid() + '.jpg';
        helper.target_path = G_FILE_PATH + helper.new_photo_file_name;
        helper.photo_save_result = '';
        helper.validation_message = null;
        async.series([
            function(call){
                fs.rename(helper.temp_path, helper.target_path, function(err) {
                    call();
                });
            },
            function(call){
                save_resize_saves3(helper.new_photo_file_name, helper.new_photo_file_name, function(result) {
                    call();
                });
            }
        ],
            function(err, results){
                callback(helper);
            });
    }
    module.save_local = function(req, res, uploader, callback){
        uploader.post(req, res, function(err, photo_obj) {
            res.header("Access-Control-Allow-Origin", "*");
            res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
            callback(photo_obj);
        });
    }
    module.save_url_rotate_s3 = function save_url_rotate_s3(url, callback){
        var new_photo_file_name = uuid() + '.jpg';
        async.series([
            function(call){
                gm(request(url)).rotate('white',90)
                    .write(G_FILE_PATH + new_photo_file_name, function (err) {
                        call();
                    });
            },
        ],
            // last
            function(err, results){
                save_resize_saves3(new_photo_file_name,new_photo_file_name, function(result){
                    var r_helper={photofilename:new_photo_file_name};
                    callback(return_get_item(r_helper));
                });
            });
    }
    module.save_resize_saves3 = function(org_file_name, key, callback){
        save_resize_saves3(org_file_name,key,function(result){
            callback(result);
        });
    }
    module.save_url_s3 = function save_url_s3(helper, callback){
        async.series([
            function(call){
                if(!helper.uploadfilename){
                    new_photo_file_name = uuid()  + '.jpg';
                }
                else{
                    new_photo_file_name=helper.uploadfilename;
                }
                call();
            },
            function(call){
                call();
            },
            function(call){
                helper.new_photo_file_name = new_photo_file_name;
                helper.new_photo_url = P_PHOTO_URL+new_photo_file_name;
                helper.server_file_path = G_FILE_PATH + new_photo_file_name;

                gm(request(helper.photo_url))
                    .write(G_FILE_PATH + new_photo_file_name, function (err) {
                        helper.err_server_local = err;
                        call();
                    });
            },
        ],
            function(err, results){
                save_resize_saves3(new_photo_file_name,new_photo_file_name, function(result){
                    helper={photofilename:new_photo_file_name};
                    callback(return_get_item(helper));
                });
            });
    }
    module.save_resize_saves3 = function(org_file_name, key, callback){
        if(!key){
            key = uuid() + '.jpg';
        }
        save_resize_saves3(org_file_name,key, function(result){
            var r_helper={photofilename:key};
            callback(return_get_item(r_helper));
        });
    }
    function save_resize_saves3(org_file_name, key, callback){
        var error_message = undefined;
        var p_buffer = '';
        async.series([
            function(call){
                gm(G_FILE_PATH + org_file_name)
                    .toBuffer(function (err, buffer) {
                        if(err){
                            console.log('Save_Resize_Error');
                            console.log(err);
                        }
                        p_buffer = buffer;
                        send_s3_buffer(buffer,key, function(err_2) {
                            call();
                        });
                    })
            },
            function(call){
                web_size_new_photo_file_name = G_PHOTO_SIZE_MOBILE + key;
                gm(p_buffer)
                    .resize(600)
                    .autoOrient()
                    .toBuffer(function (err, buffer) {
                        send_s3_buffer(buffer,web_size_new_photo_file_name, function(err_2) {
                            call();
                        });
                    });
            },
            function(call){
                var mid_size_new_photo_file_name = G_PHOTO_SIZE_MID + key;
                gm(p_buffer)
                    .resize(900)
                    .autoOrient()
                    .toBuffer(function (err, buffer) {
                        send_s3_buffer(buffer,mid_size_new_photo_file_name, function(err_2) {
                            call();
                        });
                    });
            },
            function(call){
                var thumb_size_new_photo_file_name = G_PHOTO_SIZE_THUMB + key;
                gm(p_buffer)
                    .resize(250)
                    .autoOrient()
                    .toBuffer(function (err, buffer) {
                        send_s3_buffer(buffer,thumb_size_new_photo_file_name, function(err_2) {
                            call();
                        });
                    });
            }
        ],
            function(err, results){
                callback(error_message);
            });
    }
    module.save_kit_icon = function(org_file_name, key, callback){
        if(!key){
            key = uuid() + '.png';
        }
        save_kit_icon(org_file_name,key, function(result){
            var r_helper={photofilename:key};
            r_helper.three_six_photo_url=P_PHOTO_URL+'36_'+r_helper.photofilename;
            r_helper.four_eight_photo_url=P_PHOTO_URL+'48_'+r_helper.photofilename;
            r_helper.seven_two_photo_url=P_PHOTO_URL+'72_'+r_helper.photofilename;
            r_helper.nine_six_photo_url=P_PHOTO_URL+'96_'+r_helper.photofilename;
            r_helper.one_four_four_photo_url=P_PHOTO_URL+'144_'+r_helper.photofilename;
            r_helper.one_nine_two_photo_url=P_PHOTO_URL+'192_'+r_helper.photofilename;
            r_helper.thumb_photo_url=P_PHOTO_URL+'250_'+r_helper.photofilename;
            r_helper.album_photo_url=P_PHOTO_URL+r_helper.photofilename;
            r_helper.photofilename=r_helper.photofilename;
            callback(r_helper);
        });
    }
    function save_kit_icon(org_file_name, key, callback){
        var error_message = undefined;
        var p_buffer = '';
        async.series([
            function(call){
                gm(G_FILE_PATH + org_file_name)
                    .toBuffer(function (err, buffer) {
                        if(err){
                            console.log('Save_Resize_saves3_KIT_ERROR');
                            console.log(err);
                        }
                        p_buffer = buffer;
                        send_s3_buffer(buffer,key, function(err_2) {
                            call();
                        });
                    })
            },
            function(call){
                gm(p_buffer)
                    .resize(36)
                    .autoOrient()
                    .toBuffer(function (err, buffer) {
                        send_s3_buffer(buffer,'36_' + key, function(err_2) {
                            call();
                        });
                    });
            },
            function(call){
                gm(p_buffer)
                    .resize(48)
                    .autoOrient()
                    .toBuffer(function (err, buffer) {
                        send_s3_buffer(buffer,'48_' + key, function(err_2) {
                            call();
                        });
                    });
            },
            function(call){
                gm(p_buffer)
                    .resize(72)
                    .autoOrient()
                    .toBuffer(function (err, buffer) {
                        send_s3_buffer(buffer,'72_' + key, function(err_2) {
                            call();
                        });
                    });
            },
            function(call){
                gm(p_buffer)
                    .resize(96)
                    .autoOrient()
                    .toBuffer(function (err, buffer) {
                        send_s3_buffer(buffer,'96_' + key, function(err_2) {
                            call();
                        });
                    });
            },
            function(call){
                gm(p_buffer)
                    .resize(144)
                    .autoOrient()
                    .toBuffer(function (err, buffer) {
                        send_s3_buffer(buffer,'144_' + key, function(err_2) {
                            call();
                        });
                    });
            },
            function(call){
                gm(p_buffer)
                    .resize(192)
                    .autoOrient()
                    .toBuffer(function (err, buffer) {
                        send_s3_buffer(buffer,'192_' + key, function(err_2) {
                            call();
                        });
                    });
            },
            function(call){
                gm(p_buffer)
                    .resize(250)
                    .autoOrient()
                    .toBuffer(function (err, buffer) {
                        send_s3_buffer(buffer,'250_' + key, function(err_2) {
                            call();
                        });
                    });
            }
        ],
            function(err, results){
                callback(error_message);
            });
    }
    function send_s3_buffer(data,key,callback){
        aws.config.update({ accessKeyId: G_AWS_KEY, secretAccessKey: P_AWS_SECRET, region: 'us-east-1'});
        s3 = new aws.S3();
        if(data != null){
            var base64data = new Buffer(data, 'binary');
            s3.putObject({
                Bucket: G_AWS_S3_BUCKET,
                Key: String(key),
                Body: base64data,
                ACL: 'public-read'
            },function (err,resp) {
                if(err){
                    console.log('PHOTO_ERROR_S3 send_s3_buffer');
                    console.log(err);
                }
                callback();
            });
        }
        else{
            callback('data null on s3 upload');
        }
    }
    function send_file_s3(key,callback){
        aws.config.update({ accessKeyId: G_AWS_KEY, secretAccessKey: P_AWS_SECRET});
        s3 = new aws.S3();
        fs.readFile(G_FILE_PATH, function (err, data) {
            if (err)
            {
                callback();
            }
            else{
                var base64data = new Buffer(data, 'binary');

                s3.putObject({
                    Bucket: G_AWS_S3_BUCKET,
                    Key: key,
                    Body: base64data,
                    ACL: 'public-read'
                },function (resp) {
                    callback();
                });
            }
        });
    }
    function return_get_item(result){
        result.album_photo_url=P_PHOTO_URL+G_PHOTO_SIZE_ALBUM+result.photofilename;
        result.mid_photo_url=P_PHOTO_URL+G_PHOTO_SIZE_MID+result.photofilename;
        result.thumb_photo_url=P_PHOTO_URL+G_PHOTO_SIZE_THUMB+result.photofilename;
        result.mobile_photo_url=P_PHOTO_URL+G_PHOTO_SIZE_MOBILE+result.photofilename;
        return result;
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
# Photo Service
# Writen by Brandon 'Tank9' Poole Sr.
##############################################################################
##############################################################################
