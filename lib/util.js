'use strict'

const fs = require('fs');
const path = require('path');

function initDir(homeDir) {
    if (!fs.existsSync(homeDir)) {
        fs.mkdirSync(homeDir);
    }
}

function genLinks(homeDir, page) {
    fs.readdirSync(homeDir).forEach(channel => {
        const infoFile = path.join(homeDir, channel, 'info.json');
        let channelText = channel;
        if (fs.existsSync(infoFile)) {
            const data = fs.readFileSync(infoFile);
            const jsData = JSON.parse(data);
            channelText = jsData.channelName || channelText;
        }
        page.addLink({
            url: `/channel?id=${channel}`,
            text: channelText
        });
    });
}

function getVideoPath(homeDir, channelId, videoTitle, format) {
    const fname = `${videoTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.m4a`;
    return path.join(homeDir, channelId, format, fname);
}

function initVideoPath(homeDir, channelId, format) {
    fs.mkdirSync(path.join(homeDir, channelId, format), {recursive: true});
}

function getChannelInfo(homeDir, channelId) {
    const channelPath = path.join(homeDir, channelId, 'info.json');
    return JSON.parse(fs.readFileSync(channelPath, 'utf-8'));
}

function writeChannelInfo(homeDir, channelId, data) {
    const channelPath = path.join(homeDir, channelId, 'info.json');
    fs.writeFileSync(channelPath, JSON.stringify(data, null, 2), 'utf-8');
}

module.exports.initDir = initDir;
module.exports.genLinks = genLinks;
module.exports.getVideoPath = getVideoPath;
module.exports.initVideoPath = initVideoPath;
module.exports.getChannelInfo = getChannelInfo;
module.exports.writeChannelInfo = writeChannelInfo;