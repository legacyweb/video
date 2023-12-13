'use strict';

const home = require('./lib/home');
const addChannel = require('./lib/addChannel');
const channelPage = require('./lib/channel');
const thumbnail = require('./lib/thumbnail');
const download = require('./lib/download');
const util = require('./lib/util');
const LegacyPage = require('legacyweb-pages');
const fs = require('fs');
const path = require('path');
const joi = require('joi');
const express = require('express');
const bodyParser = require('body-parser');

// Get home directory for videos
const homeDir = process.env.HOME || process.env.HOMEPATH;
const schema = joi.object({
    VIDEO_ROOT: joi.string().default(path.join(homeDir, '.legacyvid'))
});

if (process.env.HTTP_PROXY) {
    process.env.GLOBAL_AGENT_HTTP_PROXY=process.env.HTTP_PROXY;
    const {bootstrap} = require('global-agent');
    bootstrap();
}

const envVars = joi.attempt(process.env, schema, {allowUnknown: true, stripUnknown: true});
util.initDir(envVars.VIDEO_ROOT);

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

util.genLinks(envVars.VIDEO_ROOT, videoPage);

// Active downloads object
videoPage.activeDownloads = {};

videoPage.addPage({
   path: '/addChannel',
   gen: addChannel(envVars.VIDEO_ROOT, videoPage),
   title: 'Add Channel',
   method: 'post',
   middleware: [express.json(), express.urlencoded()]
});

videoPage.addPage({
    path: '/channel',
    gen: channelPage(videoPage, envVars.VIDEO_ROOT),
    title: 'Channel Videos',
    method: 'get',
    middleware: [express.json(), express.urlencoded()]
});

// Add thumbnail proxy
videoPage.app.get('/thumbnails/:vidId', thumbnail);

// Add download function
videoPage.app.post('/download', express.json(), express.urlencoded(), download(videoPage, envVars.VIDEO_ROOT));

videoPage.setHeader(headerText);
videoPage.start();


