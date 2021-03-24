// Change Host (1)
socket.on('changeHostNotify', function(data) {
    console.log("Host Change Notify Alert")
    var user = data.user

    $.notify({
        title: '<strong>Host Changed: </strong>',
        icon: 'fas fa-users',
        message: user + " is now the host."
    }, {
        type: 'info',
        delay: 800,
        animate: {
            enter: 'animated fadeInUp',
            exit: 'animated fadeOutRight'
        },
        placement: {
            from: "bottom",
            align: "right"
        },
        offset: 20,
        spacing: 10,
        z_index: 1031,
    });
})

//------------------------------------------------------------------------------
// Not part of the server function
//------------------------------------------------------------------------------

// Made into its own function to reduce spam
// When pressing sync button
function syncAlert() {
    // Sync notify
    $.notify({
        title: '<strong>Sync: </strong>',
        icon: 'fas fa-users',
        message: " The room is now synced with you"
    }, {
        type: 'success',
        delay: 400,
        animate: {
            enter: 'animated fadeInUp',
            exit: 'animated fadeOutRight'
        },
        placement: {
            from: "bottom",
            align: "right"
        },
        offset: 20,
        spacing: 10,
        z_index: 1031,
    })
}

// When user gets out of sync from the host
function disconnectedAlert() {
    $.notify({
        title: '<strong>Warning: </strong>',
        icon: 'fas fa-users',
        message: " You are now out of sync of the host"
    }, {
        type: 'danger',
        delay: 400,
        animate: {
            enter: 'animated fadeInUp',
            exit: 'animated fadeOutRight'
        },
        placement: {
            from: "bottom",
            align: "right"
        },
        offset: 20,
        spacing: 10,
        z_index: 1031,
    })
}

// When user enters a url, but the url is invalid
function invalidURL() {
    $.notify({
        title: '<strong>Error: </strong>',
        icon: 'fas fa-id-card',
        message: "Entered invalid video url"
    }, {
        type: 'danger',
        delay: 400,
        animate: {
            enter: 'animated fadeInUp',
            exit: 'animated fadeOutRight'
        },
        placement: {
            from: "bottom",
            align: "right"
        },
        offset: 20,
        spacing: 10,
        z_index: 1031,
    })
}
