from json import JSONDecodeError

from flask import Flask, request
import json

app = Flask(__name__)
app.config['SECRET_KEY'] = ''


def getResponse(respDict):
    return json.dumps(respDict)


def getData(data):
    if not data:
        return None

    try:
        data = json.load(data)
    except JSONDecodeError:
        data = None

    return data


@app.route("/api/<string:req>/<string:data>", methods=['POST', 'GET'])
def apiPage(req, data):
    data = getData(data)
    response = {
        'result': 'error',
        'message': 'An unknown error!'
    }

    if request.method == 'POST' and data:
        if req == "register":
            pass
    elif request.method == 'GET':
        response['message'] = 'This server does not support GET requests!'

    return getResponse(response)


if __name__ == '__main__':
    app.run(port=8374, host='127.0.0.1')
