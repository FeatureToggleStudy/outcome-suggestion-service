var express = require('express');
var app = express();
var path = require('path');
var pdfFiller = require('pdffiller-stream');

app.get('/users/:username/cards/', function (req, res) {
  var first_name = req.query.fname;
  var last_name = req.query.lname;
  var org = req.query.org;
  var user_name = req.param('username');

  var name = first_name + ' ' + last_name;
  name = name.replace(/"/g,"");
  org = org.replace(/"/g,"");
  var url = 'clark.center/' + user_name;
  var sourcePDF = "businesscardformempty.pdf";
  var destinationPDF = user_name + ".pdf";

  console.log(name + '\n' + url + '\n' + org);
  var data = {
    Name2: name,
    Org2: org,
    Org1: org,
    Name3: name,
    Org3: org,
    Name4: name,
    Org4: org,
    Name5: name,
    Org5: org,
    Name6: name,
    Org6: org,
    Name7: name,
    Org7: org,
    Name8: name,
    Org8: org,
    Name9: name,
    Org9: org,
    Name10: name,
    Org10: org,
    Name1: name,
    URL1: url,
    URL2: url,
    URL9: url,
    URL10: url,
    URL3: url,
    URL4: url,
    URL5: url,
    URL6: url,
    URL7: url,
    URL8: url
  };

  pdfFiller.fillForm( sourcePDF, data)
    .toFile('tmp/' + user_name + '.PDF')
    .then(() => {
        console.log('success');
    }).catch((err) => {
        console.log(err);
    });
  res.send(user_name + '.pdf');
});

app.listen(process.env.PORT || 8080);