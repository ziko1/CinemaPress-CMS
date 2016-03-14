'use strict';

var config       = require('../config/config');
var express      = require('express');
var router       = express.Router();
var path         = require('path');
var fs           = require('fs');

router.get('/?', function(req, res) {

    res.render('admin', config);

});

router.post('/save', function(req, res) {

    req.body.cache.time_storage  = parseInt(req.body.cache.time_storage);
    req.body.cache.full_storage  = parseInt(req.body.cache.full_storage);
    req.body.counts.index        = parseInt(req.body.counts.index);
    req.body.counts.category     = parseInt(req.body.counts.category);
    req.body.counts.top_category = parseInt(req.body.counts.top_category);
    req.body.counts.related      = parseInt(req.body.counts.related);
    req.body.counts.sitemap      = parseInt(req.body.counts.sitemap);
    req.body.top                 = req.body.top.map(function(id) {return parseInt(id);});
    req.body.abuse               = req.body.abuse.map(function(id) {return parseInt(id);});
    req.body.titles              = br(req.body.titles);
    req.body.titles.movie        = br(req.body.titles.movie);
    req.body.descriptions        = br(req.body.descriptions);
    req.body.descriptions.movie  = br(req.body.descriptions.movie);
    req.body.keywords            = br(req.body.keywords);
    req.body.keywords.movie      = br(req.body.keywords.movie);
    req.body.titles.sort         = br(req.body.titles.sort);
    req.body.code                = br(req.body.code);

    var data = JSON.stringify(req.body);

    fs.writeFile(path.join(path.dirname(__dirname), 'config', 'config.new.js'), 'module.exports = ' + data + ';', function(err) {
        if (err) {
            console.log(err);
            res.status(404).send('Error');
        }
        else {
            fs.rename(path.join(path.dirname(__dirname), 'config', 'config.js'), path.join(path.dirname(__dirname), 'config', 'config.old.js'), function (err) {
                if (err) throw err;
                fs.rename(path.join(path.dirname(__dirname), 'config', 'config.new.js'), path.join(path.dirname(__dirname), 'config', 'config.js'), function (err) {
                    if (err) throw err;
                    res.status(200).send('Save');
                });
            });
        }
    });

});

function br(obj) {

    for (var key in obj) {

        if (obj.hasOwnProperty(key) && typeof obj[key] === 'string') {

            obj[key] = obj[key].replace(/(\n|\r)/g,'&nbsp;').replace(/\\*?"/g,'\\"');

        }

    }

    return obj;

}

module.exports = router;