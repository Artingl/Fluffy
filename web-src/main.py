import json

import flask
import requests
from flask import Flask, request, render_template, session

app = Flask(__name__)
app.config['SECRET_KEY'] = '^-i>FKYS5(,dk.*RfA+.g8eaG3bVO4=?W,3Vi+GVGP[]+.+MHSgf.DEQ[B44NYcNaMiC<T8TWL-g`KW63nHnP[' \
                           'Mg`f>n.3-dP9KD/_*d6`m>G<bfdZ6_C7G`O]UAS-*MHK@mIVb/.BF1ST9]QV@aL_ce7DE*Ej`ZL]g?lCUN6QeS' \
                           '-`*4a(b,/V+5<Ij:7/@1[fj6A?Uk):n4(DM8P^)21FEAiG?NRX6ljll1LIENEYDnc(k/kJbe?:d7`jhj[BSD '
apiServer = "http://127.0.0.1:8374"


def renderPage(fileName, **settings):
    result = render_template("index.html", **settings)
    result += render_template(fileName, **settings)

    return result


def postRequest(url, return_type='text'):
    r = requests.post(url)
    if return_type == 'json':
        return r.json()
    if return_type == 'text':
        return r.text

    return r


def checkSessionKey():
    if checkSessionDict('session_key'):
        sessionKey = session['session_key']
        req = json.dumps({'key': sessionKey})
        checkKey = postRequest(f"{apiServer}/api/checkSessionKey/{req}", "json")
        if checkKey['message'] != 'Invalid key':
            return True

    return False


def checkSessionDict(name):
    return name in session


def registerPage():
    return renderPage("register.html", pageName='Register')


def loginPage():
    return renderPage("login.html", pageName='Login')


@app.route("/", methods=['GET', 'POST'])
def rootPage():
    if request.method == 'POST':
        return json.dumps({'result': 'error', 'message': "An unknown error!"})
    else:
        if not checkSessionDict('session_key'):
            return flask.redirect("/login")
        else:
            sessionKey = session['session_key']
            if not checkSessionKey():
                return flask.redirect("/logout")
            print(postRequest(apiServer + "/api/createDirectMessage/" + '{"users":"1,2,10", "key":"' + sessionKey + '"}', 'json'))

            return renderPage("main.html", pageName='main')


@app.route("/login", methods=['POST', 'GET'])
def login():
    if checkSessionKey():
        return flask.redirect("/")

    if request.method == 'POST':
        req = json.dumps({'email': request.form.get('email'), 'password': request.form.get('password')})
        apiResponse = dict(postRequest(f"{apiServer}/api/login/{req}", "json"))
        session['session_key'] = apiResponse["content"]

        if apiResponse['result'] == "error":
            return flask.redirect(f"/login?error_msg={apiResponse['message']}")
        else:
            return flask.redirect("/")

    error = request.args.get("error_msg")
    if error:
        error = f'''<div class="alert alert-danger" role="alert">
                      {error}
                    </div>'''
    else:
        error = ""

    return error + loginPage()


@app.route("/register", methods=['POST', 'GET'])
def register():
    if checkSessionKey():
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
        session['session_key'] = apiResponse["content"]

        if apiResponse['result'] == "error":
            return flask.redirect(f"/register?error_msg={apiResponse['message']}")
        else:
            req = json.dumps({'email': request.form.get('email'), 'password': request.form.get('password')})
            apiResponse = dict(postRequest(f"{apiServer}/api/login/{req}", "json"))
            session['session_key'] = apiResponse["content"]

            return flask.redirect("/")

    error = request.args.get("error_msg")
    if error:
        error = f'''<div class="alert alert-danger" role="alert">
                          {error}
                        </div>'''
    else:
        error = ""

    return error + registerPage()


@app.route("/logout", methods=['POST', 'GET'])
def logout():
    if checkSessionDict('session_key'):
        session.pop('session_key', None)

    return flask.redirect("/login")


if __name__ == '__main__':
    app.run(port=80, host='127.0.0.1')
