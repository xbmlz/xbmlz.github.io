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

<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Ablum</th>
            <th>Play</th>
        </tr>
    </thead>
    <tbody id="music-list">
    </tbody>
</table>
</table>
<script src="https://cdn.jsdelivr.net/npm/jquery/dist/jquery.min.js"></script>
<script>
    $.get('https://cdn.jsdelivr.net/gh/nj-lizhi/song/audio/download.txt', function(data, status) {
        let musicList = data.trim().split('\n')
        let musicInfo, musicName, musicAlbum, musicUrl
        for (i in musicList) {
            musicInfo = musicList[i].split('/')
            musicName = musicInfo[8].replace('.mp3', '')
            musicAlbum = musicInfo[7]
            musicUrl = musicList[i]
            $('#music-list').append(`
                <tr>
                    <td>${musicName}</td>
                    <td>${musicAlbum}</td>
                    <td>
                        <audio src="${musicUrl}" preload="none" style="height: 35px" controls loop>
                            你的浏览器不支持 audio 标签。
                        </audio>
                    </td>
                </tr>
            `)
        }
    })
</script>