import json
from json import JSONDecodeError


def dictToJson(respDict):
    return json.dumps(respDict)


def jsonToDict(data):
    if not data:
        return None

    try:
        data = json.loads(data)
    except JSONDecodeError:
        data = None

    return data
