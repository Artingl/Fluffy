import hashlib
import uuid


def getHash(string):
    salt = uuid.uuid4().hex
    hashed_password = hashlib.sha512(string + salt).hexdigest()

    return hashed_password
