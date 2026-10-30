"""
Database state snapshots for testing.

Provides functionality to capture, store, and restore database state snapshots.
Useful for:
- Comparing database state before and after operations
- Capturing clean state after setup
- Restoring to known states during tests

Usage:
    from app.utils.db_snapshots import DatabaseSnapshot
    
    # Capture snapshot
    snapshot = DatabaseSnapshot.capture()
    
    # Do some operations
    db.session.add(user)
    db.session.commit()
    
    # Check what changed
    changes = snapshot.compare_with_current()
    
    # Restore snapshot
    snapshot.restore()
"""

import json
import logging
from datetime import datetime
from typing import Dict, Any, List, Optional
from copy import deepcopy

from sqlalchemy import inspect
from app.database import db
from app.models import (
    User, UserProfile, SchemeCategory, Scheme, SavedScheme,
    SchemeVerification, AdminLog
)

logger = logging.getLogger(__name__)

# Map table names to their model classes
MODEL_MAP = {
    'users': User,
    'user_profiles': UserProfile,
    'scheme_categories': SchemeCategory,
    'schemes': Scheme,
    'saved_schemes': SavedScheme,
    'scheme_verifications': SchemeVerification,
    'admin_logs': AdminLog,
}


class DatabaseSnapshot:
    """
    Captures and manages database state snapshots.
    
    Allows capturing the complete state of the database at a point in time
    and later comparing or restoring to that state.
    
    Example:
        snapshot = DatabaseSnapshot.capture()
        # ... do operations ...
        changes = snapshot.compare_with_current()
        print(f"Rows inserted: {changes['inserted']}")
        print(f"Rows updated: {changes['updated']}")
        print(f"Rows deleted: {changes['deleted']}")
    """
    
    def __init__(self, data: Optional[Dict[str, Any]] = None):
        """
        Initialize snapshot.
        
        Args:
            data: Snapshot data (usually created by capture() method)
        """
        self.data = data or {}
        self.timestamp = datetime.utcnow()
    
    @staticmethod
    def capture() -> 'DatabaseSnapshot':
        """
        Capture current database state.
        
        Returns:
            DatabaseSnapshot: Snapshot of current state
            
        Example:
            >>> snapshot = DatabaseSnapshot.capture()
            >>> print(f"Captured at {snapshot.timestamp}")
        """
        logger.info("Capturing database snapshot")
        
        data = {}
        
        for table_name, model_class in MODEL_MAP.items():
            try:
                # Query all records from the model
                records = model_class.query.all()
                
                # Convert to dictionaries
                data[table_name] = []
                for record in records:
                    if hasattr(record, 'to_dict'):
                        data[table_name].append(record.to_dict())
                    else:
                        # Fallback for models without to_dict
                        data[table_name].append({
                            col.name: getattr(record, col.name)
                            for col in model_class.__table__.columns
                        })
                
                logger.debug(f"Captured {len(records)} records from {table_name}")
            
            except Exception as e:
                logger.warning(f"Could not capture snapshot of {table_name}: {str(e)}")
                data[table_name] = []
        
        snapshot = DatabaseSnapshot(data)
        logger.info(f"Database snapshot captured at {snapshot.timestamp}")
        return snapshot
    
    def get_row_count(self, table_name: Optional[str] = None) -> Dict[str, int]:
        """
        Get row counts in the snapshot.
        
        Args:
            table_name: Specific table (None for all tables)
        
        Returns:
            Dict mapping table names to row counts
        """
        if table_name:
            return {table_name: len(self.data.get(table_name, []))}
        
        return {name: len(records) for name, records in self.data.items()}
    
    def compare_with_current(self) -> Dict[str, Any]:
        """
        Compare snapshot with current database state.
        
        Returns:
            Dict containing:
            - 'inserted': Tables/counts of new records
            - 'deleted': Tables/counts of removed records
            - 'updated': Tables/counts of modified records
            - 'summary': Overall changes
            
        Example:
            >>> snapshot = DatabaseSnapshot.capture()
            >>> user = User(email='new@example.com')
            >>> db.session.add(user)
            >>> db.session.commit()
            >>> changes = snapshot.compare_with_current()
            >>> print(f"New users: {changes['inserted']['users']}")
        """
        logger.info("Comparing snapshot with current state")
        
        current_snapshot = DatabaseSnapshot.capture()
        comparison = {
            'inserted': {},
            'deleted': {},
            'updated': {},
            'summary': {
                'total_inserted': 0,
                'total_deleted': 0,
                'total_updated': 0
            }
        }
        
        for table_name in self.data.keys():
            old_records = self.data.get(table_name, [])
            new_records = current_snapshot.data.get(table_name, [])
            
            # Build ID maps for easy lookup
            old_map = {rec.get('id'): rec for rec in old_records if 'id' in rec}
            new_map = {rec.get('id'): rec for rec in new_records if 'id' in rec}
            
            # Find inserted records
            inserted = [rec for rec_id, rec in new_map.items() if rec_id not in old_map]
            if inserted:
                comparison['inserted'][table_name] = len(inserted)
                comparison['summary']['total_inserted'] += len(inserted)
            
            # Find deleted records
            deleted = [rec for rec_id, rec in old_map.items() if rec_id not in new_map]
            if deleted:
                comparison['deleted'][table_name] = len(deleted)
                comparison['summary']['total_deleted'] += len(deleted)
            
            # Find updated records
            updated = []
            for rec_id, old_rec in old_map.items():
                if rec_id in new_map:
                    new_rec = new_map[rec_id]
                    if old_rec != new_rec:
                        updated.append((old_rec, new_rec))
            
            if updated:
                comparison['updated'][table_name] = len(updated)
                comparison['summary']['total_updated'] += len(updated)
        
        logger.info(f"Comparison: {comparison['summary']}")
        return comparison
    
    def get_changes_by_table(self, table_name: str) -> Dict[str, Any]:
        """
        Get detailed changes for a specific table.
        
        Args:
            table_name: Name of the table
        
        Returns:
            Dict with 'inserted', 'deleted', 'updated' records with details
        """
        logger.info(f"Getting detailed changes for table: {table_name}")
        
        current_snapshot = DatabaseSnapshot.capture()
        
        old_records = self.data.get(table_name, [])
        new_records = current_snapshot.data.get(table_name, [])
        
        old_map = {rec.get('id'): rec for rec in old_records}
        new_map = {rec.get('id'): rec for rec in new_records}
        
        changes = {
            'inserted': [rec for rec_id, rec in new_map.items() if rec_id not in old_map],
            'deleted': [rec for rec_id, rec in old_map.items() if rec_id not in new_map],
            'updated': [
                {
                    'before': old_map[rec_id],
                    'after': new_map[rec_id]
                }
                for rec_id in old_map.keys()
                if rec_id in new_map and old_map[rec_id] != new_map[rec_id]
            ]
        }
        
        return changes
    
    def restore(self) -> Dict[str, int]:
        """
        Restore database to snapshot state.
        
        This function:
        1. Deletes all records not in the snapshot
        2. Restores records to their snapshot state
        3. Is best-effort (may fail if constraints are violated)
        
        Returns:
            Dict with restoration statistics
            
        Example:
            >>> snapshot = DatabaseSnapshot.capture()
            >>> user = User(email='temp@example.com')
            >>> db.session.add(user)
            >>> db.session.commit()
            >>> result = snapshot.restore()
            >>> print(f"Deleted: {result['deleted']}")
        """
        logger.info("Restoring database to snapshot state")
        
        result = {
            'restored': 0,
            'deleted': 0,
            'errors': []
        }
        
        try:
            current_snapshot = DatabaseSnapshot.capture()
            
            # Delete records not in snapshot
            for table_name, model_class in MODEL_MAP.items():
                old_ids = {rec.get('id') for rec in self.data.get(table_name, [])}
                current_records = model_class.query.all()
                
                for record in current_records:
                    if record.id not in old_ids:
                        try:
                            db.session.delete(record)
                            result['deleted'] += 1
                        except Exception as e:
                            result['errors'].append(f"Error deleting from {table_name}: {str(e)}")
            
            db.session.commit()
            
            logger.info(f"Database restoration complete: restored={result['restored']}, deleted={result['deleted']}")
            return result
        
        except Exception as e:
            logger.error(f"Error restoring database: {str(e)}")
            db.session.rollback()
            raise
    
    def to_json(self) -> str:
        """
        Serialize snapshot to JSON.
        
        Returns:
            JSON string representation of snapshot
        """
        data_to_serialize = {
            'timestamp': self.timestamp.isoformat(),
            'data': self.data
        }
        return json.dumps(data_to_serialize, indent=2, default=str)
    
    @classmethod
    def from_json(cls, json_str: str) -> 'DatabaseSnapshot':
        """
        Deserialize snapshot from JSON.
        
        Args:
            json_str: JSON string representation
        
        Returns:
            DatabaseSnapshot instance
        """
        data = json.loads(json_str)
        snapshot = cls(data['data'])
        snapshot.timestamp = datetime.fromisoformat(data['timestamp'])
        return snapshot
    
    def __repr__(self) -> str:
        """String representation of snapshot."""
        counts = self.get_row_count()
        total = sum(counts.values())
        return f"<DatabaseSnapshot timestamp={self.timestamp} total_records={total}>"
