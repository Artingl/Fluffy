import json
from json import JSONDecodeError


def getResponse(respDict):
    return json.dumps(respDict)


def getData(data):
    if not data:
        return None

    try:
        data = json.loads(data)
    except JSONDecodeError:
        data = None

    return data
