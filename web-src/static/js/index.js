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
    let context_menu = $('.context-menu')
    let lastChats = {}

    $('*').on('keydown', function(event) {
        if (event.keyCode === 27 && currentEscEvent) {
            currentEscEvent()
        }
    })

    context_menu.hide()
    fullscreen_alertbox.hide()
    current_chat_content.hide()
    darkenBg.hide()
    settingsForm.hide()
    userMiniSettings.hide()

    $(document).bind("mousedown", function (e) {
        if (!$(e.target).parents('.context-menu').length > 0 && e.which !== 3) {
            $('.context-menu').fadeOut(100);
        }
    });

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
                let keys = data['content'][0]
                data['content'] = data['content'][1]

                if (lastChats !== dataStr) {
                    lastChats = dataStr

                    $('.chats').empty()
                    $('.chats').append('<div style="margin-top: 20px;"></div>')
                    chatsInfo = {}
                    keys.split(",").forEach( function( msg ) {
                        if (msg && data['content'][msg])
                        {
                            let chatUsers = data['content'][msg][0].split(",")
                            let lastMsg = data['content'][msg][1]['last_msg']

                            $.ajax({
                                url: api + "/api/getUser/" + '{"id":"' + chatUsers[0] + '"}',
                                type: "post",
                                success: function (newData) {
                                    newData = JSON.parse(newData)
                                    let addToMsg = ""
                                    let title = newData['content'][1] + " " + newData['content'][2]
                                    let linkToUserIcon = JSON.parse(newData['content'][5])['logo']
                                    let result = ""

                                    if (data['content'][msg][1]['logo']) {
                                        linkToUserIcon = data['content'][msg][1]['logo']
                                    }

                                    if (lastMsg) {
                                        if (lastMsg['fromUser'] == me[6]) {
                                            addToMsg = "You: "
                                        }
                                        result = addToMsg + lastMsg['content']
                                        if (data['content'][msg][1]['state'].endsWith('typing...')) {
                                            result = data['content'][msg][1]['state']
                                        }
                                    }

                                    if (data['content'][msg][1]['title']) {
                                        title = data['content'][msg][1]['title']
                                    }

                                    chatsInfo[msg] = {'title': title, 'icon': linkToUserIcon, 'last_msg': lastMsg}

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

                                    if (result.endsWith('typing...')) {
                                        $('.chat-element_msg-id_' + msg).css('color', 'rgb(243 172 43)')
                                    }
                                    else {
                                        $('.chat-element_msg-id_' + msg).css('color', '#404040')
                                    }
                                }
                            });
                        }
                    })
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
            let keys = data['content'][0]
            data['content'] = data['content'][1]
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
                let tag = ''
                let msgSize = msg['content'].length

                if (msg['edited']) {
                     time = time + " (edited)"
                }

                if (!msg['stuff']) {
                    if (JSON.parse(currentChatUsers[msg['fromUser']][5])['logo']) {
                        icon = JSON.parse(currentChatUsers[msg['fromUser']][5])['logo']
                    }
                }
                else {
                    icon = 'yetion_logo.png'
                    tag = 'background-color: #c2dfff;'
                }

                if (msgSize * 8 > 200) {
                    size = msgSize * 8
                    if (size > 600) {
                        size = 600
                    }
                }

                $('.current-chat-messages').append('<div class="msg-chat msg-chat-n_' + msgInt + '" style="width: ' + size + 'px;' + tag + '">\n' +
                    '<p class="msg-chat-content-n_' + msgInt + '">' + msg['content'] + '</p>\n' +
                    '<img src="' + api + '/files/' + icon + '">\n' +
                    '<span class="msg-chat-info-n_' + msgInt + '">' + time + '</span></div>')

                $('.msg-chat-n_' + msgInt).bind("contextmenu", function (event) {
                    event.preventDefault(); // TODO: delete/edit messages, messages reply, settings, uploading files/images, etc.

                    $('.context-menu').empty()
                    $('.context-menu').append('<div style="margin-top: 5px;"></div>')
                    $('.context-menu').append('<button onclick="" type="button" class="blueButton button btn-context">Reply</button>')

                    if (parseInt(msg['fromUser']) === parseInt(me[6])) {
                        $('.context-menu').append('<button onclick="showDialogChangeMessage(' + msgInt + ', ' + selectedChat + ')" type="button" class="blueButton button btn-context">Edit message</button>')
                        $('.context-menu').append('<button onclick="deleteDialogMessage(' + msgInt + ', ' + selectedChat + ')" type="button" class="redButton button btn-context">Delete message</button>')
                    }

                    $('.context-menu').append('<div style="margin-top: 10px;"></div>')
                    if (!$('.context-menu').is(":visible")) {
                        $('.context-menu').fadeIn(100)
                    }
                    $(".context-menu").css('top', event.pageY + "px")
                    $(".context-menu").css('left', event.pageX + "px")
                });

                lastChatId = msgInt;
            }

            $("#current-chat-messages").scrollTop($("#current-chat-messages")[0].scrollHeight);
        }
    })

};

let deleteMessage = function (msgId, chatId) {
    $.ajax({
        url: api + "/api/deleteDirectMessage/" + '{"key":"' + token + '", "id":"' + chatId + '", "message_id":"' + msgId + '"}',
        type: "post",
        success: function (dataStr) {
            let data = JSON.parse(dataStr)
            if (data['result'] === 'successful') {
                $('.msg-chat-n_' + msgId).remove()
                if (currentEscEvent) {
                    currentEscEvent()
                }
            }
        }
    })
};

