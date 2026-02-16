"""
Firebase integration for GMeet Clone
Handles meeting persistence, user data, and analytics
"""
import os
import firebase_admin
from firebase_admin import credentials, firestore, db
from datetime import datetime
import logging

logger = logging.getLogger(__name__)


class FirebaseManager:
    """Manage Firebase operations"""
    
    def __init__(self):
        self.initialized = False
        self.db = None
        self.firestore_db = None
        self._initialize()
    
    def _initialize(self):
        """Initialize Firebase Admin SDK"""
        try:
            # Check if Firebase credentials are provided
            firebase_cred_path = os.getenv('FIREBASE_CREDENTIALS_PATH')
            firebase_cred_json = os.getenv('FIREBASE_CREDENTIALS_JSON')
            
            if firebase_cred_path and os.path.exists(firebase_cred_path):
                # Use credentials file
                cred = credentials.Certificate(firebase_cred_path)
                firebase_admin.initialize_app(cred, {
                    'databaseURL': os.getenv('FIREBASE_DATABASE_URL')
                })
                self.initialized = True
                logger.info("✅ Firebase initialized with credentials file")
                
            elif firebase_cred_json:
                # Use credentials from environment variable (for deployment)
                import json
                cred_dict = json.loads(firebase_cred_json)
                cred = credentials.Certificate(cred_dict)
                firebase_admin.initialize_app(cred, {
                    'databaseURL': os.getenv('FIREBASE_DATABASE_URL')
                })
                self.initialized = True
                logger.info("✅ Firebase initialized with JSON credentials")
            else:
                logger.warning("⚠️  Firebase credentials not found. Running without persistence.")
                return
            
            # Initialize Firestore
            self.firestore_db = firestore.client()
            logger.info("✅ Firestore initialized")
            
        except Exception as e:
            logger.error(f"❌ Firebase initialization failed: {str(e)}")
            logger.warning("⚠️  Running without Firebase persistence")
    
    def save_meeting(self, room_id, meeting_data):
        """Save meeting data to Firestore"""
        if not self.initialized:
            return False
        
        try:
            doc_ref = self.firestore_db.collection('meetings').document(room_id)
            doc_ref.set({
                **meeting_data,
                'updated_at': datetime.now().isoformat()
            })
            logger.info(f"Meeting {room_id} saved to Firebase")
            return True
        except Exception as e:
            logger.error(f"Error saving meeting to Firebase: {str(e)}")
            return False
    
    def get_meeting(self, room_id):
        """Get meeting data from Firestore"""
        if not self.initialized:
            return None
        
        try:
            doc_ref = self.firestore_db.collection('meetings').document(room_id)
            doc = doc_ref.get()
            if doc.exists:
                return doc.to_dict()
            return None
        except Exception as e:
            logger.error(f"Error getting meeting from Firebase: {str(e)}")
            return None
    
    def update_meeting_status(self, room_id, status):
        """Update meeting status"""
        if not self.initialized:
            return False
        
        try:
            doc_ref = self.firestore_db.collection('meetings').document(room_id)
            doc_ref.update({
                'status': status,
                'updated_at': datetime.now().isoformat()
            })
            return True
        except Exception as e:
            logger.error(f"Error updating meeting status: {str(e)}")
            return False
    
    def log_analytics(self, event_name, data):
        """Log analytics event"""
        if not self.initialized:
            return False
        
        try:
            self.firestore_db.collection('analytics').add({
                'event': event_name,
                'data': data,
                'timestamp': datetime.now().isoformat()
            })
            return True
        except Exception as e:
            logger.error(f"Error logging analytics: {str(e)}")
            return False
    
    def get_meeting_history(self, limit=50):
        """Get recent meeting history"""
        if not self.initialized:
            return []
        
        try:
            meetings_ref = self.firestore_db.collection('meetings')
            query = meetings_ref.order_by('created_at', direction=firestore.Query.DESCENDING).limit(limit)
            docs = query.stream()
            
            history = []
            for doc in docs:
                data = doc.to_dict()
                data['id'] = doc.id
                history.append(data)
            
            return history
        except Exception as e:
            logger.error(f"Error getting meeting history: {str(e)}")
            return []


# Global Firebase manager instance
firebase_manager = FirebaseManager()
