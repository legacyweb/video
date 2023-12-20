'use strict';

const fs = require('fs');
const path = require('path');
const ejs = require('ejs');

const channelTemplate = fs.readFileSync(path.join(__dirname, '..', 'html', 'view.ejs'), 'utf-8');

async function view(req, res) {
    const channelId = req.params.channelId;
    const vidId = req.params.vidId;
    const format = req.params.format;

    const text = await ejs.render(channelTemplate, {
        channelId,
        vidId,
        format
    }, {async: true});

    return text;
}

module.exports = view;
