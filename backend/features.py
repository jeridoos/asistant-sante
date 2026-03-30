from datetime import datetime

def compute_features(patient_id, conn):
    cursor = conn.cursor()
    # 1. Genre
    cursor.execute("SELECT gender FROM patients WHERE id=?", (patient_id,))
    row = cursor.fetchone()
    gender = 1 if row and row[0] == 'M' else 0
    # 2. Âge
    cursor.execute("SELECT strftime('%Y', 'now') - strftime('%Y', birthdate) FROM patients WHERE id=?", (patient_id,))
    age = cursor.fetchone()[0] if row else None
    # 3. Jours distincts avec confirmation
    cursor.execute('SELECT COUNT(DISTINCT DATE(confirmed_datetime)) FROM intakes WHERE patient_id=? AND confirmed_datetime IS NOT NULL', (patient_id,))
    n_visits = cursor.fetchone()[0] or 0
    # 4. Nombre de prises confirmées
    cursor.execute('SELECT COUNT(*) FROM intakes WHERE patient_id=? AND confirmed_datetime IS NOT NULL', (patient_id,))
    n_claims = cursor.fetchone()[0] or 0
    # 5. Médicaments distincts
    cursor.execute('SELECT COUNT(DISTINCT medication_id) FROM treatments WHERE patient_id=?', (patient_id,))
    n_drugs = cursor.fetchone()[0] or 0
    # 6. Total unités
    cursor.execute('SELECT SUM(units_per_intake) FROM treatments WHERE patient_id=?', (patient_id,))
    total_units = cursor.fetchone()[0] or 0
    # 7. Montant (non collecté)
    total_amount = 0
    # 8. Intervalle moyen
    cursor.execute('SELECT confirmed_datetime FROM intakes WHERE patient_id=? AND confirmed_datetime IS NOT NULL ORDER BY confirmed_datetime', (patient_id,))
    rows = cursor.fetchall()
    if len(rows) > 1:
        dates = [datetime.fromisoformat(r[0]) for r in rows]
        diffs = [(dates[i] - dates[i-1]).days for i in range(1, len(dates))]
        avg_interval = sum(diffs) / len(diffs)
    else:
        avg_interval = None
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
