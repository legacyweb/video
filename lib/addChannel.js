'use strict';

const util = require('./util');

const fs = require('fs');
const path = require('path');

function addChannel(homeDir, videoPage) {
    return async function(req, res) {
        // Grab channel info
        const channelId = req.body.channelId;
        const channelName = req.body.channelName;
        
        // initialize channel directory
        const channelDir = path.join(homeDir, channelId);
        if (!fs.existsSync(channelDir)) {
            fs.mkdirSync(channelDir);
            // TODO: initialize the channel info file
            const data = {
                channelId,
                channelName,
                videos: []
            }
            fs.writeFileSync(path.join(channelDir, 'info.json'), JSON.stringify(data, null, 2), 'utf-8');
        }

        // Add appropriate links
        videoPage.addLink({
            url: `/channel?id=${channelId}`,
            text: channelName
        })

        return "<b>Channel added successfully. Please refresh the page.<b>";
    }
}

module.exports = addChannel;