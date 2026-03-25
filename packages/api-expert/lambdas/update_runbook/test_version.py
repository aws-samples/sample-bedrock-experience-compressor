"""
Unit tests for update_runbook version increment logic.
"""
import unittest
import os
from unittest.mock import MagicMock, patch

# Mock boto3 before importing the module
mock_dynamodb = MagicMock()
mock_s3 = MagicMock()
mock_bedrock = MagicMock()

with patch.dict('sys.modules', {
    'boto3': MagicMock(
        client=MagicMock(side_effect=lambda svc, **kw: mock_s3 if svc == 's3' else mock_bedrock),
        resource=MagicMock(return_value=mock_dynamodb),
    ),
    'botocore': MagicMock(),
    'botocore.config': MagicMock(),
}):
    os.environ.setdefault('RUNBOOKS_BUCKET', 'test-bucket')
    os.environ.setdefault('RUNBOOKS_METADATA_TABLE', 'test-metadata')
    os.environ.setdefault('PROPOSALS_TABLE', 'test-proposals')
    os.environ.setdefault('PATTERNS_TABLE', 'test-patterns')
    os.environ.setdefault('BEDROCK_MODEL_ID', 'test-model')
    import index


class TestIncrementVersion(unittest.TestCase):
    """Test version increment logic"""

    def test_increment_v_prefix(self):
        self.assertEqual(index.increment_version('v1.0'), 'v1.1')

    def test_increment_v_prefix_higher(self):
        self.assertEqual(index.increment_version('v3.5'), 'v3.6')

    def test_increment_no_prefix(self):
        self.assertEqual(index.increment_version('1.0'), '1.1')

    def test_increment_no_prefix_higher(self):
        self.assertEqual(index.increment_version('2.9'), '2.10')

    def test_increment_invalid_returns_default(self):
        self.assertEqual(index.increment_version('invalid'), 'v1.1')

    def test_increment_empty_returns_default(self):
        self.assertEqual(index.increment_version(''), 'v1.1')


class TestLambdaHandlerValidation(unittest.TestCase):
    """Test lambda_handler input validation"""

    def test_missing_proposal_id(self):
        result = index.lambda_handler({}, None)
        self.assertEqual(result['statusCode'], 400)

    def test_proposal_not_found(self):
        mock_table = MagicMock()
        mock_table.get_item.return_value = {}
        mock_dynamodb.Table.return_value = mock_table

        result = index.lambda_handler({'proposalId': 'nonexistent'}, None)
        self.assertEqual(result['statusCode'], 404)

    def test_proposal_not_approved(self):
        mock_table = MagicMock()
        mock_table.get_item.return_value = {'Item': {'status': 'pending', 'runbookId': 'RB-001', 'procedureCode': 'P-001'}}
        mock_dynamodb.Table.return_value = mock_table

        result = index.lambda_handler({'proposalId': 'test-proposal'}, None)
        self.assertEqual(result['statusCode'], 400)


if __name__ == '__main__':
    unittest.main()
