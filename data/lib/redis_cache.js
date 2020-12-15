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
    var redis = require('redis');
    var server_url = setting.redis_url;
    var server_port = setting.redis_port;
    var client = redis.createClient(server_port, server_url);
    module.set_cache_string = function(key,value,callback){
        if(!value||value==null||value==undefined){
            value=" ";
        }
        value=String(value).trim();
        client.set(key, value, function(error,result) {
            callback(error,return_get(key,value,result));
        });
    }
    module.get_cache_string = function(key,callback){
        client.get(key, function(error, result) {
            callback(error,return_get(key,0,result));
        });
    }
    module.del_cache_string = function(key,callback){
        client.del(key, function(error, result) {
            callback(error,return_get(key,-1,result));
        });
    }
    function return_get(key,val,res){
        var item={};
        item.key=key;
        item.val=val;
        item.data=res;
        return item;
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
