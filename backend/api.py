from flask import Flask, request, jsonify, session
from flask_bcrypt import Bcrypt
import joblib
import pandas as pd
import os
import sqlite3
import secrets
from datetime import datetime, timedelta, date
from apscheduler.schedulers.background import BackgroundScheduler

# ------------------------------------------------------------
# Initialisation de l'application et configuration
# ------------------------------------------------------------
app = Flask(__name__)
app.secret_key = 'une_cle_secrete_tres_secrete'
bcrypt = Bcrypt(app)

# ------------------------------------------------------------
# CORS (pour permettre les requêtes depuis le frontend)
# ------------------------------------------------------------
@app.after_request
def after_request(response):
    response.headers.add('Access-Control-Allow-Origin', '*')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type')
    response.headers.add('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
    return response

# ------------------------------------------------------------
# Chargement du modèle ML
# ------------------------------------------------------------
base_dir = os.path.dirname(__file__)
model_path = os.path.join(base_dir, 'adherence_model.pkl')
scaler_path = os.path.join(base_dir, 'scaler.pkl')

model = joblib.load(model_path)
scaler = joblib.load(scaler_path)

feature_names = ['GENDER', 'AGE_LAST', 'N_VISITS_PAST', 'N_CLAIMS_PAST',
                 'N_UNIQUE_DRUGS_PAST', 'TOTAL_UNITS_PAST', 'TOTAL_AMOUNT_PAST',
                 'AVG_INTERVAL_PAST']

# ------------------------------------------------------------
# Base de données
# ------------------------------------------------------------
DB_PATH = os.path.join(base_dir, 'medication_app.db')

def init_db():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    # ... (toutes les CREATE TABLE comme précédemment)
    # Inclure les colonnes current_streak et adherence_rate_7d dans patients
    conn.commit()
    conn.close()

init_db()  # suppose que la base est déjà créée

# ------------------------------------------------------------
# Fonction de génération des prises
# ------------------------------------------------------------
def generate_intakes(patient_id, treatment_id, start_date, end_date, frequency, scheduled_times, units_per_intake, conn):
    cursor = conn.cursor()
    if frequency == '1x/jour':
        delta = timedelta(days=1)
    elif frequency == '2x/jour':
        delta = timedelta(days=1)
    elif frequency == '3x/jour':
        delta = timedelta(days=1)
    elif frequency == '1x/2jours':
        delta = timedelta(days=2)
    elif frequency == '1x/semaine':
        delta = timedelta(days=7)
    else:
        delta = timedelta(days=1)

    current_date = start_date
    while current_date <= end_date:
        for time_str in scheduled_times:
            hour, minute = map(int, time_str.split(':'))
            scheduled_dt = datetime.combine(current_date, datetime.min.time()) + timedelta(hours=hour, minutes=minute)
            cursor.execute('''
                INSERT INTO intakes (patient_id, treatment_id, scheduled_datetime, status)
                VALUES (?, ?, ?, 'scheduled')
            ''', (patient_id, treatment_id, scheduled_dt))
        current_date += delta
    conn.commit()

# ------------------------------------------------------------
# Fonction de mise à jour des métriques
# ------------------------------------------------------------
def update_streak_and_rate(patient_id, conn):
    cursor = conn.cursor()
    week_ago = (datetime.now() - timedelta(days=7)).isoformat()
    cursor.execute('''
        SELECT scheduled_datetime, confirmed_datetime, status
        FROM intakes
        WHERE patient_id = ? AND scheduled_datetime >= ?
        ORDER BY scheduled_datetime
    ''', (patient_id, week_ago))
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

    cursor.execute('''
        UPDATE patients
        SET current_streak = ?, adherence_rate_7d = ?
        WHERE id = ?
    ''', (streak, adherence_rate, patient_id))
    conn.commit()

# ------------------------------------------------------------
# Fonction de calcul des caractéristiques pour le ML
# ------------------------------------------------------------
def compute_features(patient_id, db_path):
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    cursor.execute("SELECT gender FROM patients WHERE id=?", (patient_id,))
    row = cursor.fetchone()
    gender = 1 if row and row[0] == 'M' else 0

    cursor.execute("SELECT strftime('%Y', 'now') - strftime('%Y', birthdate) FROM patients WHERE id=?", (patient_id,))
    age = cursor.fetchone()[0] if row else None

    cursor.execute('SELECT COUNT(DISTINCT DATE(confirmed_datetime)) FROM intakes WHERE patient_id=? AND confirmed_datetime IS NOT NULL', (patient_id,))
    n_visits = cursor.fetchone()[0] or 0

    cursor.execute('SELECT COUNT(*) FROM intakes WHERE patient_id=? AND confirmed_datetime IS NOT NULL', (patient_id,))
    n_claims = cursor.fetchone()[0] or 0

    cursor.execute('SELECT COUNT(DISTINCT medication_id) FROM treatments WHERE patient_id=?', (patient_id,))
    n_drugs = cursor.fetchone()[0] or 0

    cursor.execute('SELECT SUM(units_per_intake) FROM treatments WHERE patient_id=?', (patient_id,))
    total_units = cursor.fetchone()[0] or 0

    total_amount = 0

    cursor.execute('SELECT confirmed_datetime FROM intakes WHERE patient_id=? AND confirmed_datetime IS NOT NULL ORDER BY confirmed_datetime', (patient_id,))
    rows = cursor.fetchall()
    if len(rows) > 1:
        dates = [datetime.fromisoformat(r[0]) for r in rows]
        diffs = [(dates[i] - dates[i-1]).days for i in range(1, len(dates))]
        avg_interval = sum(diffs) / len(diffs)
    else:
        avg_interval = None

    conn.close()
    return {
        'GENDER': gender,
        'AGE_LAST': age,
        'N_VISITS_PAST': n_visits,
        'N_CLAIMS_PAST': n_claims,
        'N_UNIQUE_DRUGS_PAST': n_drugs,
        'TOTAL_UNITS_PAST': total_units,
        'TOTAL_AMOUNT_PAST': total_amount,
        'AVG_INTERVAL_PAST': avg_interval if avg_interval is not None else 0
    }

# ------------------------------------------------------------
# Routes d'authentification
# ------------------------------------------------------------
@app.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')
    name = data.get('name')

    if not email or not password:
        return jsonify({'error': 'Email et mot de passe requis'}), 400

    hashed = bcrypt.generate_password_hash(password).decode('utf-8')
    code = secrets.token_hex(3)

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    try:
        cursor.execute('''
            INSERT INTO users (email, password, name, verification_code)
            VALUES (?, ?, ?, ?)
        ''', (email, hashed, name, code))
        user_id = cursor.lastrowid
        conn.commit()
        print(f"Code de vérification pour {email} : {code}")
        cursor.execute('''
            INSERT INTO patients (user_id, name, birthdate, gender, pathology, is_self_care, relation)
            VALUES (?, ?, '1970-01-01', 'M', 'HTN', 1, NULL)
        ''', (user_id, name))
        conn.commit()
    except sqlite3.IntegrityError:
        return jsonify({'error': 'Email déjà utilisé'}), 400
    finally:
        conn.close()
    return jsonify({'message': 'Inscription réussie. Vérifiez votre email.'}), 201

@app.route('/verify', methods=['POST'])
def verify():
    data = request.get_json()
    email = data.get('email')
    code = data.get('code')
    if not email or not code:
        return jsonify({'error': 'Email et code requis'}), 400

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute('SELECT id, verification_code FROM users WHERE email = ?', (email,))
    user = cursor.fetchone()
    if not user or user[1] != code:
        return jsonify({'error': 'Code invalide'}), 400

    cursor.execute('UPDATE users SET email_verified = 1, verification_code = NULL WHERE id = ?', (user[0],))
    conn.commit()
    conn.close()
    return jsonify({'message': 'Email vérifié'}), 200

@app.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')
    if not email or not password:
        return jsonify({'error': 'Email et mot de passe requis'}), 400

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute('SELECT id, password, email_verified FROM users WHERE email = ?', (email,))
    user = cursor.fetchone()
    conn.close()
    if not user or not bcrypt.check_password_hash(user[1], password):
        return jsonify({'error': 'Email ou mot de passe incorrect'}), 401
    if not user[2]:
        return jsonify({'error': 'Email non vérifié'}), 403

    session['user_id'] = user[0]
    return jsonify({'message': 'Connexion réussie', 'user_id': user[0]}), 200

# ------------------------------------------------------------
# Routes pour les traitements (Groupe 1)
# ------------------------------------------------------------
@app.route('/treatments', methods=['GET'])
def get_treatments():
    patient_id = request.args.get('patient_id')
    if not patient_id:
        return jsonify({'error': 'patient_id required'}), 400

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute('''
        SELECT t.id, t.dosage, t.frequency, t.start_date, t.end_date, t.scheduled_time,
               mc.name AS drug_name
        FROM treatments t
        JOIN medications_catalog mc ON t.medication_id = mc.id
        WHERE t.patient_id = ?
        ORDER BY t.start_date DESC
    ''', (patient_id,))
    rows = cursor.fetchall()
    conn.close()
    treatments = [{
        'id': r[0],
        'dosage': r[1],
        'frequency': r[2],
        'start_date': r[3],
        'end_date': r[4],
        'scheduled_time': r[5],
        'drug_name': r[6]
    } for r in rows]
    return jsonify(treatments)

@app.route('/treatments', methods=['POST'])
def add_treatment():
    data = request.get_json()
    required = ['patient_id', 'drug_name', 'dosage', 'frequency', 'start_date', 'scheduled_time']
    for field in required:
        if field not in data:
            return jsonify({'error': f'Missing field: {field}'}), 400

    start_date = data['start_date']
    end_date = data.get('end_date')
    if end_date and end_date < start_date:
        return jsonify({'error': 'La date de fin doit être postérieure à la date de début'}), 400

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    cursor.execute('SELECT id FROM medications_catalog WHERE name = ?', (data['drug_name'],))
    row = cursor.fetchone()
    if row:
        med_id = row[0]
    else:
        cursor.execute('INSERT INTO medications_catalog (name) VALUES (?)', (data['drug_name'],))
        med_id = cursor.lastrowid

    cursor.execute('''
        INSERT INTO treatments (patient_id, medication_id, dosage, frequency, start_date, end_date, scheduled_time, units_per_intake)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ''', (
        data['patient_id'],
        med_id,
        data['dosage'],
        data['frequency'],
        start_date,
        end_date,
        data['scheduled_time'],
        data.get('units_per_intake', 1)
    ))
    treatment_id = cursor.lastrowid

    start_date_obj = datetime.strptime(start_date, '%Y-%m-%d').date()
    if end_date:
        end_date_obj = datetime.strptime(end_date, '%Y-%m-%d').date()
    else:
        end_date_obj = start_date_obj + timedelta(days=365)

    scheduled_times_list = [t.strip() for t in data['scheduled_time'].split(',')]

    generate_intakes(
        patient_id=data['patient_id'],
        treatment_id=treatment_id,
        start_date=start_date_obj,
        end_date=end_date_obj,
        frequency=data['frequency'],
        scheduled_times=scheduled_times_list,
        units_per_intake=data.get('units_per_intake', 1),
        conn=conn
    )

    conn.commit()
    conn.close()
    return jsonify({'treatment_id': treatment_id}), 201

# ------------------------------------------------------------
# Routes pour les prises (intakes)
# ------------------------------------------------------------
@app.route('/intakes', methods=['GET'])
def get_intakes():
    patient_id = request.args.get('patient_id')
    date_str = request.args.get('date')
    if not patient_id:
        return jsonify({'error': 'patient_id required'}), 400
    if not date_str:
        target_date = date.today().isoformat()
    else:
        target_date = date_str

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute('''
        SELECT id, scheduled_datetime, status, treatment_id
        FROM intakes
        WHERE patient_id = ? AND DATE(scheduled_datetime) = ?
        ORDER BY scheduled_datetime
    ''', (patient_id, target_date))
    rows = cursor.fetchall()
    conn.close()
    intakes = [{'id': r[0], 'scheduled_datetime': r[1], 'status': r[2], 'treatment_id': r[3]} for r in rows]
    return jsonify(intakes)

@app.route('/intakes/<int:intake_id>/confirm', methods=['POST'])
def confirm_intake(intake_id):
    data = request.get_json()
    confirmed_dt = data.get('confirmed_datetime')
    if not confirmed_dt:
        return jsonify({'error': 'confirmed_datetime required'}), 400

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute('SELECT patient_id, scheduled_datetime FROM intakes WHERE id = ?', (intake_id,))
    row = cursor.fetchone()
    if not row:
        return jsonify({'error': 'Intake not found'}), 404
    patient_id, scheduled_dt = row

    scheduled = datetime.fromisoformat(scheduled_dt)
    confirmed = datetime.fromisoformat(confirmed_dt)
    if confirmed.tzinfo is not None:
        confirmed = confirmed.replace(tzinfo=None)   # rendre naive

    delay = (confirmed - scheduled).total_seconds() / 60

    status = 'confirmed' if delay <= 0 else 'delayed'

    cursor.execute('''
        UPDATE intakes
        SET confirmed_datetime = ?, delay_minutes = ?, status = ?
        WHERE id = ?
    ''', (confirmed_dt, delay, status, intake_id))

    update_streak_and_rate(patient_id, conn)

    conn.commit()
    conn.close()
    return jsonify({'message': 'Intake confirmed', 'delay': delay}), 200

# ------------------------------------------------------------
# Routes pour les contraintes (Groupe 2)
# ------------------------------------------------------------
@app.route('/constraints', methods=['GET'])
def get_constraints():
    treatment_id = request.args.get('treatment_id')
    if not treatment_id:
        return jsonify({'error': 'treatment_id required'}), 400

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute('''
        SELECT treatment_id, timing_relative_to_meal, delay_minutes, special_instructions
        FROM constraints
        WHERE treatment_id = ?
    ''', (treatment_id,))
    rows = cursor.fetchall()
    conn.close()
    constraints = [{
        'treatment_id': r[0],
        'timing_relative_to_meal': r[1],
        'delay_minutes': r[2],
        'special_instructions': r[3]
    } for r in rows]
    return jsonify(constraints)

@app.route('/constraints', methods=['POST'])
def add_constraint():
    data = request.get_json()
    required = ['treatment_id', 'timing_relative_to_meal']
    for field in required:
        if field not in data:
            return jsonify({'error': f'Missing field: {field}'}), 400

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute('''
        INSERT INTO constraints (treatment_id, timing_relative_to_meal, delay_minutes, special_instructions)
        VALUES (?, ?, ?, ?)
    ''', (
        data['treatment_id'],
        data['timing_relative_to_meal'],
        data.get('delay_minutes'),
        data.get('special_instructions')
    ))
    conn.commit()
    conn.close()
    return jsonify({'message': 'Constraint added'}), 201

# ------------------------------------------------------------
# Routes pour les groupes de médicaments (Groupe 4)
# ------------------------------------------------------------
@app.route('/medication_groups', methods=['POST'])
def add_medication_group():
    data = request.get_json()
    required = ['group_id', 'patient_id', 'treatment_id', 'is_grouped']
    for field in required:
        if field not in data:
            return jsonify({'error': f'Missing field: {field}'}), 400

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute('''
        INSERT INTO medication_groups (group_id, patient_id, treatment_id, is_grouped, interval_minutes)
        VALUES (?, ?, ?, ?, ?)
    ''', (
        data['group_id'],
        data['patient_id'],
        data['treatment_id'],
        data['is_grouped'],
        data.get('interval_minutes')
    ))
    conn.commit()
    conn.close()
    return jsonify({'message': 'Medication group added'}), 201

@app.route('/patients/<int:patient_id>/groups', methods=['GET'])
def get_patient_groups(patient_id):
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute('''
        SELECT group_id, treatment_id, is_grouped, interval_minutes
        FROM medication_groups
        WHERE patient_id = ?
    ''', (patient_id,))
    rows = cursor.fetchall()
    conn.close()
    groups = [{'group_id': r[0], 'treatment_id': r[1], 'is_grouped': r[2], 'interval_minutes': r[3]} for r in rows]
    return jsonify(groups)

# ------------------------------------------------------------
# Routes pour les rendez-vous (appointments)
# ------------------------------------------------------------
@app.route('/appointments', methods=['POST'])
def add_appointment():
    data = request.get_json()
    required = ['patient_id', 'appointment_date']
    for field in required:
        if field not in data:
            return jsonify({'error': f'Missing field: {field}'}), 400

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute('''
        INSERT INTO appointments (patient_id, appointment_date, notes)
        VALUES (?, ?, ?)
    ''', (data['patient_id'], data['appointment_date'], data.get('notes')))
    conn.commit()
    conn.close()
    return jsonify({'message': 'Appointment added'}), 201

@app.route('/appointments', methods=['GET'])
def get_appointments():
    patient_id = request.args.get('patient_id')
    if not patient_id:
        return jsonify({'error': 'patient_id required'}), 400

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute('''
        SELECT id, appointment_date, notes, reminder_sent
        FROM appointments
        WHERE patient_id = ?
        ORDER BY appointment_date
    ''', (patient_id,))
    rows = cursor.fetchall()
    conn.close()
    appointments = [{'id': r[0], 'appointment_date': r[1], 'notes': r[2], 'reminder_sent': r[3]} for r in rows]
    return jsonify(appointments)

# ------------------------------------------------------------
# Routes pour les métriques (streak, taux)
# ------------------------------------------------------------
@app.route('/patients/<int:patient_id>/metrics', methods=['GET'])
def get_metrics(patient_id):
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute('SELECT current_streak, adherence_rate_7d FROM patients WHERE id = ?', (patient_id,))
    row = cursor.fetchone()
    conn.close()
    if row:
        return jsonify({'streak': row[0] or 0, 'rate': row[1] or 0})
    return jsonify({'error': 'Patient not found'}), 404

# ------------------------------------------------------------
# Routes pour la prédiction ML
# ------------------------------------------------------------
@app.route('/patients/<int:patient_id>/predict', methods=['GET'])
def predict_patient(patient_id):
    features = compute_features(patient_id, DB_PATH)
    if features is None:
        return jsonify({'error': 'Patient not found'}), 404

    df = pd.DataFrame([features], columns=feature_names)
    scaled = scaler.transform(df)
    proba = model.predict_proba(scaled)[0][1]
    return jsonify({'adherence_probability': proba})

# ------------------------------------------------------------
# Routes générales
# ------------------------------------------------------------
@app.route('/predict', methods=['POST'])
def predict():
    data = request.get_json()
    missing = [f for f in feature_names if f not in data]
    if missing:
        return jsonify({'error': f'Missing fields: {missing}'}), 400

    df = pd.DataFrame([data], columns=feature_names)
    scaled = scaler.transform(df)
    proba = model.predict_proba(scaled)[0][1]
    return jsonify({'adherence_probability': proba})

@app.route('/health', methods=['GET'])
def health():
    return jsonify({'status': 'ok'})

# ------------------------------------------------------------
# Scheduler pour les rappels de rendez-vous
# ------------------------------------------------------------
def check_appointments():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    now = datetime.now()
    tomorrow = now + timedelta(days=1)
    cursor.execute('''
        SELECT id, patient_id, appointment_date, notes
        FROM appointments
        WHERE appointment_date > ? AND appointment_date <= ? AND reminder_sent = 0
    ''', (now.isoformat(), tomorrow.isoformat()))
    upcoming = cursor.fetchall()
    for apt_id, patient_id, apt_date, notes in upcoming:
        print(f"[RAPPEL] Patient {patient_id} : rendez-vous le {apt_date} - {notes or ''}")
        cursor.execute('UPDATE appointments SET reminder_sent = 1 WHERE id = ?', (apt_id,))
    conn.commit()
    conn.close()

scheduler = BackgroundScheduler()
scheduler.add_job(check_appointments, 'interval', hours=24)
scheduler.start()

# ------------------------------------------------------------
# Lancement
# ------------------------------------------------------------
if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)