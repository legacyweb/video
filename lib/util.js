'use strict'

const fs = require('fs');
const path = require('path');
const spawn = require('child_process').spawn;

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
    let extension = format;
    if (format == 'cinepak') {
        extension = 'mov';
    }
    const fname = `${videoTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.${extension}`;
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

function openFfmpegStream(filename, format, binary) {
    const ffmpeg = binary || 'ffmpeg';
    let args = ['-i', '-', '-y'];
    if (format == 'cinepak') {
        // Add cinepak options
        const vproc="pp=ac,pp=ac,pp=ac,hqdn3d=5,eq=contrast=256/220:brightness=1/512:saturation=256/224:gamma=16/16,scale=320:-4:sws_flags=spline+accurate_rnd+full_chroma_int+full_chroma_inp:sws_dither=2:in_range=0:out_range=2,minterpolate=fps=15:mi_mode=mci:me_mode=bidir:me=ntss:vsbmc=1,xbr=2,format=pix_fmts=rgb24"
        const aproc="pan=mono|FC<1.414FC+FR+FL+0.5BL+0.5SL+0.25LFE+0.125BR,aresample=resampler=swr:osr=22050:cutoff=0.990:dither_method=shibata";
        args.unshift(...['-hide_banner', '-v', '32', '-stats']);
        args.push('-vf');
        args.push(vproc);
        args.push('-c:v');
        args.push('cinepak');
        args.push('-q:v');
        args.push('30');
        args.push('-af');
        args.push(aproc);
        args.push('-c:a');
        args.push('adpcm_ima_qt');
        args.push('-s');
        args.push('320x240');
        args.push('-f');
        args.push('mov');
    } else {
        args.push('-f')
        args.push(format);
    }
    args.push(filename);
    const ffmpegProcess = spawn(ffmpeg, args);
    return ffmpegProcess;
}

module.exports.initDir = initDir;
module.exports.genLinks = genLinks;
module.exports.getVideoPath = getVideoPath;
module.exports.initVideoPath = initVideoPath;
module.exports.getChannelInfo = getChannelInfo;
module.exports.writeChannelInfo = writeChannelInfo;
module.exports.openFfmpegStream = openFfmpegStream;