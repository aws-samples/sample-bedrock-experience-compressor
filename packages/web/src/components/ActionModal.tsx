import { Modal, Box, SpaceBetween, Button } from '@cloudscape-design/components';
import type { Insight, ActionType } from '../types';

interface Props {
  visible: boolean;
  insight: Insight | null;
  actionType: ActionType | null;
  onDismiss: () => void;
  onConfirm: () => void;
}

export default function ActionModal({ visible, insight, actionType, onDismiss, onConfirm }: Props) {
  return (
    <Modal
      visible={visible}
      onDismiss={onDismiss}
      header={`Take Action: ${actionType}`}
      footer={
        <Box float="right">
          <SpaceBetween direction="horizontal" size="xs">
            <Button variant="link" onClick={onDismiss}>Cancel</Button>
            <Button variant="primary" onClick={onConfirm}>Confirm</Button>
          </SpaceBetween>
        </Box>
      }
    >
      <Box>
        Action for insight: {insight?.title}
      </Box>
    </Modal>
  );
}
