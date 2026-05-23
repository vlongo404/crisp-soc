import os
import json
import psycopg2
from psycopg2.extras import Json
from dotenv import load_dotenv

load_dotenv()


def get_conn():
    return psycopg2.connect(os.getenv("DB_URL"))


def init_db():
    conn = get_conn()
    cur = conn.cursor()
    cur.execute("""
        CREATE TABLE IF NOT EXISTS analyses (
            id         SERIAL PRIMARY KEY,
            created_at TIMESTAMP DEFAULT NOW(),
            source     TEXT,
            event_count INTEGER,
            priority   TEXT,
            summary    TEXT,
            findings   JSONB,
            action     TEXT,
            raw_events JSONB
        )
    """)
    conn.commit()
    cur.close()
    conn.close()
    print("[DB] Tabela analyses pronta.")


def save_analysis(source, count, priority, summary, findings, action, events):
    conn = get_conn()
    cur = conn.cursor()
    cur.execute(
        """INSERT INTO analyses
             (source, event_count, priority, summary, findings, action, raw_events)
           VALUES (%s,%s,%s,%s,%s,%s,%s)""",
        (source, count, priority, summary, Json(findings), action, Json(events[:20])),
    )
    conn.commit()
    cur.close()
    conn.close()


def get_analyses(limit=20):
    conn = get_conn()
    cur = conn.cursor()
    cur.execute(
        "SELECT id,created_at,source,priority,summary,action FROM analyses"
        " ORDER BY created_at DESC LIMIT %s",
        (limit,),
    )
    rows = cur.fetchall()
    cur.close()
    conn.close()
    return [
        {
            "id": r[0],
            "ts": str(r[1]),
            "source": r[2],
            "priority": r[3],
            "summary": r[4],
            "action": r[5],
        }
        for r in rows
    ]
