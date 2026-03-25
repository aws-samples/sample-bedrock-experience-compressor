import { Table, Box, SpaceBetween, Badge } from '@cloudscape-design/components';
import type { Insight } from '../types';

interface Props {
  insights: Insight[];
  onViewDetails: (insight: Insight) => void;
}

export default function InsightsTable({ insights, onViewDetails }: Props) {
  return (
    <Table
      columnDefinitions={[
        {
          id: 'title',
          header: 'Title',
          cell: (item: Insight) => item.title,
        },
        {
          id: 'severity',
          header: 'Severity',
          cell: (item: Insight) => (
            <Badge color={item.severity === 'high' ? 'red' : item.severity === 'medium' ? 'blue' : 'grey'}>
              {item.severity}
            </Badge>
          ),
        },
        {
          id: 'status',
          header: 'Status',
          cell: (item: Insight) => item.status,
        },
        {
          id: 'actions',
          header: 'Actions',
          cell: (item: Insight) => (
            <SpaceBetween direction="horizontal" size="xs">
              <a href="#" onClick={(e) => { e.preventDefault(); onViewDetails(item); }}>
                View Details
              </a>
            </SpaceBetween>
          ),
        },
      ]}
      items={insights}
      empty={
        <Box textAlign="center" color="inherit">
          <b>No insights</b>
          <Box padding={{ bottom: 's' }} variant="p" color="inherit">
            No insights to display.
          </Box>
        </Box>
      }
    />
  );
}
