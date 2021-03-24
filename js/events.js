// These functions just simply play or pause the player
// Created for event listeners

//-----------------------------------------------------------------------------

function playOther(roomnum) {
    socket.emit('play other', {
        room: roomnum,
        id: document.getElementById("inputVideoId").value
    });
}

socket.on('justPlay', function(data) {
    if (media.paused) {
        media.play();
    }
});

function pauseOther(roomnum) {
    socket.emit('pause other', {
        room: roomnum
    });
}

socket.on('justPause', function(data) {
    media.pause()
    player.pauseVideo()
});

function seekOther(roomnum, currTime) {
    socket.emit('seek other', {
        room: roomnum,
        time: currTime
    });
}

// Weird for YouTube because there is no built in seek event
// It seeks on an buffer event
// Only syncs if off by over .2 seconds
socket.on('justSeek', function(data) {
    currTime = data.time
    var clientTime = media.currentTime
    if (clientTime < currTime - .2 || clientTime > currTime + .2) {
        media.currentTime = currTime
    }
});
