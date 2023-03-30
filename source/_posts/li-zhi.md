---
title: 南京市民李先生
date: 2022-08-22 10:20:48
tags:
- music
categories:
- music
- 李志
excerpt: 南京市民李先生私藏
---
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/aplayer/dist/APlayer.min.css">
<div id="aplayer"></div>
<script src="https://cdn.jsdelivr.net/npm/aplayer/dist/APlayer.min.js"></script>
<script src="https://cdn.jsdelivr.net/gh/nj-lizhi/song@main/audio/list-v2.js"></script>
<script>
// https://api.i-meto.com/meting/api?server=netease&type=playlist&id=3778678
const ap = new APlayer({
    container: document.getElementById('aplayer'),
    autoplay: false,
    listFolded: false,
    audio: list
});
</script>
