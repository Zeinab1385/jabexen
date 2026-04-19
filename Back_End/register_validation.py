from fastapi import FastAPI, status, HTTPException
from pydantic import BaseModel, Field, EmailStr, field_validator
from fastapi.middleware.cors import CORSMiddleware
import re
import psycopg2
from psycopg2.extras import RealDictCursor
from passlib.context import CryptContext
from database import get_db_connection

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ====================== ایجاد جدول در startup ======================
@app.on_event("startup")
async def create_tables():
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("""
                       CREATE TABLE IF NOT EXISTS users
                       (
                           id
                           SERIAL
                           PRIMARY
                           KEY,
                           username
                           VARCHAR
                       (
                           20
                       ) UNIQUE NOT NULL,
                           email VARCHAR
                       (
                           255
                       ) UNIQUE NOT NULL,
                           password VARCHAR
                       (
                           255
                       ) NOT NULL,
                           created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                           )
                       """)
        conn.commit()
        print("✅ جدول users با موفقیت آماده شد")
    except Exception as e:
        print(f"❌ خطا در ایجاد جدول: {e}")
    finally:
        cursor.close()
        conn.close()


class SignUpUser(BaseModel):
    username: str = Field(..., min_length=3, max_length=20)
    password: str = Field(..., min_length=8, max_length=20)
    email: EmailStr

    @field_validator('username')
    def validate_username(cls, v):
        if not re.match(r'^[a-zA-Z]', v):
            raise ValueError("نام کاربری باید با یک حرف شروع شود.")
        return v

    @field_validator('password')
    def password_complexity(cls, v):
        if not re.search(r'[A-Z]', v): raise ValueError("رمز عبور باید حداقل یک حرف بزرگ داشته باشد.")
        if not re.search(r'[a-z]', v): raise ValueError("رمز عبور باید حداقل یک حرف کوچک داشته باشد.")
        if not re.search(r'[0-9]', v): raise ValueError("رمز عبور باید حداقل یک عدد داشته باشد.")
        if not re.search(r'[@$!%*?&]', v): raise ValueError("رمز عبور باید حداقل یک کاراکتر خاص داشته باشد.")
        return v


class SignInUser(BaseModel):
    username: str
    password: str = Field(..., min_length=8, max_length=20)


@app.post("/auth/register", status_code=status.HTTP_201_CREATED)
async def create_user(user: SignUpUser):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        print("=== REGISTER ATTEMPT START ===")
        print(f"داده دریافتی → Username: {user.username} | Email: {user.email}")

        # چک تکراری بودن
        cursor.execute("SELECT 1 FROM users WHERE email = %s", (user.email,))
        if cursor.fetchone():
            raise HTTPException(status_code=400, detail="این ایمیل تکراری است!")

        cursor.execute("SELECT 1 FROM users WHERE username = %s", (user.username,))
        if cursor.fetchone():
            raise HTTPException(status_code=400, detail="یوزرنیم تکراری است!")

        hashed_pw = pwd_context.hash(user.password)
        print("✅ رمز عبور هش شد")

        cursor.execute(
            "INSERT INTO users (username, email, password) VALUES (%s, %s, %s)",
            (user.username, user.email, hashed_pw)
        )

        conn.commit()  # ← این خط خیلی مهمه
        print("✅ INSERT + COMMIT با موفقیت انجام شد")

        return {"message": "کاربر با موفقیت ساخته شد"}

    except HTTPException as he:
        print(f"HTTPException: {he.detail}")
        raise
    except Exception as e:
        print(f"❌ خطای غیرمنتظره: {str(e)}")
        if conn:
            conn.rollback()
        raise HTTPException(status_code=500, detail=f"خطای داخلی سرور: {str(e)}")
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()


# تابع login بدون تغییر بماند (یا همان قبلی)
@app.post("/auth/login", status_code=status.HTTP_200_OK)
async def login_user(user: SignInUser):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        print("=== LOGIN ATTEMPT ===")
        print(f"Username: {user.username} | Password length: {len(user.password)}")

        cursor.execute(
            "SELECT id, username, password FROM users WHERE username = %s",
            (user.username,)
        )
        db_user = cursor.fetchone()

        if not db_user:
            print("❌ کاربر پیدا نشد")
            raise HTTPException(status_code=401, detail="نام کاربری یا رمز عبور اشتباه است")

        print(f"رمز عبور ذخیره‌شده در دیتابیس: {db_user['password'][:30]}...")

        is_correct = pwd_context.verify(user.password, db_user['password'])
        print(f"نتیجه verify: {is_correct}")

        if not is_correct:
            raise HTTPException(status_code=401, detail="نام کاربری یا رمز عبور اشتباه است")

        print("✅ لاگین موفق")
        return {
            "status": "success",
            "user": {"id": db_user['id'], "username": db_user['username']}
        }
    finally:
        cursor.close()
        conn.close()