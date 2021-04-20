import datetime
import sqlalchemy
import db


class directMessages(db.SqlAlchemyBase):
    __tablename__ = 'directMessages'

    id = sqlalchemy.Column(sqlalchemy.Integer, primary_key=True, autoincrement=True)
    users = sqlalchemy.Column(sqlalchemy.String, index=True, nullable=True)
    content = sqlalchemy.Column(sqlalchemy.String, default='{}')
