import sqlalchemy as sa
import sqlalchemy.orm as orm
from sqlalchemy.orm import Session
import sqlalchemy.ext.declarative as dec

SqlAlchemyBase = dec.declarative_base()

__factory = None
__prefix = "[SERVER/BD] "


def global_init(db_file):
    global __factory
    db_file = db_file.strip()

    if __factory:
        return

    if not db_file:
        raise Exception(__prefix + "File name cannot be null!")

    conn_str = f'sqlite:///{db_file.strip()}?check_same_thread=False'
    print(f"{__prefix}Trying to connect to db with address {conn_str}...")

    engine = sa.create_engine(conn_str, echo=False)
    __factory = orm.sessionmaker(bind=engine)

    import modules

    SqlAlchemyBase.metadata.create_all(engine)


def create_session() -> Session:
    global __factory
    return __factory()
