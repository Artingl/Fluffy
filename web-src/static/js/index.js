if(typeof(String.prototype.trim) === "undefined")
{
    String.prototype.trim = function()
    {
        return String(this).replace(/^\s+|\s+$/g, '');
    };
}

let onReady = function () {
    let userMiniSettings = $(".userMiniSettings")
    let settingsForm = $(".settingsForm")
    let darkenBg = $(".darkenBg")
    let current_chat_content = $(".current-chat-content")
    let fullscreen_alertbox = $(".fullscreen-alertbox")
    let lastChats = {}

    $('*').on('keydown', function(event) {
        if (event.keyCode === 27 && currentEscEvent) {
            currentEscEvent()
        }
    })

    fullscreen_alertbox.hide()
    current_chat_content.hide()
    darkenBg.hide()
    settingsForm.hide()
    userMiniSettings.hide()

    // LOOP
    setInterval(function () {
        let len = $('.message-area').val().trim().length
        $('.message-area-chars').text(len + "/2000")
        if (len > 2000) {
            $('.message-area-chars').css('color', '#ef5350')
        }
        else {
            $('.message-area-chars').css('color', '#9a9a9a')
        }
    }, 1);
    //

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
                    chatsInfo = {}
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

                                chatsInfo[msg] = {'title': title, 'icon': linkToUserIcon}

                                if (selectedChat) {
                                    $('.chat-info-name').val(title)
                                    changeUserIcon(linkToUserIcon, "chat-info-img")
                                    openChat(selectedChat)
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

            $('.chat-info-name').val(chatsInfo[_id]['title'])
            changeUserIcon(chatsInfo[_id]['icon'], "chat-info-img")

            $(".current-chat-empty").fadeOut(250)
            $(".current-chat-content").fadeIn(250)
            $('.current-chat-messages').empty()

            currentChatUsers = {}
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
                        currentChatUsers[user] = JSON.parse(dataStr)['content']
                    }
                })
            }

            for (let msg in content[_id][2]) {
                let msgInt = msg
                msg = content[_id][2][msg]
                let time = timeConverter(parseInt(msg['time']))
                let icon = 'standard.jpg'
                let size = 200
                let msgSize = msg['content'].length

                if (JSON.parse(currentChatUsers[msg['fromUser']][5])['logo']) {
                    icon = JSON.parse(currentChatUsers[msg['fromUser']][5])['logo']
                }

                if (msgSize * 8 > 200) {
                    size = msgSize * 8
                    if (size > 600) {
                        size = 600
                    }
                }

                $('.current-chat-messages').append('<div class="msg-chat msg-chat-n_' + msgInt + '" style="width: ' + size + 'px;">\n' +
                    '<p>' + msg['content'] + '</p>\n' +
                    '<img src="' + api + '/files/' + icon + '">\n' +
                    '<span>' + time + '</span></div>')

                lastChatId = msgInt;
            }

            $("#current-chat-messages").scrollTop($("#current-chat-messages")[0].scrollHeight);
        }
    })

};

let changeChatName = function (ele) {
    if (!selectedChat) return;
    let value = $('.chat-info-name').val().trim()

    if (event.key === 'Enter') {
        $.ajax({
            url: api + '/api/updateDirectMessageInfo/' + '{"key":"' + token + '", "id":"' + selectedChat + '", "data":{"title":"' + value + '"}}',
            type: 'post',
            success: function (dataStr) {
                if (JSON.parse(dataStr)['result'] === 'error') {
                    $('.chat-info-name').val(chatsInfo[selectedChat]['title'])
                }
            },
            error: function (dataStr) {
                $('.chat-info-name').val(chatsInfo[selectedChat]['title'])
            }
        })
        $('.chat-info-name').blur();
    }
    else if (event.key === 'Escape') {
        $('.chat-info-name').val(chatsInfo[selectedChat]['title'])
        $('.chat-info-name').blur();
    }
};

let timeConverter = function (UNIX_timestamp){
    let a = new Date(UNIX_timestamp * 1000)
    let year = a.getFullYear()
    let month = a.getMonth()
    let date = a.getDate()
    let hour = a.getHours()
    let min = a.getMinutes()
    let sec = a.getSeconds()
    return date + '/' + month + '/' + year + ' ' + hour + ':' + min + ':' + sec;
}

let sendMessage = function (ele) {
    if (ele === "send" || event.key === 'Enter') {
        let value = $('.message-area').val().trim()
        if (value.length > 2000) {
            showAlertBox("You cannot type message more then 2000 chars!", "error")
            return
        }

        if (value) {
            $.ajax({
                url: api + "/api/addDirectMessage/" + '{"key":"' + token + '", "message":"' + value + '", "chatId":"' + selectedChat + '", "files":{}}',
                type: "post",
                success: function (dataStr) {
                    ele.value = ""
                    lastChatId++;
                    let time = timeConverter(new Date().getTime() / 1000)
                    let icon = 'standard.jpg'
                    let size = 200
                    let msgSize = value.length
                    if (JSON.parse(me[5])['logo']) {
                        icon = JSON.parse(me[5])['logo']
                    }
                    if (msgSize * 8 > 200) {
                        size = msgSize * 8
                        if (size > 600) {
                            size = 600
                        }
                    }

                    $('.current-chat-messages').append('<div class="msg-chat msg-chat-n_' + lastChatId + '" style="width: ' + size + 'px;">\n' +
                        '<p>' + value + '</p>\n' +
                        '<img src="' + api + '/files/' + icon + '">\n' +
                        '<span>' + time + '</span></div>')
                    $("#current-chat-messages").scrollTop($("#current-chat-messages")[0].scrollHeight);
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

let showAlertBox = function (message, type) {
    if (alertBoxAlreadyShown) {
        return
    }

    let fullscreen_alertbox = $(".fullscreen-alertbox")
    let icon = '<img src="static/img/error64px.png">'

    fullscreen_alertbox.empty()
    fullscreen_alertbox.append(icon)
    fullscreen_alertbox.append('<p>' + message + '</p>')
    fullscreen_alertbox.append('<input onClick="hideAlertBox()" type="button" class="btn btn-primary" style="margin-top: 25px;" value="OK">')

    $('.darkenBg').fadeIn(250)
    fullscreen_alertbox.fadeIn(250, function () {
        alertBoxAlreadyShown = true
        currentEscEvent = hideAlertBox
    })
};

let hideAlertBox = function () {
    $('.darkenBg').fadeOut(250)
    $(".fullscreen-alertbox").fadeOut(250, function () {
        alertBoxAlreadyShown = false
    })
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
