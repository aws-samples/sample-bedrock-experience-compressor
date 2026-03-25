import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { logout, getUserRoleFromToken, getIdToken } from '../services/auth';
import { TopNavigation } from '@cloudscape-design/components';
import { getTasks } from '../services/tasks';
import { getProposals } from '../services/expert';
import { getInsights, resetDemo, ResetScope } from '../services/manager';

interface Notif { id: string; text: string }

function getRole(pathname: string): string {
  if (pathname.startsWith('/technician')) return 'technician';
  if (pathname.startsWith('/expert')) return 'expert';
  if (pathname.startsWith('/manager')) return 'manager';
  return '';
}

export default function AppHeader() {
  const navigate = useNavigate();
  const location = useLocation();
  const [notifs, setNotifs] = useState<Notif[]>([]);
  const [dismissed, setDismissed] = useState(false);
  const [resetting, setResetting] = useState(false);
  const role = getRole(location.pathname);

  // Decode user info from JWT
  const userRole = getUserRoleFromToken();
  let userName = '';
  try {
    const token = getIdToken();
    if (token) {
      const payload = JSON.parse(atob(token.split('.')[1]));
      userName = payload.name || payload['cognito:username'] || '';
    }
  } catch { /* ignore */ }

  const roleLabel = userRole ? userRole.charAt(0).toUpperCase() + userRole.slice(1) : '';
  const isAdmin = userRole === 'admin';

  const RESET_LABELS: Record<ResetScope, string> = {
    all: 'Reset all demo data? This will wipe and re-seed all DynamoDB tables.',
    tasks: 'Reset tasks? Tasks will be restored to their initial assigned/pending state.',
    proposals: 'Reset proposals? All AI-generated proposals and patterns will be cleared.',
    insights: 'Reset insights? All manager insights will be cleared.',
  };

  const handleReset = async (scope: ResetScope) => {
    if (!confirm(RESET_LABELS[scope])) return;
    setResetting(true);
    try {
      const result = await resetDemo(scope);
      alert(result.message);
      window.location.reload();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      alert(`Reset failed: ${message}`);
    } finally {
      setResetting(false);
    }
  };

  useEffect(() => {
    setDismissed(false);
    const load = async () => {
      try {
        const items: Notif[] = [];
        if (role === 'technician') {
          const tasks = await getTasks();
          const pending = tasks.filter((t: any) => t.status === 'assigned' || t.status === 'pending');
          const inProgress = tasks.filter((t: any) => t.status === 'in-progress');
          if (pending.length) items.push({ id: 'pending', text: `🔴 ${pending.length} task(s) pending` });
          if (inProgress.length) items.push({ id: 'progress', text: `🔧 ${inProgress.length} task(s) in progress` });
          const latest = [...pending, ...inProgress].sort((a: any, b: any) => new Date(b.scheduledDate).getTime() - new Date(a.scheduledDate).getTime())[0];
          if (latest) items.push({ id: 'latest', text: `📋 Latest: ${(latest as any).title || (latest as any).runbookId || 'Task'} — ${(latest as any).status}` });
          if (!items.length) items.push({ id: 'ok', text: '✅ All tasks up to date' });
        } else if (role === 'expert') {
          const proposals = await getProposals();
          if (proposals.length) {
            items.push({ id: 'pending', text: `🤖 ${proposals.length} proposal(s) pending review` });
            const latest = proposals[0] as any;
            items.push({ id: 'latest', text: `📋 Latest: ${latest.title || latest.description?.slice(0, 60) || 'Proposal'}` });
          } else {
            items.push({ id: 'ok', text: '✅ No pending proposals' });
          }
        } else if (role === 'manager') {
          const insights = await getInsights();
          const newOnes = insights.filter((i: any) => i.status === 'new');
          if (newOnes.length) items.push({ id: 'new', text: `📊 ${newOnes.length} new insight(s)` });
          if (insights.length) items.push({ id: 'total', text: `📋 ${insights.length} total insight(s)` });
          const latest = newOnes[0] || insights[0];
          if (latest) items.push({ id: 'latest', text: `💡 Latest: ${(latest as any).description?.slice(0, 60) || 'Insight'}...` });
          if (!items.length) items.push({ id: 'ok', text: '✅ No new insights' });
        }
        setNotifs(items);
      } catch {
        setNotifs([{ id: 'err', text: '⚠️ Could not load notifications' }]);
      }
    };
    if (role) load();
  }, [role]);

  return (
    <>
    <style>{`
      [class*="top-navigation"] [class*="logo"] img {
        max-height: 32px !important;
        width: auto !important;
      }
    `}</style>
    <TopNavigation
      identity={{
        href: '/role-selection',
        title: 'Experience Compressor',
        logo: { src: '/logo.png', alt: 'Experience Compressor Logo' },
      }}
      utilities={[
        {
          type: 'menu-dropdown',
          iconName: 'notification',
          title: 'Notifications',
          ariaLabel: `Notifications (${dismissed ? 0 : notifs.length} unread)`,
          badge: !dismissed && notifs.length > 0 && notifs[0]?.id !== 'ok',
          onItemClick: () => setDismissed(true),
          items: notifs.length ? notifs : [{ id: 'loading', text: '⏳ Loading...' }],
        },
        {
          type: 'menu-dropdown',
          text: userName || 'User',
          description: roleLabel ? `Role: ${roleLabel}` : undefined,
          iconName: 'user-profile',
          items: [
            { id: 'change-role', text: 'Change Role' },
            // Admin sees persona-specific + full reset
            ...(isAdmin && role === 'technician' ? [{ id: 'reset-tasks', text: resetting ? 'Resetting...' : 'Reset Tasks' }] : []),
            ...(isAdmin && role === 'expert' ? [{ id: 'reset-proposals', text: resetting ? 'Resetting...' : 'Reset Proposals' }] : []),
            ...(isAdmin && role === 'manager' ? [{ id: 'reset-insights', text: resetting ? 'Resetting...' : 'Reset Insights' }] : []),
            ...(isAdmin ? [{ id: 'reset-all', text: resetting ? 'Resetting...' : 'Reset Demo (All)' }] : []),
            { id: 'logout', text: 'Logout' },
          ],
          onItemClick: ({ detail }) => {
            if (detail.id === 'change-role') navigate('/role-selection');
            if (detail.id === 'reset-tasks' && !resetting) handleReset('tasks');
            if (detail.id === 'reset-proposals' && !resetting) handleReset('proposals');
            if (detail.id === 'reset-insights' && !resetting) handleReset('insights');
            if (detail.id === 'reset-all' && !resetting) handleReset('all');
            if (detail.id === 'logout') { logout(); navigate('/'); }
          },
        },
      ]}
    />
    </>
  );
}
