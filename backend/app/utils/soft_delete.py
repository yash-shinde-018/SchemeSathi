"""
Soft delete utilities for SchemeSathi models.

This module provides utilities for managing soft-deleted records across all models.
Includes query filters, scopes, and helper functions for soft delete operations.

Features:
- Query filters to automatically exclude soft-deleted records
- Methods to retrieve only soft-deleted records
- Methods to restore soft-deleted records
- Batch operations for soft deletion and restoration
"""

from datetime import datetime
from typing import List, Optional, Type, TypeVar
from app import db


T = TypeVar('T')


class SoftDeleteMixin:
    """
    Mixin class to add soft delete functionality to SQLAlchemy models.
    
    This mixin provides:
    - is_deleted property: Check if record is soft-deleted
    - soft_delete(): Mark record as deleted
    - restore(): Restore a deleted record
    - get_active_query(): Get query excluding soft-deleted records
    - get_deleted_query(): Get only soft-deleted records
    - permanently_delete(): Hard delete (use with caution)
    
    All models using this mixin should have:
    - deleted_at: db.Column(db.DateTime, nullable=True)
    - created_at: db.Column(db.DateTime)
    - updated_at: db.Column(db.DateTime)
    
    Example usage in models.py:
        class MyModel(db.Model, SoftDeleteMixin):
            id = db.Column(db.Integer, primary_key=True)
            created_at = db.Column(db.DateTime, default=datetime.utcnow)
            updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
            deleted_at = db.Column(db.DateTime)
    """

    @property
    def is_deleted(self) -> bool:
        """
        Check if the record is soft-deleted.
        
        Returns:
            bool: True if deleted_at is set, False otherwise
        """
        return self.deleted_at is not None

    def soft_delete(self) -> None:
        """
        Soft delete this record by setting deleted_at timestamp.
        
        This marks the record as deleted without removing it from the database,
        allowing for audit trails and recovery.
        """
        self.deleted_at = datetime.utcnow()
        self.updated_at = datetime.utcnow()

    def restore(self) -> None:
        """
        Restore a soft-deleted record by clearing deleted_at.
        
        This makes a previously deleted record active again.
        """
        self.deleted_at = None
        self.updated_at = datetime.utcnow()

    @classmethod
    def get_active_query(cls):
        """
        Get a query that automatically excludes soft-deleted records.
        
        This should be used for most queries to ensure deleted records don't appear
        in normal application flows.
        
        Returns:
            Query: SQLAlchemy query excluding records where deleted_at IS NOT NULL
            
        Example:
            active_users = User.get_active_query().all()
            user = User.get_active_query().filter_by(email='user@example.com').first()
        """
        return cls.query.filter(cls.deleted_at.is_(None))

    @classmethod
    def get_deleted_query(cls):
        """
        Get a query that returns only soft-deleted records.
        
        Useful for administrative views showing deleted records or recovery operations.
        
        Returns:
            Query: SQLAlchemy query including only records where deleted_at IS NOT NULL
            
        Example:
            deleted_schemes = Scheme.get_deleted_query().all()
        """
        return cls.query.filter(cls.deleted_at.isnot(None))

    @classmethod
    def permanently_delete(cls, record_id: int) -> bool:
        """
        Permanently delete a record from the database (hard delete).
        
        WARNING: This operation is irreversible and removes all data.
        Use only in exceptional circumstances (e.g., compliance requirements, data cleanup).
        
        Args:
            record_id (int): ID of the record to permanently delete
            
        Returns:
            bool: True if record was deleted, False if not found
            
        Raises:
            RuntimeError: If no record with given ID exists
            
        Example:
            User.permanently_delete(user_id)
        """
        record = cls.query.get(record_id)
        if not record:
            raise RuntimeError(f"Record with ID {record_id} not found")
        
        db.session.delete(record)
        db.session.commit()
        return True

    @classmethod
    def restore_by_id(cls, record_id: int) -> Optional['SoftDeleteMixin']:
        """
        Restore a soft-deleted record by its ID.
        
        Args:
            record_id (int): ID of the record to restore
            
        Returns:
            SoftDeleteMixin: Restored record object, or None if not found
            
        Example:
            restored_user = User.restore_by_id(user_id)
        """
        record = cls.query.get(record_id)
        if record and record.is_deleted:
            record.restore()
            db.session.commit()
            return record
        return None

    @classmethod
    def soft_delete_by_id(cls, record_id: int) -> Optional['SoftDeleteMixin']:
        """
        Soft delete a record by its ID.
        
        Args:
            record_id (int): ID of the record to delete
            
        Returns:
            SoftDeleteMixin: Deleted record object, or None if not found
            
        Example:
            deleted_user = User.soft_delete_by_id(user_id)
        """
        record = cls.query.get(record_id)
        if record and not record.is_deleted:
            record.soft_delete()
            db.session.commit()
            return record
        return None

    @classmethod
    def batch_soft_delete(cls, record_ids: List[int]) -> int:
        """
        Soft delete multiple records by their IDs.
        
        Args:
            record_ids (List[int]): List of record IDs to delete
            
        Returns:
            int: Number of records successfully deleted
            
        Example:
            deleted_count = Scheme.batch_soft_delete([scheme_id1, scheme_id2])
        """
        records = cls.query.filter(cls.id.in_(record_ids)).all()
        deleted_count = 0
        
        for record in records:
            if not record.is_deleted:
                record.soft_delete()
                deleted_count += 1
        
        db.session.commit()
        return deleted_count

    @classmethod
    def batch_restore(cls, record_ids: List[int]) -> int:
        """
        Restore multiple soft-deleted records by their IDs.
        
        Args:
            record_ids (List[int]): List of record IDs to restore
            
        Returns:
            int: Number of records successfully restored
            
        Example:
            restored_count = User.batch_restore([user_id1, user_id2])
        """
        records = cls.query.filter(cls.id.in_(record_ids)).all()
        restored_count = 0
        
        for record in records:
            if record.is_deleted:
                record.restore()
                restored_count += 1
        
        db.session.commit()
        return restored_count

    @classmethod
    def count_active(cls) -> int:
        """
        Count active (non-deleted) records.
        
        Returns:
            int: Number of active records
            
        Example:
            active_users = User.count_active()
        """
        return cls.get_active_query().count()

    @classmethod
    def count_deleted(cls) -> int:
        """
        Count soft-deleted records.
        
        Returns:
            int: Number of deleted records
            
        Example:
            deleted_schemes = Scheme.count_deleted()
        """
        return cls.get_deleted_query().count()

    @classmethod
    def count_total(cls) -> int:
        """
        Count all records including soft-deleted ones.
        
        Returns:
            int: Total number of records
            
        Example:
            total = User.count_total()
        """
        return cls.query.count()


