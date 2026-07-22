from functools import wraps
from flask import request, jsonify
from firebase_admin import auth as firebase_auth


def verify_token(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        if request.method == "OPTIONS":
            return "", 200

        auth_header = request.headers.get("Authorization", "")
        if not auth_header.startswith("Bearer "):
            return jsonify({"error": "Missing or invalid Authorization header"}), 401

        id_token = auth_header.split("Bearer ")[1]
        try:
            decoded_token = firebase_auth.verify_id_token(id_token)
            request.user_id = decoded_token["uid"]
        except Exception:
            return jsonify({"error": "Invalid or expired token"}), 401

        return f(*args, **kwargs)
    return decorated