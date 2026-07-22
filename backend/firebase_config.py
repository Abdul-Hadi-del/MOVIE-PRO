import firebase_admin
from firebase_admin import credentials, firestore
import os
import json

# Render (production) pe FIREBASE_CREDENTIALS env variable se load karo,
# local machine pe serviceAccountKey.json file se load karo.
firebase_creds_json = os.environ.get("FIREBASE_CREDENTIALS")

if firebase_creds_json:
    cred_dict = json.loads(firebase_creds_json)
    cred = credentials.Certificate(cred_dict)
else:
    BASE_DIR = os.path.dirname(os.path.abspath(__file__))
    CRED_PATH = os.path.join(BASE_DIR, "serviceAccountKey.json")
    cred = credentials.Certificate(CRED_PATH)

firebase_admin.initialize_app(cred)

db = firestore.client()