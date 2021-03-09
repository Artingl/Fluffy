import datetime
import sqlalchemy
import db


class User(db.SqlAlchemyBase):
    __tablename__ = 'users'

    id = sqlalchemy.Column(sqlalchemy.Integer, primary_key=True, autoincrement=True)
    name = sqlalchemy.Column(sqlalchemy.String, nullable=True)
    email = sqlalchemy.Column(sqlalchemy.String, index=True, unique=True, nullable=True)
    password = sqlalchemy.Column(sqlalchemy.String, nullable=True)
    reg_date = sqlalchemy.Column(sqlalchemy.DateTime, default=datetime.datetime.now)
    session_key = sqlalchemy.Column(sqlalchemy.String, index=True, nullable=True)
    friends = sqlalchemy.Column(sqlalchemy.String, index=True,  nullable=True)
