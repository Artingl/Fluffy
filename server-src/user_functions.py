import hashlib
import json
import random
import string
import time

import db
from werkzeug.security import generate_password_hash, check_password_hash
from directMessages import directMessages
from include import dictToJson, jsonToDict
from users import *


def updateDirectMessageInfo(data, chatId, key, ip):
    result = {'result': 'successful', 'message': 'Direct message info was updated successfully!', 'content': ''}
    db_sess = db.create_session()
    user = checkSessionKey(key, ip)

    if not user:
        result['result'] = 'error'
        result['message'] = 'Invalid session key!'
        return result

    dm = db_sess.query(directMessages).filter(directMessages.id == chatId,
                                              directMessages.users.like(f"%{user.id},%")).first()
    if not dm:
        result['result'] = 'error'
        result['message'] = 'Chat does not exist!'
        return result

    content = json.loads(dm.info)
    for key, val in data.items():
        content[key] = val
    dm.info = dictToJson(content)
    db_sess.add(dm)
    db_sess.commit()

    return result



def createDirectMessage(users, key, ip):
    result = {'result': 'successful', 'message': 'Chat has created successfully', 'content': ''}
    db_sess = db.create_session()
    user = checkSessionKey(key, ip)
    usersStr = users
    users = users.split(",")

    if not user:
        result['result'] = 'error'
        result['message'] = 'Invalid session key!'
        return result

    if str(user.id) not in users:
        result['result'] = 'error'
        result['message'] = 'An unknown error'
        return result

    # lastChatId = db_sess.query(directMessages).all()[-1].id + 1

    dm = directMessages()
    dm.users = usersStr
    dm.content = '{}'
    db_sess = db.create_session()
    db_sess.add(dm)
    db_sess.commit()

    return result


def addDirectMessage(files, message, chatId, key, ip):
    result = {'result': 'successful', 'message': 'Message has added successfully', 'content': ''}
    content = {}
    db_sess = db.create_session()
    user = checkSessionKey(key, ip)

    if not user:
        result['result'] = 'error'
        result['message'] = 'Invalid session key!'
        return result

    dm = db_sess.query(directMessages).filter(directMessages.id == chatId,
                                              directMessages.users.like(f"%{user.id},%")).first()
    if not dm:
        result['result'] = 'error'
        result['message'] = 'Chat does not exist!'
        return result

    content = jsonToDict(dm.content)
    if len(list(content.keys())) == 0:
        messageId = 0
    else:
        messageId = int(list(content.keys())[-1]) + 1

    content[str(messageId)] = {
        "content": message, "fromUser": str(user.id), "time": str(int(time.time())), "files": jsonToDict(files)
    }

    dm.content = dictToJson(content)
    db_sess.add(dm)
    db_sess.commit()

    return result


def getDirectMessages(key, ip):
    result = {'result': 'successful', 'message': '', 'content': ''}
    content = {}
    db_sess = db.create_session()
    user = checkSessionKey(key, ip)

    if not user:
        result['result'] = 'error'
        result['message'] = 'Invalid session key!'
        return result

    dms = db_sess.query(directMessages).filter(directMessages.users.like(f"%{user.id},%")).all()
    for dm in dms:
        content[dm.id] = [dm.users.replace(f"{user.id},", ""), jsonToDict(dm.info), jsonToDict(dm.content)]

    result['content'] = content
    return result


def getUser(id):
    result = {'result': 'successful', 'message': '', 'content': ''}
    db_sess = db.create_session()
    user = db_sess.query(User).filter(User.id == id).first()

    if user is None:
        result['result'] = 'error'
        result['message'] = 'User does not exist'
        return result

    result['content'] = [
        user.nickname,
        user.name,
        user.surname,
        user.email,
        user.friends,
        user.anotherInfo,
        user.id
    ]

    return result


