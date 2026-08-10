import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from database import SessionLocal
from models import User, UserProfile
from services.auth import hash_password

ADMIN_EMAIL = "claritasalame@outlook.com"
ADMIN_PASSWORD = "claritaadmin"


def seed_admin() -> None:
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.email == ADMIN_EMAIL).first()
        if user is None:
            user = User(email=ADMIN_EMAIL, password=hash_password(ADMIN_PASSWORD), is_admin=True)
            db.add(user)
            db.flush()
            db.add(UserProfile(user_id=user.id, cash_balance=0.0))
            message = f"Created admin user {ADMIN_EMAIL}"
        else:
            user.is_admin = True
            message = f"Admin user {ADMIN_EMAIL} already exists; ensured admin access"
        db.commit()
        print(message)
    finally:
        db.close()


if __name__ == "__main__":
    seed_admin()
