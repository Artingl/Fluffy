let onReady = function () {
    let userMiniSettings = $(".userMiniSettings")
    let settingsForm = $(".settingsForm")
    let darkenBg = $(".darkenBg")
    let current_chat_content = $(".current-chat-content")
    let lastChats = {}

    current_chat_content.hide()
    darkenBg.hide()
    settingsForm.hide()
    userMiniSettings.hide()

    setInterval(function(){
        if (!interval) return;
        $.ajax({
            url: api + "/api/getDirectMessages/" + '{"key":"' + token + '"}',
            type: "post",
            success: function (dataStr) {
                let data = JSON.parse(dataStr)

                if (lastChats !== dataStr) {
                    lastChats = dataStr

                    $('.chats').empty()
                    $('.chats').append('<div style="margin-top: 20px;"></div>')
                    for (const msg in data['content']) {
                        let chatUsers = data['content'][msg][0].split(",")
                        $.ajax({
                            url: api + "/api/getUser/" + '{"id":"' + chatUsers[0] + '"}',
                            type: "post",
                            success: function (newData) {
                                newData = JSON.parse(newData)
                                let lastMsg = ""
                                if (data['content'][msg][2] !== {}) {
                                    lastMsg = data['content'][msg][2][Object.keys(data['content'][msg][2]).length - 1]
                                }

                                let addToMsg = ""
                                let title = newData['content'][1] + " " + newData['content'][2]
                                let linkToUserIcon = JSON.parse(newData['content'][5])['logo']
                                let result = ""

                                if (lastMsg) {
                                    if (lastMsg['fromUser'] == me[6]) {
                                        addToMsg = "You: "
                                    }
                                    result = addToMsg + lastMsg['content']
                                }

                                if (data['content'][msg][1]['title']) {
                                    title = data['content'][msg][1]['title']
                                }

                                addChat(
                                    api + "/files/" + linkToUserIcon,
                                    title,
                                    result,
                                    msg
                                )
                            }
                        });
                    }
                }

                $('.loading').fadeOut(250)
            },
            error: function () {
                $('.loading').fadeIn(250)
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

let openChat = function (_id) {
    $.ajax({
        url: api + "/api/getDirectMessages/" + '{"key":"' + token + '"}',
        type: "post",
        success: function (dataStr) {
            let data = JSON.parse(dataStr)
            let content = data['content']

            if (!content[_id]) return;

            if (selectedChat !== false) {
                $('.chat-element-id_' + selectedChat).css('background', 'transparent');
                $('.chat-element-id_' + selectedChat).mouseover(function() {
                    $(this).css('background', '#f1f1f1')
                }).mouseout(function() {
                    $(this).css('background', 'transparent')
                });
            }
            $('.chat-element-id_' + _id).css('background', '#f1f1f1');
            $('.chat-element-id_' + _id).mouseover(function() { $(this).css('background', '#f1f1f1') }).mouseout(function() { $(this).css('background', '#f1f1f1') });
            selectedChat = _id;

            $(".current-chat-empty").fadeOut(250)
            $(".current-chat-content").fadeIn(250)
            $('.current-chat-messages').empty()

            let users = {}
            let usersIds = (content[_id][0] + me[6] + ',').split(",")
            for (let user in usersIds)
            {
                user = usersIds[user]
                if (!user) continue;

                $.ajax({
                    url: api + "/api/getUser/" + '{"id":"' + user + '"}',
                    type: "post",
                    async: false,
                    success: function (dataStr) {
                        users[user] = JSON.parse(dataStr)['content']
                    }
                })
            }

            for (let msg in content[_id][2]) {
                msg = content[_id][2][msg]
                let time = "4/20/21 13:11:05 PM"
                let icon = 'standard.jpg'
                let size = 200
                let msgSize = msg['content'].length

                if (JSON.parse(users[msg['fromUser']][5])['logo']) {
                    icon = JSON.parse(users[msg['fromUser']][5])['logo']
                }

                if (msgSize * 8 > 200) {
                    size = msgSize * 8
                    if (size > 600) {
                        size = 600
                    }
                }

                $('.current-chat-messages').append('<div class="msg-chat msg-chat-n_' + msg + '" style="width: ' + size + 'px;">\n' +
                    '<p>' + msg['content'] + '</p>\n' +
                    '<img src="' + api + '/files/' + icon + '">\n' +
                    '<span>' + time + '</span></div>')
            }

            $("#current-chat-messages").scrollTop($("#current-chat-messages")[0].scrollHeight);
        }
    })

};

let sendMessage = function (ele) {
    if (event.key === 'Enter') {
        let value = ele.value

        if (value) {
            $.ajax({
                url: api + "/api/addDirectMessage/" + '{"key":"' + token + '", "message":"' + value + '", "chatId":"' + selectedChat + '", "files":{}}',
                type: "post",
                success: function (dataStr) {
                    ele.value = ""
                    openChat(selectedChat)
                }
            })
        }
    }
};

let changeUserIcon = function (path, _id) {
    let userIcon = document.getElementById(_id);
    userIcon.src = api + "/files/" + path
};

let addChat = function (userIcon, name, lastMessage, _id) {
    $('.chats').append('<div onClick="openChat(' + _id + ')" class="chat-element chat-element-id_' + _id + '"><img src="' + userIcon + '"><div class="name">' + name + '</div><div class="msg">' + lastMessage + '</div></div>');
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
