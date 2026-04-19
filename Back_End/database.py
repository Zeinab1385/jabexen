import psycopg2
from psycopg2.extras import RealDictCursor
import os
from dotenv import load_dotenv

load_dotenv()


def get_db_connection():
    db_url = os.getenv("LOCAL_DATABASE_URL")
    try:
        conn = psycopg2.connect(
            dsn=db_url,
            cursor_factory=RealDictCursor
        )
        conn.autocommit = True  # اضافه کردن این خط باعث می‌شود هر تغییر بلافاصله ذخیره شود
        print("✅ اتصال برقرار شد")
        return conn
    except Exception as e:
        print("❌ خطا:", e)
        return None