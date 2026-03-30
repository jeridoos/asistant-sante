from datetime import datetime, timedelta

def set_appointment(patient_id, appointment_date, conn, notes=None):
    cursor = conn.cursor()
    cursor.execute('INSERT INTO appointments (patient_id, appointment_date, notes) VALUES (?, ?, ?)', (patient_id, appointment_date.isoformat(), notes))
    conn.commit()
    return cursor.lastrowid

def check_upcoming_appointments(conn):
    cursor = conn.cursor()
    now = datetime.now()
    two_days_later = now + timedelta(days=2)
    cursor.execute('SELECT id, patient_id, appointment_date, notes FROM appointments WHERE appointment_date > ? AND appointment_date <= ? AND reminder_sent = 0', (now.isoformat(), two_days_later.isoformat()))
    upcoming = cursor.fetchall()
    for appt_id, patient_id, appt_date_str, notes in upcoming:
        appt_date = datetime.fromisoformat(appt_date_str)
        print(f"[RAPPEL] Patient {patient_id} : rendez-vous le {appt_date.strftime('%d/%m/%Y')} - {notes if notes else ''}")
        cursor.execute('UPDATE appointments SET reminder_sent = 1 WHERE id = ?', (appt_id,))
    conn.commit()
