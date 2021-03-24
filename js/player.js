// Gets all the player data
socket.on('getPlayerData', function(data) {
    var roomnum = data.room
    var caller = data.caller

    var currTime = media.currentTime
    var state = media.paused
    socket.emit('get host data', {
        room: roomnum,
        currTime: currTime,
        state: state,
        caller: caller
    });
});

// Create HTML5 Player
socket.on('createPlayer', function(data) {
    var html5 = document.getElementById('PlayerArea');
    html5.style.display = 'block';

    // document.getElementById('html5-input').style.display = 'block'
    document.getElementById('inputVideoId').placeholder = 'Direct mp4/webm URL'
    // document.getElementById('html5-message').style.display = 'block'
});
