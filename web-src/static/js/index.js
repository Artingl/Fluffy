let token = "";
let me = {};

let onReady = function () {
    let userMiniSettings = $(".userMiniSettings")
    let settingsForm = $(".settingsForm")
    let darkenBg = $(".darkenBg")
    let lastChats = {}

    darkenBg.hide()
    settingsForm.hide()
    userMiniSettings.hide()

    setInterval(function(){
        $.ajax({
            url: api + "/api/getDirectMessages/" + '{"key":"' + token + '"}',
            type: "post",
            success: function (data) {
                data = JSON.parse(data)
                console.log(lastChats !== data)
                console.log(lastChats)

                if (lastChats != data)
                {
                    lastChats = data

                    $('.chats').empty()
                    $('.chats').append('<div style="margin-top: 20px;"></div>')
                    for (const msg in data['content'])
                    {
                        let chatUsers = data['content'][msg][0].split(",")
                        $.ajax({
                            url: api + "/api/getUser/" + '{"id":"' + chatUsers[0] + '"}',
                            type: "post",
                            success: function (newData) {
                                newData = JSON.parse(newData)
                                let lastMsg = data['content'][msg].slice(-1)[0][0]
                                let addToMsg = ""
                                let linkToUserIcon = JSON.parse(newData['content'][5])['logo']

                                if (lastMsg['fromUser'] == me[6]) {
                                    addToMsg = "You: "
                                }

                                addChat(
                                    "https://yetion.ru:4433/files/" + linkToUserIcon,
                                    newData['content'][1] + " " + newData['content'][2],
                                    addToMsg + lastMsg['content']
                                )
                            }
                        });
                    }
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

let addChat = function (userIcon, name, lastMessage) {
    $('.chats').append('<div class="chat-element"><img src="' + userIcon + '"><div class="name">' + name + '</div><div class="msg">' + lastMessage + '</div></div>');
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
