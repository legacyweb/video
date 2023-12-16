'use strict';

const ytch = require('yt-channel-info');
const path = require('path');
const fs = require('fs');
const ejs = require('ejs');

let httpAgent = null;
if (process.env.HTTP_PROXY) {
    const {HttpsProxyAgent} = require('https-proxy-agent');
    const proxy = process.env.HTTP_PROXY;
    httpAgent = new HttpsProxyAgent(proxy);
}

const channelTemplate = fs.readFileSync(path.join(__dirname, '..', 'html', 'channel.ejs'), 'utf-8');

function channelPage(videoPage, videoHome) {

    let fetchedVideos = {};
    let continuations = {};
    const perPage = 30;

    return async function(req, res) {
        const channelId = req.query.id;
        let begin = parseInt(req.query.begin) || 0;
        //const continuation = req.query.continuation;
        const infoFile = path.join(videoHome, channelId, 'info.json');
        const data = JSON.parse(fs.readFileSync(infoFile, 'utf-8'));

        if (!fetchedVideos[channelId]) {
            fetchedVideos[channelId] = [];
        }

        let addedLast = 0;
        while (fetchedVideos[channelId].slice(begin).length < (begin + perPage)) {
            let continuation = continuations[channelId];
            // Time to fetch more videos
            let videos;
            if (continuation) {
                const payload = {
                    httpAgent,
                    continuation
                }
                videos = await ytch.getChannelVideosMore(payload);
            } else {
                const payload = {
                    httpAgent,
                    channelId,
                    sortBy: 'newest',
                    channelIdType: 0
                }
                videos = await ytch.getChannelVideos(payload);
            }
            continuations[channelId] = videos.continuation;
            videos.items.forEach(video => {
                // add to fetched
                if (!fetchedVideos[channelId].find(v => v.videoId == video.videoId)) {
                    fetchedVideos[channelId].push(video);
                    addedLast += 1;
                }
            });
            if (addedLast == 0) {
                break;
            } else {
                addedLast = 0;
            }
        }

        // Fetch videos for this page
        const currentVideos = fetchedVideos[channelId].slice(begin, begin+perPage);
        currentVideos.forEach(video => {
            const target = data.videos.find(v => v.id == video.videoId);
            if (target) {
                video.formats = target.formats
            }
            if (videoPage.activeDownloads[video.videoId]) {
                video.progress = videoPage.activeDownloads[video.videoId].progress;
            }
        })

        const text = await ejs.render(channelTemplate, {
            channelName: data.channelName,
            channelId,
            videos: currentVideos,
            begin,
            perPage
        }, {async: true});

        return text;
    };
}

module.exports = channelPage;
