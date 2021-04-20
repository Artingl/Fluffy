import datetime
import sqlalchemy
import db


class User(db.SqlAlchemyBase):
    __tablename__ = 'users'

    id = sqlalchemy.Column(sqlalchemy.Integer, primary_key=True, autoincrement=True)
    nickname = sqlalchemy.Column(sqlalchemy.String, nullable=True)
    name = sqlalchemy.Column(sqlalchemy.String, nullable=True)
    surname = sqlalchemy.Column(sqlalchemy.String, nullable=True)
    email = sqlalchemy.Column(sqlalchemy.String, index=True, unique=True)
    password = sqlalchemy.Column(sqlalchemy.String)
    reg_date = sqlalchemy.Column(sqlalchemy.DateTime, default=datetime.datetime.now)
    is_email = sqlalchemy.Column(sqlalchemy.Boolean, default=False)
    session_key = sqlalchemy.Column(sqlalchemy.String, index=True, nullable=True)
    friends = sqlalchemy.Column(sqlalchemy.String, index=True, nullable=True)
    anotherInfo = sqlalchemy.Column(sqlalchemy.String, default='{}')
