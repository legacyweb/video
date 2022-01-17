'use strict';
const fs = require('fs');
const path = require('path');

const homeText = fs.readFileSync(path.join(__dirname, '..', 'html', 'home.html'))

function home(req, res) {
    return homeText
}

module.exports = home;