def addFriend(id, key, ip):
    result = {'result': 'successful', 'message': 'Friend has added successfully!', 'content': ''}
    db_sess = db.create_session()
    user = checkSessionKey(key, ip)
    secondUser = db_sess.query(User).filter(User.id == id).first()

    if not user:
        result['result'] = 'error'
        result['message'] = 'Invalid session key!'
        return result

    if user is None:
        result['result'] = 'error'
        result['message'] = 'User does not exist'
        return result

    if id in getFriendsList(key, ip)['content']:
        result['result'] = 'error'
        result['message'] = 'This user has already added!'
        return result

    if not secondUser:
        result['result'] = 'error'
        result['message'] = 'User does not exist!'
        return result

    if user.friends:
        user.friends += "," + id
    else:
        user.friends = id

    db_sess.add(user)
    db_sess.commit()

    return result


def getFriendsList(key, ip):
    result = {'result': 'successful', 'message': '', 'content': ''}
    user = checkSessionKey(key, ip)

    if not user:
        result['result'] = 'error'
        result['message'] = 'Invalid session key!'
        return result

    if user is None:
        result['result'] = 'error'
        result['message'] = 'User does not exist'
        return result
    if user.friends is None:
        result['message'] = "You don't have any friends yet!"
    else:
        result['content'] = user.friends.split(',')

    return result


def checkSessionKey(key, ip):
    db_sess = db.create_session()
    ip = hashlib.md5(ip.encode()).hexdigest()

    user = db_sess.query(User).filter(User.session_key == key).first()
    key_ip = key.split("_")[0].strip()

    if user is None or ip != key_ip:
        return False

    return user


def genSessionKey(ip):
    key = ''
    while True:
        key = ''.join(random.choice(string.ascii_uppercase + string.digits) for _ in range(48))
        key = f"{hashlib.md5(ip.encode()).hexdigest()}_{key}"

        db_sess = db.create_session()
        user = db_sess.query(User).filter(User.session_key == key).first()
        if user is None:
            break

    return key


def loginUser(info, ip):
    result = {'result': 'successful', 'message': 'Login was successful', 'content': ''}

    if 'email' not in info or 'password' not in info:
        result['result'] = 'error'
        result['message'] = 'Not enough arguments!'
        return result

    db_sess = db.create_session()
    user = db_sess.query(User).filter(User.email == info['email']).first()

    if user is None:
        result['result'] = 'error'
        result['message'] = 'User does not exist or invalid password!'
        return result

    if not check_password_hash(user.password, info['password']):
        result['result'] = 'error'
        result['message'] = 'User does not exist or invalid password!'
        return result

    session_key = genSessionKey(ip)
    result['content'] = [
        session_key,
        user.anotherInfo,
        [
            user.nickname,
            user.name,
            user.surname,
            user.email,
            user.friends,
            user.anotherInfo,
            user.id
        ]
    ]
    user.session_key = session_key

    db_sess.add(user)
    db_sess.commit()

    return result


def registerUser(info):
    result = {'result': 'successful', 'message': 'User has successfully registered!', 'content': ''}

    if 'email' not in info or 'password' not in info or 'nickname' not in info \
            or 'name' not in info or 'surname' not in info and (info['email'] == "" or
                                                                info['password'] == "" or info['nickname'] == ""
                                                                or info['name'] == "" or info['surname'] == ""):
        result['result'] = 'error'
        result['message'] = 'Not enough arguments!'
        return result

    db_sess = db.create_session()
    checkUser = db_sess.query(User).filter(User.email == info['email']).first()
    if checkUser is not None:
        result['result'] = 'error'
        result['message'] = 'User with the same email already exists!'
        return result

    user = User()
    user.name = info['name']
    user.password = generate_password_hash(info['password'])
    user.email = info['email']
    user.nickname = info['nickname']
    user.surname = info['surname']
    db_sess = db.create_session()
    db_sess.add(user)
    db_sess.commit()

    return result
