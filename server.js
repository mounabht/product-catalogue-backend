var express = require('express');
var _ = require('lodash');
var bodyparser = require('body-parser');
var mongoClient = require('mongodb').MongoClient;
var cors = require('cors');
var multer = require('multer');
var Q = require('q');
var path = require('path');
var mongoose = require('mongoose');
var schema = require('mongoose').Schema;
var ObjectID = require('mongodb').ObjectID;

mongoose.connect('mongodb://localhost/product_db');

var produitModel = require('./schemas/product-schemas');
var productRouter = require('./routes/product.route');
var userRouter = require('./routes/user.route');
var invitationRouter = require('./routes/invitation.route');

var app = express();

app.use(cors());

app.use(function (req, res, next) { //allow cross origin requests
    res.setHeader("Access-Control-Allow-Methods", "POST, PUT, OPTIONS, DELETE, GET");
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "X-Requested-With, Content-Type");
    res.header("Access-Control-Allow-Credentials", true);
    next();
});


app.use(bodyparser.urlencoded({
    extended: true
}));
app.use(bodyparser.json());

app.use("/upload", express.static(path.join(__dirname, 'upload')));
app.use(express.static('public'));

app.use('/', productRouter);
app.use('/', userRouter);
app.use('/', invitationRouter);


var storage = multer.diskStorage({ //multers disk storage settings
    destination: function (req, file, cb) {
        cb(null, './upload');
    },
    filename: function (req, file, cb) {
        var produitId = req.body.produitId;
        console.log(produitId);
        var path = file.fieldname + '_' + produitId + '.' + file.originalname.split('.')[file.originalname.split('.').length - 1];
        cb(null, path);
        updatePhoto(produitId, path)
            .then(function () {
                res.sendStatus(200);
            })
            .catch(function (err) {
                res.status(400).send(err);
            });


    }
});

var upload = multer({
    storage: storage
}).single('photo');

app.post('/upload', upload, function (req, res, next) {
    upload(req, res, function (err) {
        if (err) {
            res.json({
                error_code: 1,
                err_desc: err
            });
            return;
        }
        res.json({
            error_code: 0,
            err_desc: 'Product Photo successfully uploded'
        });
    });
});


function updatePhoto(_id, path) {
    var deferred = Q.defer();
    produitModel.findByIdAndUpdate(_id, {
            $set: {
                photo_url: path
            }
        },
        function (err, doc) {
            if (err) deferred.reject(err.name + ': ' + err.message);
            deferred.resolve();
        });
    return deferred.promise;
}

// Server Listening on http://localhost:3000
app.listen(3000, () => {
    console.log('Server listening on 3000');
})