'use strict';

const ytdl = require('ytdl-core');
const fs = require('fs');
const path = require('path');
const util = require('./util');

function download(videoPage, videoHome) {
    return async function(req, res) {
        let download = req.body.download;
        if (typeof(download) == 'string') {
            download = [download];
        }
        const format = req.body.format;
        const redirectUrl = req.body.redirectUrl;
        const channelId = req.body.channelId;
    
        download.forEach(async videoId => {
            const info = await ytdl.getInfo(videoId);
            const title = info.videoDetails.title;

            let targetFormat;
            if (format == 'mp3') {
                targetFormat = info.formats.find(f => f.itag == 140);
            } else {
                // We can convert the video later if using cinepak
                targetFormat = info.formats.find(f => f.itag == 140);
            }
            const result = ytdl(info.videoDetails.video_url, {format: targetFormat})

            util.initVideoPath(videoHome, channelId, format);
            const filePath = util.getVideoPath(videoHome, channelId, title, format);

            result.on('progress', (a, b, c) => {
                // Update progress in fetched videos
                const progress = (b / c) * 100;
                if (!videoPage.activeDownloads[videoId]) {
                    videoPage.activeDownloads[videoId] = {};
                }
                videoPage.activeDownloads[videoId].progress = parseInt(progress);
                
                // If complete, then add to the info
                if (progress == 100) {
                    const channelInfo = util.getChannelInfo(videoHome, channelId);
                    let vidInfo = channelInfo.videos.find(v => v.id == videoId)
                    if (!vidInfo) {
                        vidInfo = {
                            id: videoId,
                            formats: [format]
                        }
                        channelInfo.videos.push(vidInfo);
                    } else {
                        if (vidInfo.formats.indexOf(format) < 0) {
                            vidInfo.formats.push(format);
                        }
                    }
                    util.writeChannelInfo(videoHome, channelId, channelInfo);
                }
            });

            result.pipe(fs.createWriteStream(filePath));
            
        });
        res.redirect(redirectUrl)
    }
}


module.exports = download;
