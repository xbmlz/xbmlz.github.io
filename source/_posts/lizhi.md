---
title: 南京市民李先生
date: 2022-08-22 10:20:48
tags:
  - Music
categories:
  - Music
excerpt: 南京市民李先生私藏
---

<link rel="stylesheet" href="https://testingcf.jsdelivr.net/npm/aplayer/dist/APlayer.min.css" />
<link rel="stylesheet" href="https://testingcf.jsdelivr.net/npm/driver.js/dist/driver.min.css" />

<script src="https://testingcf.jsdelivr.net/npm/aplayer/dist/APlayer.min.js"></script>
<script src="https://testingcf.jsdelivr.net/gh/nj-lizhi/song@main/audio/list-v2.js"></script>

<script src="https://testingcf.jsdelivr.net/npm/hls.js@0.14.4/dist/hls.min.js"></script>
<script src="https://testingcf.jsdelivr.net/npm/dplayer@1.27.0/dist/DPlayer.min.js"></script>

<script src="https://testingcf.jsdelivr.net/npm/driver.js/dist/driver.min.js"></script>

## 音乐合集

<div id="aplayer"></div>

<script>
// https://api.i-meto.com/meting/api?server=netease&type=playlist&id=3778678
const ap = new APlayer({
    container: document.getElementById('aplayer'),
    autoplay: false,
    listFolded: false,
    audio: list
});
</script>

## 2009-我爱南京跨年演唱会

<div id="dplayer1"></div>
<script>
// https://api.i-meto.com/meting/api?server=netease&type=playlist&id=3778678
const dp1 = new DPlayer({
    container: document.getElementById("dplayer1"),
    video: {
        url: "https://testingcf.jsdelivr.net/gh/nj-lizhi/kn-2009-wanj@main/video/roadmap.js",
        type: "hls",
    },
});
</script>

## 2014-IO 跨年演唱会

<div id="dplayer2"></div>
<script>
// https://api.i-meto.com/meting/api?server=netease&type=playlist&id=3778678
const dp2 = new DPlayer({
    container: document.getElementById("dplayer2"),
    video: {
        url: "https://testingcf.jsdelivr.net/gh/nj-lizhi/kn-2014-io@main/video/roadmap.js",
        type: "hls",
    },
});
</script>

## 2015-看见北京站直播实录

<div id="dplayer3"></div>
<script>
// https://api.i-meto.com/meting/api?server=netease&type=playlist&id=3778678
const dp3 = new DPlayer({
    container: document.getElementById("dplayer3"),
    video: {
        url: "https://testingcf.jsdelivr.net/gh/nj-lizhi/kn-2015-kj@main/video/roadmap.js",
        type: "hls",
    },
});
</script>

## 2018-洗心革面跨年演唱会

<div id="dplayer4"></div>
<script>
// https://api.i-meto.com/meting/api?server=netease&type=playlist&id=3778678
const dp4 = new DPlayer({
    container: document.getElementById("dplayer4"),
    video: {
        url: "https://testingcf.jsdelivr.net/gh/nj-lizhi/kn-2018-xxgm@main/video/roadmap.js",
        type: "hls",
    },
});
</script>