require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const Schema = mongoose.Schema;

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());

app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

//Database Connection
mongoose.connect('mongodb+srv://aestebance:73994757@cluster0.suqbq.mongodb.net/test?retryWrites=true&w=majority',{
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const urlSchema = new Schema({
  original_url: {
    type: String,
    required: true
  },
  short_url: {
    type: Number,
    required: true
  }
});

let Url = mongoose.model('Url', urlSchema);


// Your first API endpoint
app.get('/api/hello', function(req, res) {
  res.json({ greeting: 'hello API' });
});

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});


//CUSTOM ENDPOINTS

app.post('/api/shorturl/new', bodyParser.urlencoded({extended: false}), function(req, res){
  const inputUrl = req.body.url;
  let response = {};
  let short_url = 1;
  var expression = new RegExp(/[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)?/gi);
  if (!inputUrl.match(expression)){
    res.json({error: "Invalid URL"});
    return;
  }
  response['original_url'] = inputUrl;

  Url.findOne({})
      .sort({short_url: 'desc'})
      .exec((err, result) => {
        if (!err && result != undefined){
          short_url = result.short_url + 1;
        }
        if (!err) {
          Url.findOneAndUpdate(
              {original_url: inputUrl},
              {original_url: inputUrl, short_url: short_url},
              {new: true, upsert: true},
              (err, data) => {
                if (!err) {
                  response['short_url'] = data.short_url;
                  res.json(response);
                }
          });
        }
      });
});

app.get('/api/shorturl/:url', (req, res) => {
  const short_url = req.params.url;
  Url.findOne({short_url: short_url}, (err, data) => {
    if (!err && res != undefined) {
      res.redirect(data.original_url);
    } else {
      res.json('URL not found');
    }
  });
});
