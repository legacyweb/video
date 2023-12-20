'use strict';

const path = require('path');
const http = require('http');
const fetch = require('node-fetch');
const util = require('./util');
const fs = require('fs');

function video(videoHome, videoPage) {
    return function(req, res, next) {
        const vidId = req.query.vidId;
        const channelId = req.query.channelId;
        const format = req.query.format;
        const channelInfo = util.getChannelInfo(videoHome, channelId);
        const vidInfo = channelInfo.videos.find(v => v.id == vidId);
        const vidPath = util.getVideoPath(videoHome, channelId, vidInfo.title, format);
        const fStream = fs.createReadStream(vidPath);
        let mimeType;
        if (format == 'mp3') {
            mimeType = 'audio/mpeg';
        } else if (format == 'cinepak') {
            mimeType = 'video/mov';
        } else {
            mimeType = 'video/mp4';
        }
        res.setHeader('Content-Type', mimeType);
        fStream.pipe(res);
    }
}

module.exports = video;
