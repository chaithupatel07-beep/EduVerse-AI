import logging
from typing import Any, Dict, Optional
from app.core.config import settings

logger = logging.getLogger("eduverse.firebase")


class FirebaseService:
    """
    Handles Firebase Authentication and Admin SDK integration.
    Supports live Firebase Admin SDK credentials and an authoritative dev/test mock adapter.
    """
    _initialized = False

    @classmethod
    def initialize(cls):
        if cls._initialized:
            return
        if settings.FIREBASE_MOCK_MODE or not settings.FIREBASE_CREDENTIALS_PATH:
            logger.info("Firebase running in development/mock mode.")
            cls._initialized = True
            return

        try:
            import firebase_admin
            from firebase_admin import credentials
            cred = credentials.Certificate(settings.FIREBASE_CREDENTIALS_PATH)
            firebase_admin.initialize_app(cred, {
                "storageBucket": settings.FIREBASE_STORAGE_BUCKET
            })
            cls._initialized = True
            logger.info("Firebase Admin SDK initialized successfully.")
        except Exception as e:
            logger.warning(f"Could not initialize live Firebase Admin SDK: {e}. Falling back to dev mode.")
            cls._initialized = True

    @classmethod
    def verify_firebase_id_token(cls, id_token: str) -> Optional[Dict[str, Any]]:
        """
        Verifies a Firebase ID token and extracts claims (uid, email, email_verified, name).
        Supports live Firebase Admin SDK verification and flexible dev/test tokens.
        """
        if not id_token or not isinstance(id_token, str):
            return None

        # Check for mock development/test token patterns
        # Format: mock-firebase:UID:EMAIL:NAME or mock-firebase-UID:EMAIL
        if id_token.startswith("mock-firebase:") or id_token.startswith("mock-firebase-"):
            prefix = "mock-firebase:" if id_token.startswith("mock-firebase:") else "mock-firebase-"
            token_body = id_token[len(prefix):]
            delimiter = ":" if ":" in token_body else "-"
            parts = token_body.split(delimiter)
            uid = parts[0] if len(parts) > 0 and parts[0] else "firebase-dev-user-001"
            email = parts[1] if len(parts) > 1 and parts[1] else f"{uid}@eduverse.io"
            name = parts[2] if len(parts) > 2 and parts[2] else f"User {uid}"
            return {
                "uid": uid,
                "email": email,
                "email_verified": True,
                "name": name,
                "auth_time": 1700000000,
            }

        cls.initialize()

        # If running in live mode, attempt verification using firebase_admin.auth
        try:
            import firebase_admin
            from firebase_admin import auth
            decoded = auth.verify_id_token(id_token)
            return decoded
        except Exception as e:
            return None


firebase_service = FirebaseService()
