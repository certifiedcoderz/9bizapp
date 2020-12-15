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

const { v4: uuidv4 } = require('uuid');
var _ = require('underscore');
var mongodb = require('mongodb');
var async = require('async');
var moment = require('moment');
module.exports = function(setting){
    var DB_NAME = setting.mongo_name;
    var SERVER_URL = setting.mongo_url;
    //g_client =  mongodb.Db(DB_NAME,new mongodb.Server(SERVER_URL, SERVER_PORT, {}), {safe: true});
    var module = {};
    //go_db_get,go_get
    module.get = function(g_client,data_type, tbl_id, callback){
        g_client.collection(data_type, function(error, collection) {
            collection.findOne({tbl_id:tbl_id}, function(error, result) {
                callback(error, result);
            });
        });
    }
    module.get_sql_tbl_id_by_list = function(g_client,data_type, list, sort_by, callback){
        //db.inventory.find( { qty: { $in: [ 5, 15 ] } } )
        var sql_obj = { tbl_id: { $in: list } };
        g_client.collection(data_type, function(error, collection) {
            collection.find(sql_obj, {tbl_id:1,data_type:1}).sort(sort_by).toArray( function(error, result) {
                callback(error, result);
            });
        });
    }
    module.get_sql_tbl_id = function(g_client,data_type, sql_obj, sort_by, callback){
        //db.inventory.find( { type: 'food' }, { item: 1, qty: 1, _id:0 } )
        g_client.collection(data_type, function(error, collection) {
            collection.find(sql_obj, {tbl_id:1,data_type:1}).sort(sort_by).toArray( function(error, result) {
                callback(error, result);
            });
        });
    }
    module.paging_sql_tbl_id = function(g_client,data_type,sql_obj,sort_by,current_page,page_size, callback){
        var total_count = 0;;
        var result_list = [];
        async.series([
            function(call){
                g_client.collection(data_type, function(error, collection) {
                    collection.find(sql_obj,{tbl_id:1}).count( function(error, result) {
                        total_count=result;
                        call();
                    });
                });
            },
        ],
            function(err, results){
                g_client.collection(data_type, function(error, _collection) {
                    _collection.find(sql_obj,{tbl_id:1,data_type:1}).sort(sort_by)
                        .skip( current_page > 0 ? ( ( current_page - 1 ) * page_size ) : 0 )
                        .limit( page_size )
                        .toArray( function(error, result) {
                            callback(error,total_count,result);
                        });
                });
            });
    }
    module.paging_sql_raw = function(g_client,data_type,sql_obj,sort_by,current_page,page_size, callback){
        var total_count = 0;;
        var result_list = [];
        async.series([
            function(call){
                g_client.collection(data_type, function(error, collection) {
                    collection.find(sql_obj,{tbl_id:1}).count( function(error, result) {
                        total_count=result;
                        call();
                    });
                });
            },
        ],
            function(err, results){
                g_client.collection(data_type, function(error, _collection) {
                    _collection.find(sql_obj,{}).sort(sort_by)
                        .skip( current_page > 0 ? ( ( current_page - 1 ) * page_size ) : 0 )
                        .limit( page_size )
                        .toArray( function(error, result) {
                            callback(error,total_count,result);
                        });
                });
            });
    }
    module.get_sql = function(g_client,data_type, sql_obj, sort_by, callback){
        g_client.collection(data_type, function(error, collection) {
            collection.find().sort(sort_by).toArray( function(error, result) {
                callback(error, result);
            });
        });
    }
    module.save = function(g_client,data_type, item, callback){
        if (String(item.tbl_id) == '0') {
            item.date_create = new moment().toISOString();
            item.date_save = new moment().toISOString();
            item.tbl_id = uuidv4();
            g_client.collection(data_type, function(error, collection) {
                collection.save(item, function(error, result) {
                    callback(error, item);
                });
            });
        }
        else{
            item.date_save = new moment().toISOString();
            g_client.collection(data_type, function(error, collection) {
                collection.update({tbl_id:item.tbl_id}, {$set: item}, function(error, result) {
                    callback(error, item);
                });
            });
        }
    }
    module.delete = function(g_client,data_type, tbl_id, callback){
        g_client.collection(data_type, function(error, collection) {
            collection.remove({tbl_id:tbl_id}, function(error, result) {
                callback(error, result);
            });
        });
    }
    module.delete_sql = function(g_client,data_type, sql_obj, callback){
        g_client.collection(data_type, function(error, collection) {
            collection.remove(sql_obj, function(error, result) {
                callback(error, result);
            });
        });
    }
    module.drop = function(g_client,data_type, callback){
        g_client.collection(data_type, function(error, collection) {
            collection.drop( function(error, result) {
                callback(error, 'DROP OK');
            });
        });
    }
    module.count = function(g_client,data_type, sql, callback){
        g_client.collection(data_type, function(error, collection) {
            collection.find(sql).count( function(error, result) {
                callback(error, result);
            });
        });
    }
    /*
    module.update_many = function(data_type, sql, item, callback){
        client.open(function(error, db) {
            client.collection(data_type, function(error, collection) {
                collection.update({},item, {$multi: true}, function(error, result) {
                    callback(result);
                    client.close();
                });
            });
        });
    }
    */
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

