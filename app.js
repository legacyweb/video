'use strict';

const home = require('./lib/home');
const LegacyPage = require('legacyweb-pages');
const fs = require('fs');
const path = require('path');

const headerText = fs.readFileSync(path.join(__dirname, 'html', 'header.html'));

const videoPage = new LegacyPage(
    'leftpane',
    'business',
    'LegacyWeb Video',
    {
        path: '/',
        gen: home
    },
    true,
    [{webPath: '/images', filePath: path.join(__dirname, 'images')}]
);

videoPage.setHeader(headerText);
videoPage.start();


