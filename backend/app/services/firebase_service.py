import logging
from typing import Any, Dict, Optional
from app.core.config import settings

logger = logging.getLogger("eduverse.firebase")


class FirebaseService:
    """
    Handles Firebase Authentication, Storage, and FCM integration.
    Supports live Firebase Admin SDK credentials and a structured dev/test mock mode.
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
            # When firebase-admin is available and credentials exist
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
        Verifies a Firebase ID token and extracts claims (uid, email, name).
        """
        if not id_token:
            return None

        cls.initialize()

        # In dev/mock mode or if token starts with 'mock-firebase-'
        if settings.FIREBASE_MOCK_MODE or id_token.startswith("mock-firebase-"):
            # Structure: mock-firebase-UID-EMAIL
            parts = id_token.split(":")
            uid = parts[1] if len(parts) > 1 else "firebase-dev-user-001"
            email = parts[2] if len(parts) > 2 else f"{uid}@eduverse.io"
            return {
                "uid": uid,
                "email": email,
                "email_verified": True,
                "name": parts[3] if len(parts) > 3 else "Dev Firebase User",
                "auth_time": 1700000000,
            }

        try:
            import firebase_admin
            from firebase_admin import auth
            decoded = auth.verify_id_token(id_token)
            return decoded
        except Exception as e:
            logger.error(f"Firebase token verification failed: {e}")
            return None


firebase_service = FirebaseService()
