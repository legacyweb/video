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

module.exports.initDir = initDir;
module.exports.genLinks = genLinks;