class SoftDeleteQueryHelper:
    """
    Helper class for common soft delete query patterns across all models.
    
    Provides utilities for working with soft-deleted records in bulk operations.
    """

    @staticmethod
    def purge_deleted_records(model_class: Type[T], days_old: int = 90) -> int:
        """
        Permanently delete records that have been soft-deleted for more than N days.
        
        This is useful for compliance (e.g., GDPR retention periods) or cleanup.
        WARNING: This operation is irreversible.
        
        Args:
            model_class (Type[T]): Model class to purge from
            days_old (int): Delete records older than this many days (default 90)
            
        Returns:
            int: Number of records permanently deleted
            
        Example:
            # Permanently delete schemes soft-deleted >90 days ago
            purged_count = SoftDeleteQueryHelper.purge_deleted_records(Scheme, days_old=90)
        """
        from datetime import timedelta
        
        cutoff_date = datetime.utcnow() - timedelta(days=days_old)
        old_deleted_records = model_class.query.filter(
            model_class.deleted_at.isnot(None),
            model_class.deleted_at < cutoff_date
        ).all()
        
        for record in old_deleted_records:
            db.session.delete(record)
        
        db.session.commit()
        return len(old_deleted_records)

    @staticmethod
    def export_deleted_records(model_class: Type[T]) -> List[dict]:
        """
        Export all soft-deleted records as dictionaries (for backup/compliance).
        
        Args:
            model_class (Type[T]): Model class to export from
            
        Returns:
            List[dict]: List of deleted records in dict format
            
        Example:
            deleted_schemes = SoftDeleteQueryHelper.export_deleted_records(Scheme)
        """
        deleted_records = model_class.get_deleted_query().all()
        return [record.to_dict() if hasattr(record, 'to_dict') else record.__dict__ 
                for record in deleted_records]

    @staticmethod
    def get_deletion_timeline(model_class: Type[T]) -> dict:
        """
        Get statistics about deletions for a model.
        
        Useful for audit reports and monitoring.
        
        Args:
            model_class (Type[T]): Model class to analyze
            
        Returns:
            dict: Statistics including total, active, deleted counts and deletion timeline
            
        Example:
            timeline = SoftDeleteQueryHelper.get_deletion_timeline(User)
            # Returns: {
            #     'total_records': 100,
            #     'active_records': 95,
            #     'deleted_records': 5,
            #     'deletion_rate': 5.0,
            #     'recent_deletions_7days': 2,
            #     'recent_deletions_30days': 4
            # }
        """
        from datetime import timedelta
        
        total = model_class.count_total()
        active = model_class.count_active()
        deleted = model_class.count_deleted()
        
        now = datetime.utcnow()
        deletions_7_days = model_class.get_deleted_query().filter(
            model_class.deleted_at >= now - timedelta(days=7)
        ).count()
        deletions_30_days = model_class.get_deleted_query().filter(
            model_class.deleted_at >= now - timedelta(days=30)
        ).count()
        
        deletion_rate = (deleted / total * 100) if total > 0 else 0
        
        return {
            'total_records': total,
            'active_records': active,
            'deleted_records': deleted,
            'deletion_rate_percent': round(deletion_rate, 2),
            'recent_deletions_7days': deletions_7_days,
            'recent_deletions_30days': deletions_30_days,
        }
