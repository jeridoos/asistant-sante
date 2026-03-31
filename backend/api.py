from flask import Flask, request, jsonify, session
from flask_bcrypt import Bcrypt
import joblib
import pandas as pd
import os
import sqlite3
import secrets
from datetime import datetime, timedelta, date

# ------------------------------------------------------------
# Initialisation de l'application et configuration
# ------------------------------------------------------------
app = Flask(__name__)
app.secret_key = 'une_cle_secrete_tres_secrete'  # À changer en production
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
# Initialisation de la base de données (SQLite)
# ------------------------------------------------------------
DB_PATH = os.path.join(base_dir, 'medication_app.db')

def init_db():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    # Table users
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            name TEXT,
            email_verified INTEGER DEFAULT 0,
            verification_code TEXT
        )
    ''')

    # Table patients (liée à users)
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS patients (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            name TEXT,
            birthdate DATE,
            gender TEXT,
            pathology TEXT,
            is_self_care INTEGER,
            relation TEXT,
            FOREIGN KEY(user_id) REFERENCES users(id)
        )
    ''')

    # Table medications_catalog
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS medications_catalog (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT,
            substance TEXT,
            dosage_type TEXT,
            default_units INTEGER
        )
    ''')

    # Table treatments
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS treatments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            patient_id INTEGER,
            medication_id INTEGER,
            dosage TEXT,
            frequency TEXT,
            start_date DATE,
            end_date DATE,
            scheduled_time TEXT,
            units_per_intake INTEGER,
            FOREIGN KEY(patient_id) REFERENCES patients(id),
            FOREIGN KEY(medication_id) REFERENCES medications_catalog(id)
        )
    ''')

    # Table constraints
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS constraints (
            treatment_id INTEGER,
            timing_relative_to_meal TEXT,
            delay_minutes INTEGER,
            special_instructions TEXT,
            FOREIGN KEY(treatment_id) REFERENCES treatments(id)
        )
    ''')

    # Table medication_groups
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS medication_groups (
            group_id INTEGER,
            patient_id INTEGER,
            treatment_id INTEGER,
            is_grouped INTEGER,
            interval_minutes INTEGER,
            FOREIGN KEY(treatment_id) REFERENCES treatments(id)
        )
    ''')

    # Table intakes
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS intakes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            patient_id INTEGER,
            treatment_id INTEGER,
            scheduled_datetime DATETIME,
            confirmed_datetime DATETIME,
            delay_minutes INTEGER,
            status TEXT,
            streak INTEGER,
            adherence_rate REAL,
            FOREIGN KEY(patient_id) REFERENCES patients(id),
            FOREIGN KEY(treatment_id) REFERENCES treatments(id)
        )
    ''')

    # Table appointments
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS appointments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            patient_id INTEGER,
            appointment_date DATETIME,
            notes TEXT,
            reminder_sent INTEGER DEFAULT 0,
            FOREIGN KEY(patient_id) REFERENCES patients(id)
        )
    ''')

    conn.commit()
    conn.close()

# Exécuter l'initialisation de la base
init_db()

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
# Routes d'authentification
# ------------------------------------------------------------
@app.route('/patients/<int:patient_id>/metrics', methods=['OPTIONS'])
def options_metrics(patient_id):
    return '', 200

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
    cursor.execute('SELECT scheduled_datetime FROM intakes WHERE id = ?', (intake_id,))
    row = cursor.fetchone()
    if not row:
        return jsonify({'error': 'Intake not found'}), 404
    scheduled_dt = row[0]

    scheduled = datetime.fromisoformat(scheduled_dt)
    confirmed = datetime.fromisoformat(confirmed_dt)
    delay = (confirmed - scheduled).total_seconds() / 60

    status = 'confirmed' if delay <= 0 else 'delayed'

    cursor.execute('''
        UPDATE intakes
        SET confirmed_datetime = ?, delay_minutes = ?, status = ?
        WHERE id = ?
    ''', (confirmed_dt, delay, status, intake_id))
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
@app.route('/patients/<int:patient_id>/metrics', methods=['GET', 'OPTIONS'])
def get_metrics(patient_id):
    # Gérer la requête preflight OPTIONS
    if request.method == 'OPTIONS':
        response = jsonify({})
        response.headers.add('Access-Control-Allow-Origin', '*')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type')
        response.headers.add('Access-Control-Allow-Methods', 'GET, OPTIONS')
        return response, 200

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute('SELECT current_streak, adherence_rate_7d FROM patients WHERE id = ?', (patient_id,))
    row = cursor.fetchone()
    conn.close()
    if row:
        response = jsonify({'streak': row[0] or 0, 'rate': row[1] or 0})
        response.headers.add('Access-Control-Allow-Origin', '*')
        return response
    return jsonify({'error': 'Patient not found'}), 404
# ------------------------------------------------------------
# Routes du modèle ML
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
# Lancement
# ------------------------------------------------------------
if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)