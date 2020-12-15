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
    var _ = require('underscore');
    var mongodb = require('mongodb');
    var async = require('async');
    var moment = require('moment');
    var redis = require('redis');
    var w = require('cc_w')();
    var Data = require('./lib/mongo_db.js')(setting);
    var S3 = require('./lib/s3.js')(setting);
    var Cache = require('./lib/redis_cache.js')(setting);

    var G_SHOW_LOG=setting.show_log;
    var G_DB_NAME=setting.mongo_name;
    var G_SERVER_URL=setting.mongo_url;
    var G_SERVER_PORT=setting.mongo_port;
    var G_PHOTO_URL='https://s3.amazonaws.com/'+setting.aws_s3_bucket_photo+'/';
    var g_client=mongodb.Db(G_DB_NAME, new mongodb.Server(G_SERVER_URL, G_SERVER_PORT, {}), {safe: true});
    var G_TEST_PHOTO = setting.show_test_photo;
    var G_TEST_PHOTO_MAX_COUNT = setting.show_test_photo_max_count;

    module.set_cache_string = function(key, value, callback){
        Cache.set_cache_string(key, value, function(error, result)
            {
                item=get_blank_cache_item();
                item.key=key;
                item.val=value;
                callback(return_get_item(0,null,item));
            });
    }
    module.get_cache_string = function(key, callback){
        Cache.get_cache_string(key, function(error, result)
            {
                item=get_blank_cache_item();
                item.key=key;
                item.data=result.data;
                callback(return_get_item(0,null,item));
            });
    }
    module.del_cache_string = function(key, callback){
        Cache.del_cache_string(key, function(error, result)
            {
                callback(return_get_cache_string(key, error, result));
            });
    }
    module.get_db = function(data_type,tbl_id, callback){
        get_db(data_type,tbl_id, function(result)
            {
                callback(result);
            });
    }
    get_db=function(data_type,tbl_id,callback){
        data_item = {};
        async.series([
            function(call){
                g_client.close();
                call();
            },
            function(call){
                g_client.open(function(error, db) {
                    get_item_db(g_client,data_type,tbl_id, function(result){
                        data_item = result;
                        call();
                    });
                });
            },
            function(call){
                g_client.close();
                call();
            }
        ],
            function(err, results){
                callback(return_get_item(data_type,tbl_id,data_item));
            });
    }
    get_item_db=function(g_client,data_type,tbl_id,callback){
        data_item = get_blank_cache_item();
        data_item.cache_type_id=-1;
        async.series([
            function(call){
                if(!data_type || !tbl_id){
                    data_type='blank';
                    tbl_id=0;
                }
                call();
            },
            function(call){
                Data.get(g_client,data_type,tbl_id, function(error,result){
                    if(result){
                        data_item = result;
                    }
                    call();
                });
            },
            function(call){
                g_client.close();
                call();
            }
        ],
            function(err, results){
                callback(data_item);
            });
    }
    module.get_paging_sql_raw=function(data_type,sql_obj,sort_by,current_page,page_size,callback){
        var data_sql_list = [];
        dt_total=0;
        async.series([
            function(call){
                g_client.open(function(error, db) {
                    Data.paging_sql_raw(g_client,data_type,sql_obj,sort_by,current_page,page_size,function(error, total_count,result_list){
                        dt_total=total_count;
                        for(a=0;a<result_list.length;a++){
                            data_sql_list.push(return_get_item(data_type,result_list[a].tbl_id,result_list[a]));
                        }
                        call();
                    });
                });
            },
            function(call){
                g_client.close();
                call();
            },
        ],
            function(err, results){
                callback(return_get_sql_paging(data_type,sql_obj,sort_by,dt_total,current_page,page_size,data_sql_list));
            });
    }
    module.get_paging_sql_cache=function(data_type,sql_obj,sort_by,current_page,page_size,callback){
        var data_sql_list = [];
        async.series([
            function(call){
                g_client.open(function(error, db) {
                    Data.paging_sql_tbl_id(g_client,data_type,sql_obj,sort_by,current_page,page_size,function(error, total_count,result_list){
                        dt_total=total_count;
                        async.forEachOf(result_list, function (value, key, go)
                            {
                                bind_sql_item(data_type,result_list[key].tbl_id, function(result){
                                    data_sql_list.push(return_get_item(data_type, result_list[key].tbl_id,result));
                                    go();
                                });
                            },
                            function (err) {
                                call();
                            })
                    });
                });
            },
            function(call){
                g_client.close();
                call();
            },
        ],
            function(err, results){
                callback(return_get_sql_paging(data_type,sql_obj,sort_by,dt_total,current_page,page_size,data_sql_list));
            });
    }
    module.get_sql_cache=function(data_type,sql_obj,sort_by,callback){
        var data_sql_list = [];
        async.series([
            function(call){
                g_client.close();
                call();
            },
            function(call){
                g_client.open(function(error, db) {
                    Data.get_sql_tbl_id(g_client,data_type,sql_obj,sort_by, function(error, result_list){
                        async.forEachOf(result_list, function (value, key, go)
                            {
                                bind_sql_item(data_type,result_list[key].tbl_id, function(result){
                                    data_sql_list.push(return_get_item(data_sql_list,result.tbl_id,result));
                                    go();
                                });
                            },
                            function (err) {
                                call();
                            })
                    });
                });
            },
            function(call){
                g_client.close();
                call();
            },
        ],
            // last
            function(err, results){
                callback(return_get_sql(data_type,sql_obj,sort_by,data_sql_list));
            });
    }
    bind_sql_item = function(data_type,tbl_id,callback){
        Cache.get_cache_string(get_cache_item_attr_list_key(data_type,tbl_id), function(error, result){
            if(result.data){ // found cache
                build_cache_obj(data_type,tbl_id,result.data.split(','),function(result_r){
                    callback(result_r);
                });
            }
            else{
                get_item_db(g_client,data_type,tbl_id, function(result_b){
                    if(result_b.cache_type_id!=-1){
                        set_cache_item(data_type,result_b.tbl_id,result_b, function(result_c){
                        });
                    }
                    callback(result_b);
                });
            }
        });
    }
    module.get_sql = function(data_type, sql_obj,sort_by, callback){
        g_client.open(function(error, db) {
            Data.get_sql(g_client,data_type,sql_obj,sort_by, function(error,result)
                {
                    g_client.close();
                    callback(return_get_sql(data_type,sql_obj,sort_by,result));
                });
        });
    }
    module.save_db = function(data_type, item, callback){
        g_client.open(function(error, db) {
            Data.save(g_client,data_type,item, function(error,result)
                {
                    g_client.close();
                    callback(return_get_item(data_type,item.tbl_id,result));
                });
        });
    }
    module.delete_db = function(data_type, tbl_id, callback){
        g_client.open(function(error, db) {
            Data.delete(g_client,data_type,tbl_id, function(error,result)
                {
                    g_client.close();
                    callback(return_get_item(data_type,tbl_id,{status:'DELETE_9_OK'}));
                });
        });
    }
    module.get_cache_item_list=function(data_type,field_id,tbl_ids,callback){
        var data_sql_list = [];
        async.series([
            function(call){
                g_client.close();
                call();
            },
            function(call){
                g_client.open(function(error, db) {
                    async.forEachOf(tbl_ids, function (value, key, go)
                        {
                            bind_sql_item(data_type,tbl_ids[key][field_id], function(result){
                                if(result.tbl_id!=0){
                                    data_sql_list.push(return_get_item(data_type,tbl_ids[key][field_id],result));
                                }
                                go();
                            });
                        },
                        function (err) {
                            call();
                        })
                });
            },
            function(call){
                g_client.close();
                call();
            }
        ],
            function(err, results){
                callback(return_get_sql(data_type,{data_type:field_id},{},data_sql_list));
            });
    }
    module.get_cache_item = function(data_type, tbl_id, callback){
        get_cache_item(data_type,tbl_id,function(result)
            {
                callback(result);

            });
    }
    get_cache_item = function(data_type,tbl_id,callback) {
        data_item = get_blank_cache_item();
        data_item.cache_type_id=-1;
        var item_attr_list_str=null;
        async.series([
            function(call){
                if(!data_type || !tbl_id){
                    data_type='blank';
                    tbl_id=0;
                    data_item={data_type:data_type,tbl_id:0};
                    call();
                }else{
                    call();
                }
            },
            function(call){
                if(tbl_id!=0){
                    Cache.get_cache_string(get_cache_item_attr_list_key(data_type,tbl_id), function(error, result){
                        if(result.data){
                            build_cache_obj(data_type,tbl_id,result.data.split(','),function(result_r){
                                data_item=result_r;
                                call();
                            });
                        }
                        else{
                            get_db(data_type,tbl_id, function(result_b){
                                if(result_b.cache_type_id!=-1){
                                    set_cache_item(data_type,result_b.tbl_id,result_b, function(result_c){
                                        data_item=result_c;//imp_9
                                    });
                                }
                                call();
                            });
                        }
                    });
                }else{
                    call();
                }
            }
        ],
            function(err, results){
                callback(return_get_item(data_type,tbl_id,data_item));
            });
    }
    build_cache_obj = function(data_type,tbl_id,data_param_key_list,callback) {
        var data_item = get_blank_cache_item();
        var data_param_arry = null;
        async.series([
            function(call){
                async.forEachOf(data_param_key_list, function (value, key, go)
                    {
                        Cache.get_cache_string(get_cache_item_attr_key(data_type,tbl_id,data_param_key_list[key]),function(error, result){
                            data_item[value] = result.data;
                            go();
                        });
                    },
                    function (err) {
                        call();
                    })
            }
        ],
            function(err, results){
                callback(data_item);
            });
    }
    function set_cache_item(data_type, tbl_id, data_item, callback){
        var cache_list_key_set=false;
        var cache_string_str='';
        var cache_key_param_obj = {};
        async.series([
            function(call){
                for (property in data_item) {
                    if(!String(property).includes('photo_url') && String(property)){
                        Cache.set_cache_string(get_cache_item_attr_key(data_type,tbl_id,property),data_item[property],function(error, result){
                        });
                        cache_string_str=cache_string_str+property+',';
                    }
                }
                call();
            },
            function(call){
                Cache.set_cache_string(get_cache_item_attr_list_key(data_type,tbl_id),cache_string_str,function(error, result){
                });
                call();
            }
        ],
            function(err, results){
                callback(data_item);
            });
        function get_cache_key_item(org_key_parm_str,data_item){
            if(!org_key_parm_str){
                org_key_parm_str='';
            }
            var new_key_obj = {};
            var f = org_key_parm_str.split(',');
            for(a = 0; a < f.length; a++) {
                if(f[a]){
                    new_key_obj[f[a]] = null;
                }
            }
            for(property in data_item){
                new_key_obj[property] = null;
            }
            return new_key_obj;
        }
    }
    module.reset_cache_item = function(data_type,tbl_id,callback){
        str='';
        async.series([
            function(call){
                Cache.get_cache_string(get_cache_item_attr_list_key(data_type,tbl_id), function(error, result){
                    call();
                });
            },
            function(call){
                call();
            }
        ],
            function(err, results){
                callback();
            });
    }
    module.save_cache = function(data_type,data_item,callback){
        data_result=get_blank_cache_item();
        data_save = false;
        async.series([
            function(call){
                g_client.open(function(error, db) {
                    Data.save(g_client,data_type,data_item,function(error,data)
                        {
                            if(data){
                                data_save=true;
                                call();
                            }
                            else{
                                data_result.tbl_id=0;
                                data_result.data_type=data_type;
                                call();
                            }
                        });
                });
            },
            function(call){
                if(data_save==true){
                    Data.get(g_client,data_type,data_item.tbl_id, function(error,result){
                        if(result){
                            data_result = result;
                            set_cache_item(data_type,data_item.tbl_id,result,function(result_c){
                                data_result=result_c;//imp_9
                                call();
                            });
                        }else{
                            call();
                        }
                    });
                }else{
                    call();
                }
            },
            function(call){
                g_client.close();
                call();
            }
        ],
            function(err, results){
                callback(return_get_item(data_type,data_item.tbl_id,data_result));
            });
    }
    module.delete_child_list =function(parent_sql,child_data_type_list,callback){
        data_result=get_blank_cache_item();
        data_result_list=[];
        var data_result_return_list=[];
        async.series([
            function(call){
                g_client.close();
                call();
            },
            function(call){
                g_client.open(function(error, db) {
                    async.forEachOf(child_data_type_list,function(value, key, goA)
                        {
                            Data.get_sql_tbl_id(g_client,child_data_type_list[key],parent_sql,{}, function(error, result_list){
                                async.forEachOf(result_list, function (value, key, goB)
                                    {
                                        Cache.del_cache_string(get_cache_item_attr_list_key(result_list[key].data_type,result_list[key].tbl_id),function(error, result){
                                            Data.delete(g_client,result_list[key].data_type,result_list[key].tbl_id, function(error, result)
                                                {
                                                    goB();
                                                });
                                        });
                                    },
                                    function (err) {
                                        goA();
                                    })
                            });
                        },
                        function (err) {
                            call();
                        })
                });
            },
            function(call){
                g_client.close();
                call();
            }
        ],
            function(err, results){
                callback(return_get_sql({},{},{},{}));
            });
    }
    module.delete_cache_list = function(data_type,data_item_list,callback){
        data_result=get_blank_cache_item();
        data_result_list=[];
        var data_result_return_list=[];
        async.series([
            function(call){
                g_client.open(function(error, db) {
                    async.forEachOf(data_item_list, function (value, key, go)
                        {
                            Cache.del_cache_string(get_cache_item_attr_list_key(data_type,data_item_list[key].tbl_id),function(error, result){
                                Data.delete(g_client,data_type,data_item_list[key].tbl_id, function(error, result)
                                    {
                                        data_result_return_list.push(result);
                                        go();
                                    });
                            });
                        },
                        function (err) {
                            call();
                        })
                });
            },
            function(call){
                g_client.close();
                call();
            }
        ],
            function(err, results){
                callback(return_get_sql(data_type,{},{},data_result_return_list));
            });
    }
    module.save_cache_list = function(data_type,data_item_list,callback){
        data_result=get_blank_cache_item();
        data_result_list=[];
        var data_result_return_list=[];
        async.series([
            function(call){
                g_client.open(function(error, db) {
                    async.forEachOf(data_item_list,(value, key, go) => {
                        {
                            value.tbl_id=0;
                            value.data_type = data_type;
                            Data.save(g_client,data_type,value,function(error,data_result)
                            {
                                data_result_return_list.push(data_result);
                                go();
                            });
                        }
                    }, err => {
                        if (err) console.error(err.message);
                        call();
                    });
                });
            },
            function(call){
                g_client.close();
                call();
            }
        ],
            function(err, results){
                callback(return_get_sql(data_type,{},{},data_result_return_list));
            });
    }
    module.save_s3 = function(data_type,parent_tbl_id,data_item,callback){
        data_result={};
        async.series([
            function(call){
                S3.save(data_type,parent_tbl_id,data_item, function(result) {
                    data_result = result;
                    call();
                });
            },
        ],
            function(err, results){
                callback(return_get_item(data_type,parent_tbl_id,data_result));
            });
    }
    module.get_s3=function(data_type,parent_tbl_id,callback){
        data_result={};
        async.series([
            function(call){
                S3.get(data_type,parent_tbl_id, function(result) {
                    if(!result){
                        data_result.s3_type_id=0;
                    }
                    else{
                        data_result=result.Body.toString('utf-8')
                    }
                    call();
                });
            },
        ],
            function(err, results){
                callback(return_get_item(data_type,parent_tbl_id,data_result));
            });
    }
    module.delete_cache_item=function(data_type, tbl_id, callback){
        delete_cache_item(data_type,tbl_id,function(result)
            {
                callback(result);
            });
    }
    delete_cache_item = function(data_type,tbl_id,callback){
        data_item=get_blank_cache_item();
        data_item.tbl_id=tbl_id;
        data_item.data_type=data_type;
        async.series([
            function(call){
                Cache.del_cache_string(get_cache_item_attr_list_key(data_type,tbl_id),function(error, result)
                    {

                        data_item.cache_string=get_cache_item_attr_list_key(data_type,tbl_id);
                        data_item.cache_del=true;
                        call();
                    });
            },
            function (call){
                g_client.open(function(error, db) {
                    Data.delete(g_client,data_type,tbl_id, function(error, result)
                        {
                            data_item.data_del=true;
                            g_client.close();
                            call();
                        });
                });
            }
        ],
            function(err, results){
                callback(return_get_item(data_type,tbl_id,data_item));
            });
    }
    module.delete = function(data_type, tbl_id, callback){
        if(tbl_id == undefined){
            tbl_id = 0;
        }
        Data.delete(data_type,tbl_id, function(error, result)
            {
                item = {};
                callback(return_get_item(data_type,tbl_id,item));
            });
    }
    module.test_mongo_connection=function(callback){
        console.log('test_mongo_A');
        g_client.open(function(error, db) {
            console.log('test_mongo_B');
            g_client.close();
            console.log('test_mongo_C');
            callback(error,db);
        });
    }
    module.delete_cache_sql=function(data_type,sql_obj,callback){
        data_item=get_blank_cache_item();
        async.series([
            function(call){
                g_client.open(function(error, db) {
                    Data.get_sql_tbl_id(g_client,data_type,sql_obj,{},function(error,result_list){
                        data_item.db_count = result_list.length;
                        async.forEachOf(result_list, function (value, key, go)
                            {
                                delete_cache_item(data_type,result_list[key].tbl_id ,function(result)
                                    {
                                        go();
                                    });
                            },
                            function (err) {
                                call();
                            })
                    });
                });
            },
            function(call){
                Data.delete_sql(data_type,sql_obj,function(error,result_list){
                    call();
                });
            },
            function(call){
                g_client.close();
            }
        ],
            function(err, results){
                callback(return_get_sql(data_type,sql_obj,{},data_item));
            });
    }
    module.drop = function(data_type, callback){
        g_client.open(function(error, db) {
            Data.drop(g_client,data_type, function( error, result){
                g_client.close();
                callback(return_get_item(data_type,0,'9_drop_success'));
            });
        });
    }
    module.drop_list = function(data_type_list, callback){
        g_client.open(function(error, db) {
            async.forEachOf(data_type_list, (value, key, callback) => {
                Data.drop(g_client,value,function( error, result){
                    callback();
                });
            }, err => {
                if (err) console.error(err.message);
            });
            g_client.close();
            callback(return_get_item(data_type,0,'9_drop_list_success'));
        });
    }
    module.count = function(data_type, sql_obj, callback){
        Data.count(data_type,sql_obj, function( error, result){
            callback(return_get_item(data_type,0,result));
        });
    }
    function return_get_item(data_type,tbl_id,result){
        result.tbl_id_9 = tbl_id;
        no_photo=true;

        result.full_date_create=w.get_full_datetime(result.date_create);
        result.full_date_save=w.get_full_datetime(result.date_save);
        result.pretty_date_create=w.get_pretty_date(result.date_create);
        result.pretty_date_save=w.get_pretty_date(result.date_save);

        _photo_size_album = '';
        _photo_size_mid = 'mid_size_';
        _photo_size_thumb = 'thumb_size_';
        _photo_size_mobile = 'mobile_size_';

        if(G_TEST_PHOTO && !result.photofilename){
            if(G_TEST_PHOTO_MAX_COUNT){
                G_TEST_PHOTO_MAX_COUNT=365;
            }
            rn = w.get_id(G_TEST_PHOTO_MAX_COUNT);
            var url = G_PHOTO_URL+rn+".png";
            result.album_photo_url =url;
            result.mid_photo_url = url;
            result.thumb_photo_url = url;
            result.mobile_photo_url = url;
        }
        else{
            if(result.photofilename){
                    result.album_photo_url = G_PHOTO_URL+ _photo_size_album + result.photofilename;
                    result.mid_photo_url = G_PHOTO_URL+ _photo_size_mid + result.photofilename;
                    result.thumb_photo_url = G_PHOTO_URL+ _photo_size_thumb + result.photofilename;
                    result.mobile_photo_url = G_PHOTO_URL+ _photo_size_mobile + result.photofilename;
            }
            else{
                str='https://s3.amazonaws.com/'+setting.aws_s3_bucket_photo+'/item_detail_thumb.png';
                result.album_photo_url=str;
                result.mid_photo_url=str;
                result.thumb_photo_url=str;
                result.mobile_photo_url=str;
                result.photofilename='';
            }
        }
        if(G_SHOW_LOG){
            w.o('RETURN_GET_ITEM',result);
        }
        return result;
    }
    function return_get_sql(data_type, sql_obj,sort_by,result){
        if(!result){
            result = [];
        }
        var item = {};
        item.data = result;
        item.data_type = data_type;
        item.sql_query = sql_obj;
        item.sort_by = sort_by;
        item.length = result.length;

        print_log('return_get_sql',item);
        return item;
    }
    function return_get_sql_paging(data_type,sql_obj,sort_by,dt_total,current_page,page_size,result){
        if(!result){
            result = [];
        }
        var item = {};
        item.data = result;
        item.data_type = data_type;
        item.sql_query = sql_obj;
        item.sort_by = sort_by;
        item.length = result.length;
        item.page_current = current_page;
        item.page_size = page_size;
        item.page_dt_total=dt_total;
        item.page_page_total = (dt_total / page_size);
        print_log('return_get_sql_paging',item);
        return item;
    }
    print_log=function(title,log){
        if(G_SHOW_LOG){
            w.o(title,log);
        }
    }
    module.get_item_from_list = function(tbl_id,item_list){
        if(!item_list){
            var item_list = [];
        }
        for(a = 0; a < item_list.length; a++){
            if(item_list[a].tbl_id == tbl_id){
                return item_list[a];
            }
        }
        return null;
    }
    function check_exsist_list(item_str,item_list){
        if(!item_list){
            var item_list = [];
        }
        for(a = 0; a < item_list.length; a++){
            if(item_list[a]){
                if(item_list[a] == item_str){
                    return item_list[a];
                }
            }
        }
        return {};
    }
    module.check_exsist_list = function(item_str, item_list) {
        return check_exsist_list(item_str,item_list);
    }
    function check_exsist_list_by_tbl_id(tbl_id,item_list){
        if(!item_list){
            var item_list = [];
        }
        for(a = 0; a < item_list.length; a++){
            if(item_list[a].tbl_id){
                if(item_list[a].tbl_id == tbl_id){
                    return item_list[a];
                }
            }
        }
        return {};
    }
    module.check_exsist_list_by_tbl_id = function(tbl_id, item_list) {
        return check_exsist_list_by_tbl_id(tbl_id,item_list);
    }
    function get_cache_item_attr_key(data_type,tbl_id,key){
        return data_type + "_" + key + "_" + String(tbl_id);
    }
    function get_cache_item_attr_list_key(data_type,tbl_id){
        return data_type+"_aik_"+String(tbl_id);
    }
    function get_blank_cache_item(){
        var item={};
        item.data_type='blank';
        item.tbl_id=0;
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


