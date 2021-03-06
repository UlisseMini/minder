from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from sqlalchemy.orm import Session

import sys

SQLALCHEMY_DATABASE_URL = "sqlite:///./sql_app.db"

if 'pytest' in sys.modules:
    import atexit, tempfile, os
    temppath = tempfile.mktemp() + '.db'
    atexit.register(lambda: os.remove(temppath))

    SQLALCHEMY_DATABASE_URL = "sqlite:///" + temppath


engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

# Dependency
def get_db() -> Session:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()



