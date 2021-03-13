from flask import Flask, request
import db
import user_functions
from include import *

app = Flask(__name__)
app.config['SECRET_KEY'] = ''


@app.route("/api/<string:req>/<string:data>", methods=['POST', 'GET'])
def apiPage(req, data):
    data = getData(data)
    response = {
        'result': 'error',
        'message': 'An unknown error!',
        'content': ''
    }

    if request.method == 'POST' and data:
        if req == "register":
            response = user_functions.registerUser(data)
        elif req == "login":
            response = user_functions.loginUser(data, request.remote_addr)
        elif req == "checkSessionKey":
            k = user_functions.checkSessionKey(data['key'], request.remote_addr)
            if k:
                response['result'] = 'successful'
                response['message'] = ''
            else:
                response['message'] = 'Invalid key'
            response['content'] = k
        elif req == "getFriendsList":
            response = user_functions.getFriendsList(data['key'], request.remote_addr)
        elif req == "addFriend":
            response = user_functions.addFriend(data['id'], data['key'], request.remote_addr)
        else:
            response['message'] = f'Api method {req} does not exists!'
    elif request.method == 'GET':
        response['message'] = 'This server does not support GET requests!'

    return getResponse(response)


if __name__ == '__main__':
    db.global_init('data/root.db')
    app.run(port=8374, host='127.0.0.1')
