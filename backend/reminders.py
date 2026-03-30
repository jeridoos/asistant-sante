from datetime import datetime, timedelta

def generate_intakes(patient_id, treatment_id, start_date, end_date, frequency, scheduled_times, units_per_intake, conn):
    cursor = conn.cursor()
    if frequency == '1x/jour':
        delta = timedelta(days=1)
    elif frequency == '2x/jour':
        delta = timedelta(days=1)
    elif frequency == '1x/2jours':
        delta = timedelta(days=2)
    else:
        delta = timedelta(days=1)
    current_date = start_date
    while current_date <= end_date:
        for time_str in scheduled_times:
            hour, minute = map(int, time_str.split(':'))
            scheduled_dt = datetime.combine(current_date, datetime.min.time()) + timedelta(hours=hour, minutes=minute)
            cursor.execute('INSERT INTO intakes (patient_id, treatment_id, scheduled_datetime, status) VALUES (?, ?, ?, ?)', (patient_id, treatment_id, scheduled_dt, 'scheduled'))
        current_date += delta
    conn.commit()

def confirm_intake(intake_id, confirmed_datetime, conn):
    cursor = conn.cursor()
    cursor.execute('SELECT scheduled_datetime FROM intakes WHERE id=?', (intake_id,))
    row = cursor.fetchone()
    if not row:
        return
    scheduled = datetime.fromisoformat(row[0])
    delay = (confirmed_datetime - scheduled).total_seconds() / 60
    status = 'confirmed' if delay <= 0 else 'delayed'
    cursor.execute('UPDATE intakes SET confirmed_datetime=?, delay_minutes=?, status=? WHERE id=?', (confirmed_datetime.isoformat(), delay, status, intake_id))
    conn.commit()

def update_streak_and_rate(patient_id, conn):
    cursor = conn.cursor()
    week_ago = datetime.now() - timedelta(days=7)
    cursor.execute('SELECT scheduled_datetime, confirmed_datetime, status, delay_minutes FROM intakes WHERE patient_id=? AND scheduled_datetime >= ? ORDER BY scheduled_datetime', (patient_id, week_ago.isoformat()))
    rows = cursor.fetchall()
    if not rows:
        return
    total = len(rows)
    confirmed = sum(1 for r in rows if r[2] in ('confirmed', 'delayed'))
    adherence_rate = confirmed / total if total > 0 else 0
    success_days = set()
    for r in rows:
        if r[2] in ('confirmed', 'delayed'):
            day = datetime.fromisoformat(r[0]).date()
            success_days.add(day)
    sorted_days = sorted(success_days)
    streak = 0
    current_day = datetime.now().date()
    while current_day in sorted_days:
        streak += 1
        current_day -= timedelta(days=1)
    cursor.execute('UPDATE patients SET current_streak=?, adherence_rate_7d=? WHERE id=?', (streak, adherence_rate, patient_id))
    conn.commit()
