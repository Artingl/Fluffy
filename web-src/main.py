from flask import Flask

app = Flask(__name__)
app.config['SECRET_KEY'] = ''


def main():
    app.run()


@app.route("/")
def rootPage():
    pass


if __name__ == '__main__':
    main()
