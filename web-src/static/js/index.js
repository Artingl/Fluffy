let token = "";

let onReady = function () {
    let userMiniSettings = $(".userMiniSettings")
    let settingsForm = $(".settingsForm")
    let darkenBg = $(".darkenBg")

    darkenBg.hide()
    settingsForm.hide()
    userMiniSettings.hide()

    setInterval(function(){
        $.ajax({
            url: api + "/api/getDirectMessages/" + '{"key":"' + token + '"}',
            type: "post",
            success: function (data) {
                data = JSON.parse(data)
                for (const msg in data['content'])
                {
                    console.log(data['content'][msg])
                }
            }
        });
    }, 1000);

    $(document).click(function(event) {
        let $target = $(event.target);
        if(!$target.closest('.header').length && userMiniSettings.is(":visible")) {
          userMiniSettings.fadeOut(250)
        }
    });

    $('.user-icon').click(function(){
        if(userMiniSettings.is(":visible")) {
            userMiniSettings.fadeOut(250)
        }
        else {
            userMiniSettings.fadeIn(250)
        }
    });
};

let changeHeaderUserIcon = function (path) {
    let userIcon = document.getElementById("userIcon");
    userIcon.src = api + "/files/" + path
};

let settings = function () {
    let settingsForm = $(".settingsForm")
    let darkenBg = $(".darkenBg")

    if(settingsForm.is(":visible")) {
        settingsForm.fadeOut(250)
        darkenBg.fadeOut(250)
    }
    else {
        settingsForm.fadeIn(250)
        darkenBg.fadeIn(250)
    }

    darkenBg.attr("onclick","settings()");
};

let logout = function () {
    window.location.href = '/logout'
};
