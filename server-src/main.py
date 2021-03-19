from flask import Flask, request
import db
import user_functions
from include import *

app = Flask(__name__)
app.config['SECRET_KEY'] = ''


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
            elif req == "getDirectMessages":
                response = user_functions.getDirectMessages(data['key'], request.remote_addr)
            elif req == "addDirectMessage":
                response = user_functions.addDirectMessage(data['message'], data['chatId'],
                                                           data['key'], request.remote_addr)
            else:
                response['message'] = f'Api method {req} does not exists!'
        elif request.method == 'GET':
            response['message'] = 'This server does not support GET requests!'
    except Exception as e:
        print(e)

    return dictToJson(response)


@app.errorhandler(404)
def notFound(page):
    return dictToJson({
        'result': 'error',
        'message': 'This page does not exist!',
        'content': ''
    })


if __name__ == '__main__':
    db.global_init('data/root.db')
    app.run(port=8374, host='127.0.0.1')
