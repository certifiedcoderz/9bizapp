##############################################################################
##############################################################################
/*
#* This file is subject to the terms and conditions defined in
#* file 'LICENSE.txt', which is part of this source code package.
#*/
# #Certified CoderZ
# #DOQBox
# 9biZApp Framework
# Common Utility ToolZ
# Writen by Brandon 'Tank9' Poole Sr.
##############################################################################
##############################################################################

module.exports = function(setting){
    var moment = require('moment');
    const { v4: uuidv4 } = require('uuid');

    module.o = function(t,l){
        o(t,l)
    }
    function o(title,_log){
        console.log('-----------------');
        console.log('----START LOG-------');
        console.log(moment().toString());
        console.log('-----------------');
        console.log(title);
        console.log('-----------------');
        console.log(_log);
        console.log('-----------------');
        console.log('----END LOG-------');
        console.log('-----------------');
    }
    module.get_guid = function(){
        return uuidv4();
    }
    module.get_file_ext = function(file_name){
        return file_name.replace(/^.*\./, '');
    }
    module.get_id =  function(max) {
        if(!max){
            max = 99999;
        }
        var r = Math.floor(Math.random() * max) + 1;
        return r.toString();
    }
    module.get_query = function(window)
    {
        return get_query(window);
    }
    get_query = function(window)
    {
        var vars = [], hash;
        var hashes = window.location.href.slice(window.location.href.indexOf('?') + 1).split('&');
        for(var i = 0; i < hashes.length; i++)
        {
            hash = hashes[i].split('=');
            vars.push(hash[0]);
            vars[hash[0]] = hash[1];
        }
        return vars;
    }
    module.get_full_time = function(time) {
        return moment(time, 'HH:mm:ss').format('h:mm A');
    }
    module.get_full_datetime = function(date) {
        if(date){
            var t = moment(date);
            return t.format("MMMM DD YYYY, h:mm:ss a");
        }
        else{
            var t = moment();
            return t.format("MMMM DD YYYY, h:mm:ss a");
        }
    }
    module.get_full_date = function(date) {
        if(date){
            var t = moment(date);
            return t.format("MMMM DD, YYYY");
        }
        else{
            var t = moment();
            return t.format("MMMM DD, YYYY");
        }
    }
    module.get_pretty_date = function(date) {
        if(date){
            var prettydate = require("pretty-date");
            return prettydate.format(new Date(date));
        }
        else{
            return null;
        }
    }
    module.get_string_slug = function(str){
        if(!str)
            return "";
        return str
            .toLowerCase()
            .replace(/ /g,'-')
            .replace(/[^\w-]+/g,'');
    }
    module.set_money = function(n) {
        n = parseFloat(n);
        if(!n || isNaN(n)){
            n = 0;
        }
        return "$ "+ n.toFixed(2).replace(/(\d)(?=(\d{3})+\.)/g, "$1,");
    }
    module.get_currency = function(amount) {
        return Math.round(100 * parseFloat(typeof amount === 'string' ? amount.replace(/[$,]/g, '') : amount));
    }
    module.contains = function contains(value, searchFor){
        return (value || '').indexOf(searchFor) > -1;
    }
    module.remove_html_str = function(str,callback){
        var regex = /(<([^>]+)>)/ig;
        _result = "";
        if(str){
            _result = str.replace(regex, "");
        }
        return _result;
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
# Common Utility ToolZ
# Writen by Brandon 'Tank9' Poole Sr.
##############################################################################
##############################################################################

