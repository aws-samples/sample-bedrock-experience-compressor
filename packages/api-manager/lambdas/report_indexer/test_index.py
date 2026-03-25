"""
Unit tests for Report Indexer Lambda
Tests metadata extraction and DynamoDB write operations

Note: boto3 is initialized at module level (AWS best practice), so we mock it before import
"""
import unittest
import os
import sys
from unittest.mock import Mock, MagicMock, patch

# Mock boto3 BEFORE importing index module
mock_dynamodb = MagicMock()
mock_table = MagicMock()
mock_dynamodb.Table.return_value = mock_table

with patch.dict('sys.modules', {'boto3': MagicMock(resource=MagicMock(return_value=mock_dynamodb))}):
    # Set environment variable before import
    os.environ['REPORTS_INDEX_TABLE'] = 'test-reports-index'
    import index


class TestReportIndexer(unittest.TestCase):
    """Test cases for Report Indexer Lambda"""

    def setUp(self):
        """Set up test environment"""
        os.environ['REPORTS_INDEX_TABLE'] = 'test-reports-index'
        # Reset mock for each test
        mock_table.reset_mock()

    def test_extract_metadata_valid_key(self):
        """Test metadata extraction from valid S3 key"""
        s3_key = "reports/RB-001/2026-01-28/report-rcp-a-001.md"
        metadata = index.extract_metadata_from_s3_key(s3_key)

        self.assertIsNotNone(metadata)
        self.assertEqual(metadata['report_id'], 'report-rcp-a-001')
        self.assertEqual(metadata['s3_key'], s3_key)
        self.assertEqual(metadata['created_at'], '2026-01-28T00:00:00')
        self.assertEqual(metadata['runbook_id'], 'RB-001')

    def test_extract_metadata_different_runbook(self):
        """Test metadata extraction with different runbook ID"""
        s3_key = "reports/RB-VLV-003/2026-01-29/report-vlv-003-001.md"
        metadata = index.extract_metadata_from_s3_key(s3_key)

        self.assertIsNotNone(metadata)
        self.assertEqual(metadata['report_id'], 'report-vlv-003-001')
        self.assertEqual(metadata['runbook_id'], 'RB-VLV-003')
        self.assertEqual(metadata['created_at'], '2026-01-29T00:00:00')

    def test_extract_metadata_invalid_key_too_short(self):
        """Test metadata extraction with invalid S3 key (too few parts)"""
        s3_key = "reports/RB-001/report.md"
        metadata = index.extract_metadata_from_s3_key(s3_key)

        self.assertIsNone(metadata)

    def test_extract_metadata_missing_reports_prefix(self):
        """Test metadata extraction with missing reports/ prefix"""
        s3_key = "RB-001/2026-01-28/report.md"
        metadata = index.extract_metadata_from_s3_key(s3_key)

        self.assertIsNone(metadata)

    def test_extract_metadata_invalid_date_format(self):
        """Test metadata extraction with invalid date format"""
        s3_key = "reports/RB-001/2026-13-45/report.md"
        metadata = index.extract_metadata_from_s3_key(s3_key)

        self.assertIsNone(metadata)

    def test_write_to_reports_index_table(self):
        """Test writing metadata to DynamoDB table"""
        metadata = {
            'report_id': 'report-test-001',
            's3_key': 'RB-001/2026-01-28/report-test-001.md',
            'created_at': '2026-01-28T00:00:00',
            'runbook_id': 'RB-001',
        }
        
        index.write_to_reports_index_table(metadata)
        
        mock_table.put_item.assert_called_once_with(
            Item={
                'reportId': 'report-test-001',
                's3Key': 'RB-001/2026-01-28/report-test-001.md',
                'createdAt': '2026-01-28T00:00:00',
                'runbookId': 'RB-001',
            }
        )

    def test_write_to_reports_index_table_error(self):
        """Test error handling when writing to DynamoDB fails"""
        mock_table.put_item.side_effect = Exception("DynamoDB error")
        
        metadata = {
            'report_id': 'report-test-001',
            's3_key': 'RB-001/2026-01-28/report-test-001.md',
            'created_at': '2026-01-28T00:00:00',
            'runbook_id': 'RB-001',
        }
        
        with self.assertRaises(Exception):
            index.write_to_reports_index_table(metadata)
        
        # Reset side effect for other tests
        mock_table.put_item.side_effect = None

    def test_lambda_handler_success(self):
        """Test lambda handler with valid S3 event"""
        # Mock the functions directly on the already-imported module
        original_extract = index.extract_metadata_from_s3_key
        original_write = index.write_to_reports_index_table
        
        try:
            mock_extract = Mock(return_value={
                'report_id': 'report-test-001',
                's3_key': 'RB-001/2026-01-28/report-test-001.md',
                'created_at': '2026-01-28T00:00:00',
                'runbook_id': 'RB-001',
            })
            mock_write = Mock()
            
            index.extract_metadata_from_s3_key = mock_extract
            index.write_to_reports_index_table = mock_write
            
            event = {
                'Records': [
                    {
                        's3': {
                            'bucket': {'name': 'test-bucket'},
                            'object': {'key': 'RB-001/2026-01-28/report-test-001.md'}
                        }
                    }
                ]
            }
            
            index.lambda_handler(event, None)
            
            mock_extract.assert_called_once_with('RB-001/2026-01-28/report-test-001.md')
            mock_write.assert_called_once()
        finally:
            # Restore original functions
            index.extract_metadata_from_s3_key = original_extract
            index.write_to_reports_index_table = original_write

    def test_lambda_handler_invalid_key(self):
        """Test lambda handler skips invalid S3 keys"""
        original_extract = index.extract_metadata_from_s3_key
        original_write = index.write_to_reports_index_table
        
        try:
            mock_extract = Mock(return_value=None)
            mock_write = Mock()
            
            index.extract_metadata_from_s3_key = mock_extract
            index.write_to_reports_index_table = mock_write
            
            event = {
                'Records': [
                    {
                        's3': {
                            'bucket': {'name': 'test-bucket'},
                            'object': {'key': 'invalid/key.md'}
                        }
                    }
                ]
            }
            
            index.lambda_handler(event, None)
            
            mock_extract.assert_called_once()
            mock_write.assert_not_called()
        finally:
            index.extract_metadata_from_s3_key = original_extract
            index.write_to_reports_index_table = original_write

    def test_lambda_handler_multiple_records(self):
        """Test lambda handler processes multiple S3 records"""
        original_extract = index.extract_metadata_from_s3_key
        original_write = index.write_to_reports_index_table
        
        try:
            mock_extract = Mock(side_effect=[
                {
                    'report_id': 'report-test-001',
                    's3_key': 'RB-001/2026-01-28/report-test-001.md',
                    'created_at': '2026-01-28T00:00:00',
                    'runbook_id': 'RB-001',
                },
                {
                    'report_id': 'report-test-002',
                    's3_key': 'RB-002/2026-01-28/report-test-002.md',
                    'created_at': '2026-01-28T00:00:00',
                    'runbook_id': 'RB-002',
                }
            ])
            mock_write = Mock()
            
            index.extract_metadata_from_s3_key = mock_extract
            index.write_to_reports_index_table = mock_write
            
            event = {
                'Records': [
                    {
                        's3': {
                            'bucket': {'name': 'test-bucket'},
                            'object': {'key': 'RB-001/2026-01-28/report-test-001.md'}
                        }
                    },
                    {
                        's3': {
                            'bucket': {'name': 'test-bucket'},
                            'object': {'key': 'RB-002/2026-01-28/report-test-002.md'}
                        }
                    }
                ]
            }
            
            index.lambda_handler(event, None)
            
            self.assertEqual(mock_extract.call_count, 2)
            self.assertEqual(mock_write.call_count, 2)
        finally:
            index.extract_metadata_from_s3_key = original_extract
            index.write_to_reports_index_table = original_write

    def test_lambda_handler_url_encoded_key(self):
        """Test lambda handler handles URL-encoded S3 keys"""
        original_extract = index.extract_metadata_from_s3_key
        original_write = index.write_to_reports_index_table
        
        try:
            mock_extract = Mock(return_value={
                'report_id': 'report-test-001',
                's3_key': 'RB-001/2026-01-28/report-test-001.md',
                'created_at': '2026-01-28T00:00:00',
                'runbook_id': 'RB-001',
            })
            mock_write = Mock()
            
            index.extract_metadata_from_s3_key = mock_extract
            index.write_to_reports_index_table = mock_write
            
            event = {
                'Records': [
                    {
                        's3': {
                            'bucket': {'name': 'test-bucket'},
                            'object': {'key': 'RB-001%2F2026-01-28%2Freport-test-001.md'}
                        }
                    }
                ]
            }
            
            index.lambda_handler(event, None)
            
            # Verify URL decoding happened
            mock_extract.assert_called_once_with('RB-001/2026-01-28/report-test-001.md')
        finally:
            index.extract_metadata_from_s3_key = original_extract
            index.write_to_reports_index_table = original_write


if __name__ == '__main__':
    unittest.main()
