'use strict';

const ytdl = require('ytdl-core');
const fs = require('fs');
const path = require('path');
const util = require('./util');

let ffmpegBin = null;
if (process.env.FFMPEG_BIN) {
    ffmpegBin = process.env.FFMPEG_BIN;
}

function download(videoPage, videoHome) {
    return async function(req, res) {
        let download = req.body.download;
        if (typeof(download) == 'string') {
            download = [download];
        }
        const format = req.body.format;
        const redirectUrl = req.body.redirectUrl;
        const channelId = req.body.channelId;
        const pageAction = req.body.pageAction;

        if (pageAction == 'Convert') {
            download.forEach(async videoId => {
                // Set preferred source
                // Convert video
                const channelInfo = util.getChannelInfo(videoHome, channelId);
                let vidInfo = channelInfo.videos.find(v => v.id == videoId);
                if (vidInfo && vidInfo.formats.length > 0) {
                    // Get preferred source
                    const info = await ytdl.getInfo(videoId);
                    const title = info.videoDetails.title;
                    const duration = info.videoDetails.lengthSeconds;
                    const sourceFormat = (vidInfo.formats.indexOf('m4v')) ? 'm4v' : vidInfo.formats[0];
                    const sourceFile = util.getVideoPath(videoHome, channelId, title, sourceFormat);
                    const destFile = util.getVideoPath(videoHome, channelId, title, format);
                    
                    const ffmpegProcess = util.openFfmpegConversion(sourceFile, destFile, format, ffmpegBin);
                    ffmpegProcess.stderr.on('data', data => {
                        const line = `${data}`;
                        const time = line.split(' ').find(w => w.indexOf('time=') >= 0);
                        if (time) {
                            let ts = time.split('=')[1];
                            const tsParts = ts.split(/[\:\.]/);
                            let totalMs = 0;
                            totalMs += tsParts[0] * 60 * 60 * 1000; // hours
                            totalMs += tsParts[1] * 60 * 1000; // minutes
                            totalMs += tsParts[2] * 1000; // seconds
                            totalMs += tsParts[3] * 10; // centiseconds
                            
                            // calculate progress
                            const videoLength = duration * 1000;
                            const progress = parseInt((totalMs / videoLength) * 100)
                            if (!videoPage.activeDownloads[videoId]) {
                                videoPage.activeDownloads[videoId] = {};
                            }
                            videoPage.activeDownloads[videoId].progress = parseInt(progress);

                            if (progress == 100) {
                                if (vidInfo.formats.indexOf(format) < 0) {
                                    vidInfo.formats.push(format);
                                }
                                util.writeChannelInfo(videoHome, channelId, channelInfo);
                            }
                        }
                    });
                    ffmpegProcess.on('close', code => {
                        if (code != 0) {
                            console.error(`ffmpeg closed with code=${code}`);
                        }
                    });
                }
            });

        } else {
            download.forEach(async videoId => {
                const info = await ytdl.getInfo(videoId);
                const title = info.videoDetails.title;
    
                let targetFormat;
                if (format == 'mp3') {
                    targetFormat = info.formats.find(f => f.itag == 140);
                    
                } else {
                    targetFormat = info.formats.find(f => 
                        f.mimeType.indexOf('video/mp4') >= 0 &&
                        f.hasAudio
                    );
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
                                title,
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
    
                if (format == 'm4v') {
                    result.pipe(fs.createWriteStream(filePath));
                } else {
                    const ffmpeg = util.openFfmpegStream(filePath, format, ffmpegBin);
                    ffmpeg.stdin.setEncoding('binary')
                    ffmpeg.stdout.on('data', data => {
                        if (process.env.DEBUG) {
                            console.debug(`${data}`);
                        }
                    });
                    ffmpeg.stderr.on('data', data => {
                        if (process.env.DEBUG) {
                            console.debug(`${data}`);
                        }
                    });
                    ffmpeg.on('close', code => {
                        if (code != 0) {
                            console.error(`ffmpeg closed with code=${code}`);
                        }
                    });
                    result.pipe(ffmpeg.stdin);
                }            
                
            });
        }
        res.redirect(redirectUrl)
    }
}


module.exports = download;
