require('dotenv').config();

const express = require('express');
const app = express();
const GilaMarkdown = require("./src/gilamarkdown/index")
const server = require('http').createServer(app);
const io = require('socket.io')(server, {
    cors: {
        origin: '*',
    }
});;
users = [];
connections = [];
rooms = [];
// Store all of the sockets and their respective room numbers
userrooms = {}

// Set given room for url parameter
var given_room = ""

app.use(express.static(__dirname + '/'));

server.listen(process.env.PORT || 3000);
console.log("Server Started...'");

rooms_ig = new Object();
// console.log(new GilaMarkdown("*hello*").init())

app.get('/:room', function (req, res) {
    given_room = req.params.room
    res.sendFile(__dirname + '/index.html');
});


var roomno = 1;

io.sockets.on('connection', function (socket) {
    // Connect Socket
    connections.push(socket);
    console.log("Connected: %s sockets connected", connections.length);

    // Set default room, if provided in url
    socket.emit('set id', {
        id: given_room
    })

    socket.join("room-" + roomno);

    // Reset URL parameter
    // Workaround because middleware was not working right
    socket.on('reset url', function (data) {
        given_room = ""
    });

    // Disconnect
    socket.on('disconnect', function (data) {

        // If socket username is found
        if (users.indexOf(socket.username) != -1) {
            users.splice((users.indexOf(socket.username)), 1);
            updateUsernames();
        }

        connections.splice(connections.indexOf(socket), 1);

        // HOST DISCONNECT
        // Need to check if current socket is the host of the roomnum
        // If it is the host, needs to auto assign to another socket in the room

        // Grabs room from userrooms data structure
        var id = socket.id
        var roomnum = userrooms[id]
        var room = rooms_ig['room-' + roomnum]

        // If you are not the last socket to leave
        if (room !== undefined) {
            // If you are the host
            try {
                if (socket.id == room.host) {
                    // Reassign
                    io.to(room.sockets[1].id).emit('autoHost', {
                        roomnum: roomnum
                    })
                    rooms_ig['room-' + socket.roomnum].hostName = room.sockets[1].username
                    io.sockets.in("room-" + roomnum).emit('changeHostLabel', {
                        username: room.sockets[1].username
                    })
                }
            } catch (e) {}

            // Remove from users list
            // If socket username is found
            if (room.users.indexOf(socket.username) != -1) {
                room.users.splice((room.users.indexOf(socket.username)), 1);
                updateRoomUsers(roomnum);
            }
        }

        // Delete socket from userrooms
        delete userrooms[id]

    });

    // ------------------------------------------------------------------------
    // New room
    socket.on('new room', function (data, callback) {
        //callback(true);
        // Roomnum passed through
        socket.roomnum = data;

        // This stores the room data for all sockets
        userrooms[socket.id] = data

        var host = null
        var init = false

        // Sets default room value to 1
        if (socket.roomnum == null || socket.roomnum == "") {
            socket.roomnum = '1'
            userrooms[socket.id] = '1'
        }

        // Adds the room to a global array
        if (!rooms.includes(socket.roomnum)) {
            rooms.push(socket.roomnum);
        }

        // Checks if the room exists or not
        if (rooms_ig['room-' + socket.roomnum] === undefined) {
            socket.send(socket.id)
            // Sets the first socket to join as the host
            host = socket.id
            init = true

            // Set the host on the client side
            socket.emit('setHost');
        } else {
            host = rooms_ig['room-' + socket.roomnum].host
        }

        // Actually join the room
        socket.join("room-" + socket.roomnum);

        // Sets the default values when first initializing
        if (init) {
            // Sets the host
            rooms_ig['room-' + socket.roomnum] = new Object();
            rooms_ig['room-' + socket.roomnum].sockets = new Array();
            rooms_ig['room-' + socket.roomnum].host = host
            // Default Player
            rooms_ig['room-' + socket.roomnum].currPlayer = 0
            // Default video
            rooms_ig['room-' + socket.roomnum].currVideo = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4'
            // Previous Video
            rooms_ig['room-' + socket.roomnum].prevVideo = {
                id: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
                time: 0
            }
            // Host username
            rooms_ig['room-' + socket.roomnum].hostName = socket.username
            // Keep list of online users
            rooms_ig['room-' + socket.roomnum].users = [socket.username]
            // Set an empty queue
            rooms_ig['room-' + socket.roomnum].queue = []
        }
        rooms_ig['room-' + socket.roomnum].sockets.push(socket);

        // Set Host label
        io.sockets.in("room-" + socket.roomnum).emit('changeHostLabel', {
            username: rooms_ig['room-' + socket.roomnum].hostName
        })

        // Set Queue
        updateQueueVideos()

        // Gets current video from room variable
        var currVideo = rooms_ig['room-' + socket.roomnum].currVideo

        io.sockets.in("room-" + socket.roomnum).emit('createPlayer', {});

        // Change the video to the current one
        socket.emit('changeVideoClient', {
            videoId: currVideo
        });

        // Get time from host which calls change time for that socket
        if (socket.id != host) {
            // Set a timeout so the video can load before it syncs
            setTimeout(function () {
                socket.broadcast.to(host).emit('getData');
            }, 1000);

            // Push to users in the room
            rooms_ig['room-' + socket.roomnum].users.push(socket.username)
        } else {
            console.log("I am the host")
        }

        // Update online users
        updateRoomUsers(socket.roomnum)
    });
    // ------------------------------------------------------------------------



    // ------------------------------------------------------------------------
    // ------------------------- Socket Functions -----------------------------
    // ------------------------------------------------------------------------

    // Play video
    socket.on('play video', function (data) {
        var roomnum = data.room
        if (!!data.id && rooms_ig['room-' + socket.roomnum].currVideo != data.id) {
            io.sockets.in('room-' + roomnum).emit('changeVideoClient', {
                videoId: data.id
            });
            rooms_ig['room-' + socket.roomnum].currVideo = data.id;
            ///https://gilamonster.herokuapp.com/yvy7mt5hk6r
        }
        io.sockets.in('room-' + roomnum).emit('playVideoClient');
    });

    // Event Listener Functions
    // Broadcast so host doesn't continuously call it on itself!
    socket.on('play other', function (data) {
        var roomnum = data.room
        socket.broadcast.to("room-" + roomnum).emit('justPlay');
    });

    socket.on('pause other', function (data) {
        var roomnum = data.room
        socket.broadcast.to("room-" + roomnum).emit('justPause');
    });

    socket.on('seek other', function (data) {
        var roomnum = data.room
        var currTime = data.time
        socket.broadcast.to("room-" + roomnum).emit('justSeek', {
            time: currTime
        });
    });

    socket.on('play next', function (data, callback) {
        var videoId = "QUEUE IS EMPTY"
        if (rooms_ig['room-' + socket.roomnum] !== undefined) {
            if (rooms_ig['room-' + socket.roomnum].queue.length > 0) {
                videoId = rooms_ig['room-' + socket.roomnum].queue.shift().videoId
            }
            // Remove video from the front end
            updateQueueVideos()
            callback({
                videoId: videoId
            })
        }
    });

    // Sync video
    socket.on('sync video', function (data) {
        if (rooms_ig['room-' + socket.roomnum] !== undefined) {
            var roomnum = data.room
            var currTime = data.time
            var state = data.state
            var videoId = data.videoId
            var playerId = rooms_ig['room-' + roomnum].currPlayer
            // var videoId = rooms_ig['room-'+roomnum].currVideo
            io.sockets.in("room-" + roomnum).emit('syncVideoClient', {
                time: currTime,
                state: state,
                videoId: videoId,
                playerId: playerId
            })
        }
    });

    // Enqueue video
    // Gets title then calls back
    socket.on('enqueue video', function (data) {
        if (rooms_ig['room-' + socket.roomnum] !== undefined) {
            test = false
            var user = data.user
            var videoId = data.videoId
            var title = ""
            rooms_ig['room-' + socket.roomnum].queue.push({
                videoId: videoId,
                title: title
            })
        }
    })

    // Empty the queue
    socket.on('empty queue', function (data) {
        if (rooms_ig['room-' + socket.roomnum] !== undefined) {
            rooms_ig['room-' + socket.roomnum].queue = []
            updateQueueVideos()
        }
    })

    // Remove a specific video from queue
    socket.on('remove at', function (data) {
        if (rooms_ig['room-' + socket.roomnum] !== undefined) {
            var idx = data.idx
            rooms_ig['room-' + socket.roomnum].queue.splice(idx, 1)
            updateQueueVideos()
        }
    })

    // Play a specific video from queue
    socket.on('play at', function (data, callback) {
        if (rooms_ig['room-' + socket.roomnum] !== undefined) {
            var idx = data.idx
            var videoId = ""
            rooms_ig['room-' + socket.roomnum].queue.splice(idx, 1)
            updateQueueVideos()
            callback({
                videoId: videoId
            })
        }
    })

    // Change video
    socket.on('change video', function (data, callback) {
        if (rooms_ig['room-' + socket.roomnum] !== undefined) {
            var roomnum = data.room
            var videoId = data.videoId
            var time = data.time
            var host = rooms_ig['room-' + socket.roomnum].host

            // This changes the room variable to the video id
            rooms_ig['room-' + socket.roomnum].prevVideo.id = rooms_ig['room-' + socket.roomnum].currVideo
            rooms_ig['room-' + socket.roomnum].prevVideo.time = time
            // Set new video id
            rooms_ig['room-' + socket.roomnum].currVideo = videoId

            io.sockets.in("room-" + roomnum).emit('changeVideoClient', {
                videoId: videoId
            });

            // If called from previous video, do a callback to seek to the right time
            if (data.prev) {
                // Call back to return the video id
                callback()
            }

        }
    });

    // Change to previous video
    socket.on('change previous video', function (data, callback) {
        if (rooms_ig['room-' + socket.roomnum] !== undefined) {
            var roomnum = data.room
            var host = rooms_ig['room-' + socket.roomnum].host

            // This sets the videoId to the proper previous video
            var videoId = rooms_ig['room-' + socket.roomnum].prevVideo.id
            var time = rooms_ig['room-' + socket.roomnum].prevVideo.time

            // Callback to go back to client to request the video change
            callback({
                videoId: videoId,
                time: time
            })
        }
    })

    // Get video id based on player
    socket.on('get video', function (callback) {
        if (rooms_ig['room-' + socket.roomnum] !== undefined) {
            // Gets current video from room variable
            var currVideo = rooms_ig['room-' + socket.roomnum].currVideo
            // Call back to return the video id
            callback(currVideo)
        }
    })

    // Change video player
    socket.on('change player', function (data) {
        if (rooms_ig['room-' + socket.roomnum] !== undefined) {
            var roomnum = data.room
            var playerId = data.playerId

            io.sockets.in("room-" + roomnum).emit('pauseVideoClient');
            io.sockets.in("room-" + roomnum).emit('createPlayer', {});

            // This changes the room variable to the player id
            rooms_ig['room-' + roomnum].currPlayer = playerId

            // This syncs the host whenever the player changes
            host = rooms_ig['room-' + socket.roomnum].host
            socket.broadcast.to(host).emit('getData')
        }

    })

    // Change video player
    socket.on('change single player', function (data) {
        if (rooms_ig['room-' + socket.roomnum] !== undefined) {
            var playerId = data.playerId

            socket.emit('createPlayer', {});
            // After changing the player, resync with the host
            host = rooms_ig['room-' + socket.roomnum].host
            socket.broadcast.to(host).emit('getData')
        }
    })


    // Send Message in chat
    socket.on('send message', function (data) {
        var encodedMsg = new GilaMarkdown(data.replace(/</g, "&lt;").replace(/>/g, "&gt;")).init()
        io.sockets.in("room-" + socket.roomnum).emit('new message', {
            msg: encodedMsg,
            user: socket.username
        });
    });

    // New User
    socket.on('new user', function (data, callback) {
        callback(true);
        // Data is username
        var encodedUser = data.replace(/</g, "&lt;").replace(/>/g, "&gt;");
        socket.username = encodedUser;
        users.push(socket.username);
        updateUsernames();
    });

    // Changes time for a specific socket
    socket.on('change time', function (data) {
        var caller = data.id
        var time = data.time
        socket.broadcast.to(caller).emit('changeTime', {
            time: time
        });
    });

    // This just calls the syncHost function
    socket.on('sync host', function (data) {
        if (rooms_ig['room-' + socket.roomnum] !== undefined) {
            //socket.broadcast.to(host).emit('syncVideoClient', { time: time, state: state, videoId: videoId });
            var host = rooms_ig['room-' + socket.roomnum].host
            // If not host, recall it on host
            if (socket.id != host) {
                socket.broadcast.to(host).emit('getData')
            } else {
                socket.emit('syncHost')
            }
        }
    })

    // Emits the player status
    socket.on('player status', function (data) {
    });

    // Change host
    socket.on('change host', function (data) {
        if (rooms_ig['room-' + socket.roomnum] !== undefined) {
            var roomnum = data.room
            var newHost = socket.id
            var currHost = rooms_ig['room-' + socket.roomnum].host

            // If socket is already the host!
            if (newHost != currHost) {
                // Broadcast to current host and set false
                socket.broadcast.to(currHost).emit('unSetHost')
                // Reset host
                rooms_ig['room-' + socket.roomnum].host = newHost
                // Broadcast to new host and set true
                socket.emit('setHost')

                rooms_ig['room-' + socket.roomnum].hostName = socket.username
                // Update host label in all sockets
                io.sockets.in("room-" + roomnum).emit('changeHostLabel', {
                    username: socket.username
                })
                // Notify alert
                socket.emit('notify alerts', {
                    alert: 1,
                    user: socket.username
                })
            }
        }
    })

    // Get host data
    socket.on('get host data', function (data) {
        if (rooms_ig['room-' + socket.roomnum] !== undefined) {
            var roomnum = data.room
            var host = rooms_ig['room-' + roomnum].host

            // Broadcast to current host and set false
            // Call back not supported when broadcasting

            // Checks if it has the data, if not get the data and recursively call again
            if (data.currTime === undefined) {
                // Saves the original caller so the host can send back the data
                var caller = socket.id
                socket.broadcast.to(host).emit('getPlayerData', {
                    room: roomnum,
                    caller: caller
                })
            } else {
                var caller = data.caller
                // Call necessary function on the original caller
                socket.broadcast.to(caller).emit('compareHost', data);
            }
        }

    })

    // Calls notify functions
    socket.on('notify alerts', function (data) {
        var alert = data.alert
        var encodedUser = ""
        if (data.user) {
            encodedUser = data.user.replace(/</g, "&lt;").replace(/>/g, "&gt;")
        }

        switch (alert) {
            // Host Change Alert
            case 1:
                io.sockets.in("room-" + socket.roomnum).emit('changeHostNotify', {
                    user: encodedUser
                })
                break;
            default:
                console.error("Invalid alert ID")
        }
    })

    //------------------------------------------------------------------------------
    // Async get current time
    socket.on('auto sync', function (data) {
        var async = require("async");
        var http = require("http");

        //Delay of 5 seconds
        var delay = 5000;
        async.forever(function (next) {
            socket.emit('syncHost');

            // Repeat after the delay
            setTimeout(function () {
                next();
            }, delay);
        },  function (err) {
            console.error(err);
        });
    });


    // Some update functions --------------------------------------------------
    // Update all users
    function updateUsernames() {
        return
    }

    // Update the room usernames
    function updateRoomUsers(roomnum) {
        if (rooms_ig['room-' + socket.roomnum] !== undefined) {
            var roomUsers = rooms_ig['room-' + socket.roomnum].users
            io.sockets.in("room-" + roomnum).emit('get users', roomUsers)
        }
    }

    // Update the playlist/queue
    function updateQueueVideos() {
        if (rooms_ig['room-' + socket.roomnum] !== undefined) {
            var vidlist = rooms_ig['room-' + socket.roomnum].queue
            var currPlayer = rooms_ig['room-' + socket.roomnum].currPlayer
            io.sockets.in("room-" + socket.roomnum).emit('get vidlist', {
                vidlist: vidlist,
                currPlayer: currPlayer,
            })
        }
    }

})