let editMessage = function (msgId, chatId) {
    let value = $('.edit-dialog-area').val().trim()
    if (value.length > 2000) {
        return
    }
    if ($('.msg-chat-content-n_' + msgId).text() === value) {
        if (currentEscEvent) {
            currentEscEvent()
        }
        return;
    }

    $.ajax({
        url: api + "/api/editDirectMessage/" + '{"key":"' + token + '", "id":"' + chatId + '", "message_id":"' + msgId + '", "message":"' + value + '"}',
        type: "post",
        success: function (dataStr) {
            let data = JSON.parse(dataStr)
            if (data['result'] === 'successful') {
                $('.msg-chat-content-n_' + msgId).text(value)
                $('.msg-chat-info-n_' + msgId).text($('.msg-chat-info-n_' + msgId).text() + " (edited)")
                if (currentEscEvent) {
                    currentEscEvent()
                }
            }
        }
    })
};

let showDialogChangeMessage = function (msgId, chatId) {
    if (alertBoxAlreadyShown) {
        return
    }

    let fullscreen_alertbox = $(".fullscreen-alertbox")
    let oldMsg = $('.msg-chat-content-n_' + msgId).text()

    fullscreen_alertbox.empty()
    fullscreen_alertbox.append('<span>Enter new message</span>')
    fullscreen_alertbox.append('<input onkeydown="sendMessage(this)" type="text" class="form-control edit-dialog-area" name="password" placeholder="Type a message" value="' + oldMsg +'">')
    fullscreen_alertbox.append('<button onclick="editMessage(' + msgId + ', ' + chatId + ')" class="btn btn-primary" style="position: relative;top: 100px;" >Change</button>')

    $('.context-menu').fadeOut(100);
    $('.darkenBg').fadeIn(250)
    fullscreen_alertbox.fadeIn(250, function () {
        alertBoxAlreadyShown = true
        currentEscEvent = hideAlertBox
    })
};

let deleteDialogMessage = function (msgId, chatId) {
    if (alertBoxAlreadyShown) {
        return
    }

    let fullscreen_alertbox = $(".fullscreen-alertbox")
    let icon = '<img src="static/img/info64px.png">'

    fullscreen_alertbox.empty()
    fullscreen_alertbox.append(icon)
    fullscreen_alertbox.append('<p>Do you really want to delete this message?</p>')
    fullscreen_alertbox.append('<button onclick="deleteMessage(' + msgId + ', ' + chatId + ')" class="btn btn-primary" style="margin-top: 12px;border-color: #ef5350;background-color: #ef5350;" >Delete</button>')
    fullscreen_alertbox.append('<button onclick="hideAlertBox()" class="btn btn-primary" style="margin-top: 12px;margin-left: 50px;" >Close</button>')

    $('.context-menu').fadeOut(100);
    $('.darkenBg').fadeIn(250)
    fullscreen_alertbox.fadeIn(250, function () {
        alertBoxAlreadyShown = true
        currentEscEvent = hideAlertBox
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
        $.ajax({
            url: api + '/api/updateDirectMessageInfo/' + '{"key":"' + token + '", "id":"' + selectedChat + '", "data":{"state":""}}',
            type: 'post'
        })

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

                    $('.current-chat-messages').append('<div class="msg-chat msg-chat-n_' + lastChatId + '" style="width: ' + size + 'px; background-color: #dedede;">\n' +
                        '<p>' + value + '</p>\n' +
                        '<img src="' + api + '/files/' + icon + '">\n' +
                        '<span>' + time + '</span></div>')
                    $("#current-chat-messages").scrollTop($("#current-chat-messages")[0].scrollHeight);
                }
            })
        }
    }
    else {
        let name = me[0].slice(0, 9)
        name = name.charAt(0).toUpperCase() + name.slice(1);
        if (me[0].length > 9) {
            name += '.'
        }

        if (!typingStatus) {
            //$.ajax({
            //    url: api + '/api/updateDirectMessageInfo/' + '{"key":"' + token + '", "id":"' + selectedChat + '", "data":{"state":"' + name + ' typing..."}}',
            //    type: 'post',
            //    success: function (dataStr) {
            //        typingStatus = true
            //    }
            //})
        }
    }
};

let changeUserIcon = function (path, _id) {
    let userIcon = document.getElementById(_id);
    userIcon.src = api + "/files/" + path
};

let addChat = function (userIcon, name, lastMessage, _id) {
    $('.chats').append('<div onClick="openChat(' + _id + ')" class="chat-element chat-element-id_' + _id + '"><img src="' + userIcon + '"><div class="name chat-element_name-id_' + _id + '">' + name + '</div><div class="msg chat-element_msg-id_' + _id + '">' + lastMessage + '</div></div>');
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
    fullscreen_alertbox.append('<button onclick="hideAlertBox()" class="btn btn-primary" style="margin-top: 12px;" >OK</button>')

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

let uploadChatImage = async function (inp) {
    let formData = new FormData();
    formData.append("file", inp.files[0]);
    await fetch(api + '/fileUpload/changeChatIcon/' + '{"token":"' + token + '", "id":"' + selectedChat + '"}', {method: "POST", body: formData});
}

let settings = function () {
    let settingsForm = $(".settingsForm")
    let darkenBg = $(".darkenBg")

    if(settingsForm.is(":visible")) {
        settingsForm.fadeOut(250, function () {
            currentEscEvent = false
        })
        darkenBg.fadeOut(250)
    }
    else {
        settingsForm.fadeIn(250, function () {
            currentEscEvent = settings
        })
        darkenBg.fadeIn(250)
    }

    darkenBg.attr("onclick","settings()");
};

let logout = function () {
    window.location.href = '/logout'
};
