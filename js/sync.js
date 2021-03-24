// Calls the play video function on the server
function playVideo(roomnum) {
    socket.emit('play video', {
        room: roomnum
    });
}

// Calls the sync function on the server
function syncVideo(roomnum) {
    var currTime = 0
    var state
    var videoId = id

    currTime = media.currentTime;
    state = media.paused;
    socket.emit('sync video', {
        room: roomnum,
        time: currTime,
        state: state,
        videoId: videoId
    });
}

// This return the current time
function getTime() {
    return media.currentTime;
}

function seekTo(time) {
    player.seekTo(time)
    player.playVideo()
}

function changeVideoParse(roomnum) {
  var videoId = document.getElementById("inputVideoId").value
  changeVideo(roomnum, videoId)
}

// Change playVideo
function changeVideo(roomnum, videoId) {
    if (videoId != "invalid") {
        var time = getTime()
        // Actually change the video!
        socket.emit('change video', {
            room: roomnum,
            videoId: videoId,
            time: time
        });
    } else {
        console.log("User entered an invalid video url :(")
        invalidURL()
    }
    //player.loadVideoById(videoId);
}

// Does this even work?
function changeVideoId(roomnum, id) {
    //var videoId = 'sjk7DiH0JhQ';
    document.getElementById("inputVideoId").innerHTML = id;
    socket.emit('change video', {
        room: roomnum,
        videoId: id
    });
    //player.loadVideoById(videoId);
}

// Change to previous video
function prevVideo(roomnum) {
    // This gets the previous video
    socket.emit('change previous video', {
        room: roomnum
    }, function(data) {
        // Actually change the video!
        var prevTime = data.time
        var time = getTime()
        socket.emit('change video', {
            room: roomnum,
            videoId: data.videoId,
            time: time,
            prev: true
        }, function(data) {
            // Set to the previous time
            setTimeout(function() {
                seekTo(prevTime)
            }, 1200);
        });
    });
}

// This just calls the sync host function in the server
socket.on('getData', function(data) {
    socket.emit('sync host', {});
});

function changePlayer(roomnum, playerId) {
    if (playerId != currPlayer) {
        socket.emit('change player', {
            room: roomnum,
            playerId: playerId
        });
    }
}

// Change a single player
function changeSinglePlayer(playerId) {
    return new Promise((resolve, reject) => {
        if (playerId != currPlayer) {
            socket.emit('change single player', {
                playerId: playerId
            });
        }
        resolve("socket entered change single player function")
    })
}

//------------------------------//
// Client Synchronization Stuff //
//------------------------------//

var roomnum = 1
var id = "M7lc1UVf-VE"

// Calls the play/pause function
socket.on('playVideoClient', function(data) {
    // Calls the proper play function for the player
    html5Play()
});

socket.on('pauseVideoClient', function(data) {
    media.pause()
});

// Syncs the video client
socket.on('syncVideoClient', function(data) {
    var currTime = data.time
    var state = data.state
    var videoId = data.videoId
    var playerId = data.playerId

    // This switchs you to the correct player
    // Should only happen when a new socket joins late

    // This syncs the time and state
    media.currentTime = currTime

    // Sync player state if parent player was paused
    if (state) {
        media.pause()
    } else {
        media.play()
    }
});

// Change video
socket.on('changeVideoClient', function(data) {
    var videoId = data.videoId;

    // This is getting the video id from the server
    // The original change video call updates the value for the room
    // This probably is more inefficient than just passing in the parameter but is safer?
    socket.emit('get video', function(id) {
        console.log("it really is " + id)
        videoId = id
        // This changes the video
        id = videoId
        htmlLoadVideo(videoId)
    })

    // Auto sync with host after 1000ms of changing video
    setTimeout(function() {
        socket.emit('sync host', {});
    }, 1000);

});

// Change time
socket.on('changeTime', function(data) {
    var time = data.time
    player.seekTo(time);
});
