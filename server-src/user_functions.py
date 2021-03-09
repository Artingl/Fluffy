import hashlib
import random
import string
import db
from users import *


def addFriend(id, key, ip):
    result = {'result': 'successful', 'message': 'Friend has successfully added!', 'content': ''}
    db_sess = db.create_session()
    user = db_sess.query(User).filter(User.session_key == key).first()
    secondUser = db_sess.query(User).filter(User.id == id).first()

    if not checkSessionKey(key, ip):
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
    db_sess = db.create_session()
    user = db_sess.query(User).filter(User.session_key == key).first()

    if not checkSessionKey(key, ip):
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

    return True


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
        result['message'] = 'User does not exist'
        return result

    if user.password != info['password']:
        result['result'] = 'error'
        result['message'] = 'Invalid password'
        return result

    session_key = genSessionKey(ip)
    result['content'] = session_key
    user.session_key = session_key

    db_sess.add(user)
    db_sess.commit()

    return result


def registerUser(info):
    result = {'result': 'successful', 'message': 'User has successfully registered!', 'content': ''}

    if 'email' not in info or 'password' not in info or 'nickname' not in info \
            or 'name' not in info or 'surname' not in info:
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
    user.password = info['password']
    user.email = info['email']
    db_sess = db.create_session()
    db_sess.add(user)
    db_sess.commit()

    return result
