from flask import Flask, request, jsonify
import joblib
import pandas as pd

model = joblib.load('adherence_model.pkl')
scaler = joblib.load('scaler.pkl')

feature_names = ['GENDER', 'AGE_LAST', 'N_VISITS_PAST', 'N_CLAIMS_PAST',
                 'N_UNIQUE_DRUGS_PAST', 'TOTAL_UNITS_PAST', 'TOTAL_AMOUNT_PAST',
                 'AVG_INTERVAL_PAST']

app = Flask(__name__)

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

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
