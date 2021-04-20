import json
import os

import flask
import requests
from flask import Flask, request, render_template, session, send_from_directory
from termcolor import colored

app = Flask(__name__)
app.config['SECRET_KEY'] = '^-i>FKYS5(,dk.*RfA+.g8eaG3bVO4=?W,3Vi+GVGP[]+.+MHSgf.DEQ[B44NYcNaMiC<T8TWL-g`KW63nHnP[' \
                           'Mg`f>n.3-dP9KD/_*d6`m>G<bfdZ6_C7G`O]UAS-*MHK@mIVb/.BF1ST9]QV@aL_ce7DE*Ej`ZL]g?lCUN6QeS' \
                           '-`*4a(b,/V+5<Ij:7/@1[fj6A?Uk):n4(DM8P^)21FEAiG?NRX6ljll1LIENEYDnc(k/kJbe?:d7`jhj[BSD '
apiServer = "https://yetion.ru:4433"


def postRequest(url, return_type='text'):
    try:
        r = requests.post(url)
        if return_type == 'json':
            return r.json()
        if return_type == 'text':
            return r.text

        return r
    except Exception as e:
        print(colored("[ERROR]: " + str(e), 'red'))

        result = {
            'content': '',
            'result': 'error',
            'message': 'An unknown error while connect to the API server!',
            'serverError': True
        }

        return json.dumps(result) if return_type == 'text' else result


def checkSessionKey():
    if checkSessionDict('session_key'):
        sessionKey = session['session_key']
        req = json.dumps({'key': sessionKey})
        checkKey = postRequest(f"{apiServer}/api/checkSessionKey/{req}", "json")
        if checkKey['result'] != 'error':
            return [True, 200]
        elif 'serverError' in checkKey:
            return [False, 500]

    return [False, 200]


def checkSessionDict(name):
    return name in session


def page(name, **settings):
    index = render_template("index.html", **settings)
    pg = render_template(name, **settings)

    return index + pg + '<script>onReady();</script>'


@app.route("/", methods=['GET', 'POST'])
def rootPage():
    if request.method == 'POST':
        return json.dumps({'result': 'error', 'message': "An unknown error!"})
    else:
        checkKey = checkSessionKey()

        if not checkKey[0] and checkKey[1] == 200:
            return flask.redirect("/logout")
        elif checkKey[1] == 500:
            return error_500(500)
        else:
            sessionKey = session['session_key']
            userInfo = session['userInfo']
            me = session['me']
            meDict = {}
            for e, i in enumerate(me):
                meDict[e] = i

            userIcon = 'standard.jpg'
            if 'logo' in userInfo:
                userIcon = userInfo['logo']

            return page("main.html", pageName='main', me=json.dumps(meDict), userInfo=userInfo, userIcon=userIcon, userToken=sessionKey)


@app.route('/favicon.ico')
def favicon():
    return send_from_directory(os.path.join(app.root_path, 'static/img'),
                               'favicon.png', mimetype='image/vnd.microsoft.icon')


@app.route("/login", methods=['POST', 'GET'])
def login():
    if checkSessionKey()[0]:
        return flask.redirect("/")

    if request.method == 'POST':
        req = json.dumps({'email': request.form.get('email'), 'password': request.form.get('password')})
        apiResponse = dict(postRequest(f"{apiServer}/api/login/{req}", "json"))

        if apiResponse['result'] == "error":
            return flask.redirect(f"/login?error_msg={apiResponse['message']}")
        else:
            session['session_key'] = apiResponse["content"][0]
            session['userInfo'] = apiResponse["content"][1]
            session['me'] = apiResponse['content'][2]
            return flask.redirect("/")

    error = request.args.get("error_msg")
    return page("login.html", pageName='Login', msgs=error, disableHeader=True)


@app.route("/register", methods=['POST', 'GET'])
def register():
    if checkSessionKey()[0]:
        return flask.redirect("/")

    if request.method == 'POST':
        if request.form.get('password') != request.form.get('password2'):
            return flask.redirect(f"/register?error_msg=Password mismatch")

        if len(request.form.get('password')) < 8:
            return flask.redirect(f"/register?error_msg=Password must be more then 8 characters")

        req = json.dumps({
            'email': request.form.get('email'),
            'password': request.form.get('password'),
            'name': request.form.get('text-name'),
            'surname': request.form.get('text-surname'),
            'nickname': request.form.get('text-nickname')
        })
        apiResponse = dict(postRequest(f"{apiServer}/api/register/{req}", "json"))

        if apiResponse['result'] == "error":
            return flask.redirect(f"/register?error_msg={apiResponse['message']}")
        else:
            session['session_key'] = apiResponse["content"]
            req = json.dumps({'email': request.form.get('email'), 'password': request.form.get('password')})
            apiResponse = dict(postRequest(f"{apiServer}/api/login/{req}", "json"))

            session['session_key'] = apiResponse["content"][0]
            session['userInfo'] = apiResponse["content"][1]

            return flask.redirect("/")

    error = request.args.get("error_msg")
    return page("register.html", pageName='Register', msgs=error, disableHeader=True)


@app.route("/logout", methods=['POST', 'GET'])
def logout():
    if checkSessionDict('session_key'):
        session.pop('session_key', None)

    return flask.redirect("/login")


@app.errorhandler(500)
def error_500(err):
    return render_template("serverError.html", errorTitle="Server error!",
                           errorMessage="Unknown server error while executing your request. Please, try again later.",
                           errorCode=500)


if __name__ == '__main__':
    app.run(port=443, host='192.168.88.18',
            ssl_context=('C:\\Certbot\\live\\yetion.ru\\fullchain.pem', 'C:\\Certbot\\live\\yetion.ru\\privkey.pem'))
