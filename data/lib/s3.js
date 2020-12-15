##############################################################################
##############################################################################
/*
#* This file is subject to the terms and conditions defined in
#* file 'LICENSE.txt', which is part of this source code package.
#*/
# #Certified CoderZ
# #DOQBox
# 9biZApp Framework
# Data Access Service
# Writen by Brandon 'Tank9' Poole Sr.
##############################################################################
##############################################################################

module.exports = function(setting){
    var aws = require('aws-sdk');
    var fs = require('fs');
    var S3_FILE_PATH = setting.s3_file_path;
    var S3_OLE_BUCKET = setting.s3_ole_bucket;
    var AWS_ACCESSkEYiD=setting.aws_accessKeyId;
    var AWS_SECRETaCCESSkEY=setting.AWS_SECRETaCCESSkEY;
    aws.config.update({accessKeyId:AWS_ACCESSkEYiD, secretAccessKey: AWS_SECRETaCCESSkEY});
    function get_s3_key(data_type,parent_tbl_id){
        return  String(data_type)+"_"+String(parent_tbl_id);
    }
    function get_s3_full_path(data_type,parent_tbl_id){
        return S3_FILE_PATH+"/"+String(data_type)+"/"+String(data_type)+'_'+String(parent_tbl_id) + '.json';
    }
    function get_s3_bucket_title(data_type){
        return S3_OLE_BUCKET+String(data_type).replace('_','');
    }
    module.get = function(bucket,key,callback){
        data_result={};
        var getParams = {
            Bucket:get_s3_bucket_title(bucket),
            Key:get_s3_key(bucket,key),
        }
        var s3 = new aws.S3();
        s3.getObject(getParams, function(err, data) {
            //callback(data);
        });
    }
    module.save = function(data_type,parent_tbl_id,item,callback){
        async.series([
            //write
            function(call){
                fs.appendFile(get_s3_full_path(data_type,parent_tbl_id),JSON.stringify(item), function (err) {
                    call();
                })
            },
            function(call){
                if(item != null){
                    var s3 = new aws.S3();
                    s3.putObject({
                        Bucket:get_s3_bucket_title(data_type),
                        Key:get_s3_key(data_type,parent_tbl_id),
                        Body:  JSON.stringify(item),
                        ACL: 'public-read'
                    },function (resp) {
                        item.bucket_title=get_s3_bucket_title(data_type);
                        item.bucket_key=get_s3_key(data_type,parent_tbl_id);
                        call();
                    });
                }
                else{
                    item.error='data null on s3';
                    call();
                }
            }
        ],
            function(err, results){
                callback(item);
            });
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
# Data Access Service
# Writen by Brandon 'Tank9' Poole Sr.
##############################################################################
##############################################################################


