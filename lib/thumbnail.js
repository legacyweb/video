'use strict';

const path = require('path');
const http = require('http');
const fetch = require('node-fetch');

function thumbProxy(req, res, next) {
    const vidImg = req.params.vidId;
    const vidId = path.basename(vidImg, '.jpg');
    const url = `https://i1.ytimg.com/vi/${vidId}/0.jpg`;
    fetch(url).then((actual) => {
        actual.headers.forEach((v, n) => res.setHeader(n, v));
        actual.body.pipe(res);
    });
}

module.exports = thumbProxy;