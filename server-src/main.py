import os
import random
import string

from flask import Flask, request, send_from_directory
from werkzeug.utils import secure_filename

import db
import user_functions
from termcolor import colored
from include import *
from flask_cors import CORS


app = Flask(__name__)
CORS(app)
app.config['SECRET_KEY'] = ''
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024


def genFileName(ext):
    name = ''
    while True:
        name = ''.join(random.choice(string.ascii_uppercase + string.digits) for _ in range(48)) + ext
        if not os.path.isfile('data/images/' + name):
            break
    return name


@app.route('/fileUpload/changeChatIcon/<string:data>', methods=['GET', 'POST'])
def filesUpls(data):
    data = jsonToDict(data)
    response = {
        'result': 'error',
        'message': 'An unknown error!'
    }
    try:
        file = request.files['file']
        filename = secure_filename(file.filename)
        name = genFileName("." + filename.split(".")[-1])
        file.save(os.path.join(app.root_path, 'data/images/' + name))
        response = user_functions.changeImageDirectMessage(name, data['id'], data['token'], request.remote_addr)
    except Exception as e:
        print(colored(f'[ERROR]: {e}', 'red'))

    return dictToJson(response)


@app.route("/files/<string:path>")
def userIcons(path):
    folderPath = os.path.join(app.root_path, 'data/images')
    if not os.path.isfile(folderPath + "/" + path):
        path = "standard.jpg"

    return send_from_directory(folderPath, path, mimetype='image/vnd.microsoft.icon')


@app.route("/api/<string:req>/<string:data>", methods=['POST', 'GET'])
def apiPage(req, data):
    data = jsonToDict(data)
    response = {
        'result': 'error',
        'message': 'An unknown error!',
        'content': ''
    }

    try:
        if request.method == 'POST' and data:
            if req == "register":
                response = user_functions.registerUser(data)
            elif req == "login":
                response = user_functions.loginUser(data, request.remote_addr)
            elif req == "checkSessionKey":
                k = user_functions.checkSessionKey(data['key'], request.remote_addr)
                if k:
                    k = True
                    response['result'] = 'successful'
                    response['message'] = ''
                else:
                    response['message'] = 'Invalid key'
                response['content'] = k
            elif req == "getFriendsList":
                response = user_functions.getFriendsList(data['key'], request.remote_addr)
            elif req == "addFriend":
                response = user_functions.addFriend(data['id'], data['key'], request.remote_addr)
            elif req == "getUser":
                response = user_functions.getUser(data['id'])
            elif req == "getDirectMessages":
                response = user_functions.getDirectMessages(data['key'], request.remote_addr)
            elif req == "addDirectMessage":
                response = user_functions.addDirectMessage(data['files'], data['message'], data['chatId'],
                                                           data['key'], request.remote_addr)
            elif req == "createDirectMessage":
                response = user_functions.createDirectMessage(data['users'], data['key'], request.remote_addr)
            elif req == "updateDirectMessageInfo":
                response = user_functions.updateDirectMessageInfo(data['data'], data['id'], data['key'], request.remote_addr)
            else:
                response['message'] = f'Api method {req} does not exists!'
        elif request.method == 'GET':
            response['message'] = 'This server does not support GET requests!'
    except Exception as e:
        print(colored(f'[ERROR]: {e}', 'red'))

    return dictToJson(response)


@app.errorhandler(404)
def error_404(page):
    return dictToJson({
        'result': 'error',
        'message': 'This page does not exist!',
        'content': ''
    })


@app.errorhandler(500)
def error_500(page):
    return dictToJson({
        'result': 'error',
        'message': 'Server error! Please, try again later.',
        'content': ''
    })


if __name__ == '__main__':
    db.global_init('data/root.db')
    app.run(port=4433, host='192.168.88.18',
            ssl_context=('C:\\Certbot\\live\\yetion.ru\\fullchain.pem', 'C:\\Certbot\\live\\yetion.ru\\privkey.pem'))
