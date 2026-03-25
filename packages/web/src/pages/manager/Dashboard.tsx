import { Container, Header, SpaceBetween, Box, Button, Flashbar, ColumnLayout, Input, Select, Table, StatusIndicator, Badge, ExpandableSection, Pagination, CollectionPreferences } from '@cloudscape-design/components';
import { useCollection } from '@cloudscape-design/collection-hooks';
import { useState, useEffect, useMemo } from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ComposedChart, Line } from 'recharts';
import { triggerAnalysis, getInsights, updateInsight, getRunbookMetrics, getTeamMetrics, getReportMetrics, getMonthlyPlanning } from '../../services/manager';
import type { ReportMetrics, MonthlyPlanningData } from '../../services/manager';
import AppHeader from '../../components/AppHeader';
import Chatbot from '../../components/Chatbot';

const COLORS = ['#3B82F6', '#EF4444', '#F59E0B', '#8B5CF6', '#EC4899', '#06B6D4', '#F97316', '#6366F1'];
const RATING_COLORS = ['#EF4444', '#F97316', '#F59E0B', '#84CC16', '#22C55E'];

// CSS tooltip component
const tipStyles = `
.tip { position: relative; }
.tip .tip-text {
  visibility: hidden; opacity: 0; position: absolute; z-index: 1000;
  bottom: calc(100% + 8px); left: 50%; transform: translateX(-50%);
  background: #1F2937; color: #fff; padding: 8px 12px; border-radius: 6px;
  font-size: 12px; line-height: 1.4; white-space: pre-line; width: max-content; max-width: 320px;
  pointer-events: none; transition: opacity 0.15s;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
}
.tip .tip-text::after {
  content: ''; position: absolute; top: 100%; left: 50%; transform: translateX(-50%);
  border: 5px solid transparent; border-top-color: #1F2937;
}
.tip:hover .tip-text { visibility: visible; opacity: 1; }
.tip-bottom .tip-text { bottom: auto; top: calc(100% + 8px); }
.tip-bottom .tip-text::after { top: auto; bottom: 100%; border-top-color: transparent; border-bottom-color: #1F2937; }
`;

const Tip = ({ text, children, bottom, block }: { text: string; children: React.ReactNode; bottom?: boolean; block?: boolean }) => (
  <span className={`tip${bottom ? ' tip-bottom' : ''}`} style={{ display: 'inline-block', width: block !== false ? '100%' : undefined }}>
    {children}
    <span className="tip-text">{text}</span>
  </span>
);

export default function Dashboard() {
  const [analyzing, setAnalyzing] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [flashbarItems, setFlashbarItems] = useState<any[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [insights, setInsights] = useState<any[]>([]);
  const [loadingInsights, setLoadingInsights] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [typeFilter, setTypeFilter] = useState<any>({ value: 'all', label: 'All Types' });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [statusFilter, setStatusFilter] = useState<any>({ value: 'all', label: 'All Status' });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [categoryFilter, setCategoryFilter] = useState<any>({ value: 'all', label: 'All Categories' });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [rbMetrics, setRbMetrics] = useState<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [teamMetrics, setTeamMetrics] = useState<any[]>([]);
  const [pageSize, setPageSize] = useState(10);
  const [reportMetrics, setReportMetrics] = useState<ReportMetrics | null>(null);
  const [monthlyPlanning, setMonthlyPlanning] = useState<MonthlyPlanningData | null>(null);
  const [planningMonth, setPlanningMonth] = useState('');

  useEffect(() => { loadInsights(); loadMetrics(); }, []);

  const loadMetrics = async () => {
    try { setRbMetrics(await getRunbookMetrics()); } catch (e) { console.error('Failed to load runbook metrics', e); }
    try { setTeamMetrics(await getTeamMetrics() || []); } catch (e) { console.error('Failed to load team metrics', e); }
    try { setReportMetrics(await getReportMetrics()); } catch (e) { console.error('Failed to load report metrics', e); }
    try {
      const now = new Date();
      const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      setPlanningMonth(month);
      setMonthlyPlanning(await getMonthlyPlanning(month));
    } catch (e) { console.error('Failed to load monthly planning', e); }
  };

  const shiftMonth = (offset: number) => {
    const [y, m] = planningMonth.split('-').map(Number);
    const d = new Date(y, m - 1 + offset, 1);
    const newMonth = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    setPlanningMonth(newMonth);
    getMonthlyPlanning(newMonth).then(setMonthlyPlanning).catch(console.error);
  };

  const loadInsights = async () => {
    setLoadingInsights(true);
    try { setInsights(await getInsights() || []); }
    catch (error: unknown) { const msg = error instanceof Error ? error.message : 'Unknown error'; setFlashbarItems([{ type: 'error', content: `Failed to load insights: ${msg}`, dismissible: true, onDismiss: () => setFlashbarItems([]) }]); }
    finally { setLoadingInsights(false); }
  };

  const handleTriggerAnalysis = async () => {
    setAnalyzing(true); setFlashbarItems([]);
    try {
      await triggerAnalysis();
      setFlashbarItems([{ type: 'success', content: 'Analysis started. Refresh in a few minutes.', dismissible: true, onDismiss: () => setFlashbarItems([]) }]);
      setTimeout(() => loadInsights(), 5000);
    } catch (error: unknown) { const msg = error instanceof Error ? error.message : 'Unknown error'; setFlashbarItems([{ type: 'error', content: `Failed: ${msg}`, dismissible: true, onDismiss: () => setFlashbarItems([]) }]); }
    finally { setAnalyzing(false); }
  };

  const handleAcknowledge = async (insightId: string) => {
    try {
      await updateInsight(insightId, { action: 'accept' });
      await loadInsights();
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Unknown error';
      setFlashbarItems([{ type: 'error', content: `Failed to acknowledge: ${msg}`, dismissible: true, onDismiss: () => setFlashbarItems([]) }]);
    }
  };

  const filtered = insights
    .filter((i: any) => !searchQuery || i.description?.toLowerCase().includes(searchQuery.toLowerCase()) || i.recommendedAction?.toLowerCase().includes(searchQuery.toLowerCase()))
    .filter((i: any) => typeFilter.value === 'all' || i.issueType === typeFilter.value)
    .filter((i: any) => statusFilter.value === 'all' || i.status === statusFilter.value)
    .filter((i: any) => categoryFilter.value === 'all' || i.category === categoryFilter.value);

  const { items, collectionProps, paginationProps } = useCollection(filtered, {
    sorting: { defaultState: { sortingColumn: { sortingField: 'frequency' }, isDescending: true } },
    pagination: { pageSize },
  });

  const newCount = insights.filter((i: any) => i.status === 'new').length;
  const ackCount = insights.filter((i: any) => i.status !== 'new').length;

  // Insight chart data
  const pieData = Object.entries(
    insights.reduce((acc: any, i: any) => { const k = (i.issueType || 'other').charAt(0).toUpperCase() + (i.issueType || 'other').slice(1); acc[k] = (acc[k] || 0) + 1; return acc; }, {})
  ).map(([name, value]) => ({ name, value }));



  // Delay reasons chart data (from reportMetrics)
  const delayReasonsData = useMemo(() => {
    if (!reportMetrics?.delayReasons) return [];
    return Object.entries(reportMetrics.delayReasons)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 6)
      .map(([name, value]) => ({ name: name.length > 30 ? name.slice(0, 27) + '...' : name, value }));
  }, [reportMetrics]);

  // Rating distribution chart data
  const ratingData = useMemo(() => {
    if (!reportMetrics?.ratingDistribution) return [];
    return [1, 2, 3, 4, 5].map(r => ({
      rating: `${r} star${r > 1 ? 's' : ''}`,
      count: reportMetrics.ratingDistribution[String(r)] || 0,
    }));
  }, [reportMetrics]);

  // Monthly planning calendar helpers
  const calendarData = useMemo(() => {
    if (!monthlyPlanning) return null;
    const [y, m] = planningMonth.split('-').map(Number);
    const firstDay = new Date(y, m - 1, 1).getDay(); // 0=Sun
    const daysInMonth = monthlyPlanning.daysInMonth;
    // Shift so Monday=0
    const startOffset = firstDay === 0 ? 6 : firstDay - 1;
    return { year: y, month: m, startOffset, daysInMonth };
  }, [monthlyPlanning, planningMonth]);

  const isWeekend = (day: number) => {
    if (!calendarData) return false;
    const d = new Date(calendarData.year, calendarData.month - 1, day);
    return d.getDay() === 0 || d.getDay() === 6;
  };

  const getTasksForDay = (techId: string, day: number) => {
    if (!monthlyPlanning) return [];
    const dateStr = `${planningMonth}-${String(day).padStart(2, '0')}`;
    const tech = monthlyPlanning.technicians.find(t => t.technicianId === techId);
    if (!tech) return [];
    return tech.tasks.filter(t => t.scheduledDate.slice(0, 10) === dateStr);
  };

  const monthLabel = planningMonth ? new Date(Number(planningMonth.split('-')[0]), Number(planningMonth.split('-')[1]) - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : '';

  return (
    <>
      <style>{tipStyles}</style>
      <AppHeader />
      <SpaceBetween size="l">
        <Flashbar items={flashbarItems} />
        <Container
          header={
            <Header variant="h1" actions={
              <SpaceBetween direction="horizontal" size="xs">
                <Button onClick={loadInsights} iconName="refresh" disabled={loadingInsights}>Refresh</Button>
                <Button variant="primary" loading={analyzing} onClick={handleTriggerAnalysis}>Trigger Analysis</Button>
              </SpaceBetween>
            }>Manager Dashboard</Header>
          }
        >
          <SpaceBetween size="l">
            {/* A. Runbook & Procedure Updates */}
            {rbMetrics && (
              <Container header={<Header variant="h3">Runbook & Procedure Updates</Header>}>
                <ColumnLayout columns={4} variant="text-grid">
                  <div style={{ padding: '16px', backgroundColor: '#DBEAFE', border: '2px solid #93C5FD', borderRadius: '8px', textAlign: 'center' }}>
                    <Box fontSize="heading-xl" fontWeight="bold">{rbMetrics.totalProposals}</Box>
                    <Box fontSize="body-s" fontWeight="bold">Total Proposals</Box>
                  </div>
                  <div style={{ padding: '16px', backgroundColor: '#FEF3C7', border: '2px solid #FCD34D', borderRadius: '8px', textAlign: 'center' }}>
                    <Box fontSize="heading-xl" fontWeight="bold">{rbMetrics.pendingCount}</Box>
                    <Box fontSize="body-s" fontWeight="bold">Pending Review</Box>
                  </div>
                  <div style={{ padding: '16px', backgroundColor: '#D1FAE5', border: '2px solid #6EE7B7', borderRadius: '8px', textAlign: 'center' }}>
                    <Box fontSize="heading-xl" fontWeight="bold">{rbMetrics.approvedCount}</Box>
                    <Box fontSize="body-s" fontWeight="bold">Approved & Applied</Box>
                  </div>
                  <div style={{ padding: '16px', backgroundColor: '#EDE9FE', border: '2px solid #C4B5FD', borderRadius: '8px', textAlign: 'center' }}>
                    <Box fontSize="heading-xl" fontWeight="bold">{rbMetrics.totalTimeSavedMinutes} min</Box>
                    <Box fontSize="body-s" fontWeight="bold">Time Saved</Box>
                  </div>
                </ColumnLayout>
              </Container>
            )}

            {/* Estimated Savings */}
            {rbMetrics && reportMetrics && rbMetrics.approvedCount > 0 && (() => {
              const timeSavedMin = rbMetrics.totalTimeSavedMinutes || 0;
              const avgSavedPerProc = Math.round(timeSavedMin / rbMetrics.approvedCount);
              const pilotTechs = teamMetrics.length || 2;
              // Fleet projection with realistic industry numbers
              const fleetSize = 50;
              const interventionsPerTechMonth = 15; // nuclear maintenance industry avg
              const fleetAnnualInterventions = fleetSize * interventionsPerTechMonth * 12;
              const runbookCoverage = 0.3;
              const fleetAnnualMinSaved = fleetAnnualInterventions * avgSavedPerProc * runbookCoverage;
              const hourlyRate = 65; // $/h nuclear technician
              const laborSavings = Math.round((fleetAnnualMinSaved / 60) * hourlyRate);
              // Downtime avoidance: better runbooks reduce procedure errors → fewer unplanned outages
              // A nuclear reactor unplanned outage costs ~$1.5M/day (lost generation at ~1GW × $60/MWh)
              const downtimeCostPerDay = 1_500_000;
              const avoidedDaysPerYear = 0.5; // conservative: half a day avoided per year
              const downtimeSavings = Math.round(downtimeCostPerDay * avoidedDaysPerYear);

              return (
                <Container header={<Header variant="h3">Estimated Savings</Header>}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
                    <Tip text={`${rbMetrics.approvedCount} runbooks optimized\navg ${avgSavedPerProc} min saved per procedure\n${pilotTechs} technicians in pilot`} bottom>
                      <div style={{ padding: '20px', backgroundColor: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: '8px', cursor: 'default' }}>
                        <Box fontSize="body-s" fontWeight="bold" color="text-body-secondary" margin={{ bottom: 's' }}>PILOT — {pilotTechs} technicians</Box>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                          <span style={{ fontSize: '32px', fontWeight: 'bold', color: '#059669' }}>{timeSavedMin}</span>
                          <span style={{ fontSize: '16px', color: '#6B7280' }}>min saved</span>
                        </div>
                      </div>
                    </Tip>
                    <Tip text={`${Math.round(fleetAnnualMinSaved / 60).toLocaleString()}h saved/year\n${interventionsPerTechMonth} interventions/tech/month\n$${hourlyRate}/h technician cost\n30% runbook coverage`} bottom>
                      <div style={{ padding: '20px', backgroundColor: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: '8px', cursor: 'default' }}>
                        <Box fontSize="body-s" fontWeight="bold" color="text-body-secondary" margin={{ bottom: 's' }}>LABOR — {fleetSize} technicians</Box>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                          <span style={{ fontSize: '32px', fontWeight: 'bold', color: '#1D4ED8' }}>${laborSavings.toLocaleString()}</span>
                          <span style={{ fontSize: '16px', color: '#6B7280' }}>/year</span>
                        </div>
                      </div>
                    </Tip>
                    <Tip text={`Fewer procedure errors\n→ ${avoidedDaysPerYear} day less unplanned outage/year\nReactor downtime ≈ $1.5M/day\n(lost generation ~1GW × $60/MWh)`} bottom>
                      <div style={{ padding: '20px', backgroundColor: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '8px', cursor: 'default' }}>
                        <Box fontSize="body-s" fontWeight="bold" color="text-body-secondary" margin={{ bottom: 's' }}>DOWNTIME AVOIDANCE</Box>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                          <span style={{ fontSize: '32px', fontWeight: 'bold', color: '#DC2626' }}>${(downtimeSavings / 1000).toLocaleString()}K</span>
                          <span style={{ fontSize: '16px', color: '#6B7280' }}>/year</span>
                        </div>
                      </div>
                    </Tip>
                  </div>
                </Container>
              );
            })()}

            {/* B. Operations Analytics (replaces Business Impact) */}
            {reportMetrics && reportMetrics.monthlyTrend.length > 0 && (() => {
              const trend = reportMetrics.monthlyTrend;
              const firstRate = trend[0]?.delayRate;
              const lastRate = trend[trend.length - 1]?.delayRate;
              const trendText = firstRate != null && lastRate != null && firstRate > lastRate
                ? `Delay rate trending down: ${firstRate}% → ${lastRate}%`
                : `${reportMetrics.delayRate}% with delays`;
              return (
              <Container header={<Header variant="h3" info={<Tip text={`${reportMetrics.totalReports} reports analyzed\n${trendText}\navg runbook rating ${reportMetrics.avgRating}/5`} block={false}><span style={{ cursor: 'default', fontSize: '12px', color: '#6B7280' }}>ⓘ</span></Tip>}>Operations Analytics</Header>}>
                <ColumnLayout columns={2}>
                  <div>
                    <Box variant="h4" padding={{ bottom: 'xs' }}>Monthly Interventions & Delay Rate</Box>
                    <ResponsiveContainer width="100%" height={280}>
                      <ComposedChart data={reportMetrics.monthlyTrend} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" fontSize={12} />
                        <YAxis yAxisId="left" fontSize={12} />
                        <YAxis yAxisId="right" orientation="right" fontSize={12} unit="%" domain={[0, 100]} />
                        <Tooltip contentStyle={{ fontSize: 13 }} />
                        <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                        <Bar yAxisId="left" dataKey="interventions" fill="#3B82F6" name="Interventions" radius={[4, 4, 0, 0]} />
                        <Bar yAxisId="left" dataKey="delays" fill="#F59E0B" name="Delays" radius={[4, 4, 0, 0]} />
                        <Line yAxisId="right" type="monotone" dataKey="delayRate" stroke="#EF4444" strokeWidth={2} name="Delay Rate %" dot={{ r: 4 }} />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                  <div>
                    <Box variant="h4" padding={{ bottom: 'xs' }}>Estimated vs Actual Duration (min)</Box>
                    <ResponsiveContainer width="100%" height={280}>
                      <BarChart data={reportMetrics.monthlyTrend} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" fontSize={12} />
                        <YAxis fontSize={12} unit="min" />
                        <Tooltip contentStyle={{ fontSize: 13 }} />
                        <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                        <Bar dataKey="avgEstimated" fill="#93C5FD" name="Estimated" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="avgDuration" fill="#3B82F6" name="Actual" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </ColumnLayout>
              </Container>
              );
            })()}

            {/* C. Operations Health */}
            {reportMetrics && (delayReasonsData.length > 0 || ratingData.length > 0) && (
              <Container header={<Header variant="h3">Operations Health</Header>}>
                <ColumnLayout columns={2}>
                  {delayReasonsData.length > 0 && (
                    <div>
                      <Box variant="h4" padding={{ bottom: 'xs' }}>Delay Causes (top 6)</Box>
                      <ResponsiveContainer width="100%" height={280}>
                        <BarChart data={delayReasonsData} layout="vertical" margin={{ top: 5, right: 30, bottom: 5, left: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis type="number" fontSize={12} />
                          <YAxis dataKey="name" type="category" width={160} fontSize={11} tick={{ fill: '#333' }} />
                          <Tooltip contentStyle={{ fontSize: 13 }} />
                          <Bar dataKey="value" name="Reports" radius={[0, 4, 4, 0]}>
                            {delayReasonsData.map((_: any, idx: number) => <Cell key={idx} fill={COLORS[idx % COLORS.length]} />)}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                  {ratingData.length > 0 && (
                    <div>
                      <Box variant="h4" padding={{ bottom: 'xs' }}>Runbook Ratings Distribution</Box>
                      <ResponsiveContainer width="100%" height={280}>
                        <BarChart data={ratingData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="rating" fontSize={12} />
                          <YAxis fontSize={12} allowDecimals={false} />
                          <Tooltip contentStyle={{ fontSize: 13 }} />
                          <Bar dataKey="count" name="Reports" radius={[4, 4, 0, 0]}>
                            {ratingData.map((_: any, idx: number) => <Cell key={idx} fill={RATING_COLORS[idx]} />)}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </ColumnLayout>
              </Container>
            )}

            {/* D. Monthly Planning (replaces Weekly Planning) */}
            {monthlyPlanning && calendarData && (
              <Container header={
                <Header variant="h3" actions={
                  <SpaceBetween direction="horizontal" size="xs">
                    <Button iconName="angle-left" variant="icon" onClick={() => shiftMonth(-1)} />
                    <Box fontWeight="bold" fontSize="heading-s" padding={{ top: 'xxs' }}>{monthLabel}</Box>
                    <Button iconName="angle-right" variant="icon" onClick={() => shiftMonth(1)} />
                  </SpaceBetween>
                }>Technician Monthly Planning</Header>
              }>
                {monthlyPlanning.technicians.filter(t => t.tasks.length > 0).length === 0 ? (
                  <Box textAlign="center" color="text-body-secondary">No tasks scheduled this month</Box>
                ) : (
                  <div style={{ overflowX: 'auto', overflowY: 'visible', position: 'relative' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: `140px repeat(${calendarData.daysInMonth}, minmax(32px, 1fr))`, gap: '1px', fontSize: '11px', minWidth: `${140 + calendarData.daysInMonth * 34}px`, overflow: 'visible' }}>
                      {/* Header row: days */}
                      <div style={{ padding: '4px 6px', fontWeight: 'bold', backgroundColor: '#f8f9fa', borderBottom: '2px solid #dee2e6' }}></div>
                      {Array.from({ length: calendarData.daysInMonth }, (_, i) => i + 1).map(day => (
                        <div key={day} style={{
                          padding: '4px 2px', textAlign: 'center', fontWeight: 'bold',
                          backgroundColor: isWeekend(day) ? '#f1f3f5' : '#f8f9fa',
                          borderBottom: '2px solid #dee2e6', color: isWeekend(day) ? '#adb5bd' : '#333',
                        }}>
                          {day}
                        </div>
                      ))}

                      {/* Technician rows */}
                      {monthlyPlanning.technicians.filter(t => t.tasks.length > 0).map(tech => (
                        <>
                          <div key={tech.technicianId} style={{ padding: '6px', fontWeight: 'bold', backgroundColor: '#fff', borderBottom: '1px solid #eee', display: 'flex', alignItems: 'center' }}>
                            {tech.name}
                          </div>
                          {Array.from({ length: calendarData.daysInMonth }, (_, i) => i + 1).map(day => {
                            const tasks = getTasksForDay(tech.technicianId, day);
                            return (
                              <div key={`${tech.technicianId}-${day}`} style={{
                                padding: '2px', backgroundColor: isWeekend(day) ? '#f8f9fa' : '#fff',
                                borderBottom: '1px solid #eee', minHeight: '28px', position: 'relative',
                              }}>
                                {tasks.map(t => (
                                  <Tip key={t.taskId} text={`${t.title}\n${t.location}\nDuration: ${t.estimatedDuration}min\nPriority: ${t.priority} — Status: ${t.status}`} bottom block={false}>
                                    <div style={{
                                      fontSize: '9px', padding: '1px 3px', borderRadius: '3px', marginBottom: '1px',
                                      whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', cursor: 'default',
                                      backgroundColor: t.priority === 'high' ? '#FEE2E2' : t.priority === 'medium' ? '#DBEAFE' : '#F3F4F6',
                                      color: t.priority === 'high' ? '#991B1B' : t.priority === 'medium' ? '#1E40AF' : '#374151',
                                      border: `1px solid ${t.priority === 'high' ? '#FECACA' : t.priority === 'medium' ? '#BFDBFE' : '#E5E7EB'}`,
                                      opacity: t.status === 'completed' ? 0.6 : 1,
                                    }}>
                                      {t.status === 'completed' && <span>&#10003; </span>}{t.title.slice(0, 12)}
                                    </div>
                                  </Tip>
                                ))}
                              </div>
                            );
                          })}
                        </>
                      ))}
                    </div>
                    <Box padding={{ top: 'xs' }} fontSize="body-s" color="text-body-secondary">
                      <span style={{ display: 'inline-block', width: 12, height: 12, backgroundColor: '#FEE2E2', border: '1px solid #FECACA', borderRadius: 2, marginRight: 4, verticalAlign: 'middle' }}></span> High
                      <span style={{ display: 'inline-block', width: 12, height: 12, backgroundColor: '#DBEAFE', border: '1px solid #BFDBFE', borderRadius: 2, marginRight: 4, marginLeft: 12, verticalAlign: 'middle' }}></span> Medium
                      <span style={{ display: 'inline-block', width: 12, height: 12, backgroundColor: '#F3F4F6', border: '1px solid #E5E7EB', borderRadius: 2, marginRight: 4, marginLeft: 12, verticalAlign: 'middle' }}></span> Low
                      <span style={{ marginLeft: 12, opacity: 0.6 }}>&#10003; Completed</span>
                    </Box>
                  </div>
                )}
              </Container>
            )}

            {/* E. Team Performance */}
            {teamMetrics.length > 0 && (
              <Container header={<Header variant="h3">Team Performance</Header>}>
                <Table
                  columnDefinitions={[
                    { id: 'name', header: 'Technician', cell: (t: any) => <Box fontWeight="bold">{t.name}</Box> },
                    { id: 'location', header: 'Location', cell: (t: any) => t.location, width: 120 },
                    { id: 'total', header: 'Tasks', cell: (t: any) => t.totalTasks, width: 80 },
                    { id: 'completed', header: 'Completed', cell: (t: any) => t.completedTasks, width: 100 },
                    { id: 'inProgress', header: 'In Progress', cell: (t: any) => t.inProgressTasks, width: 100 },
                    { id: 'reports', header: 'Reports', cell: (t: any) => t.reportsSubmitted, width: 80 },
                    { id: 'rate', header: 'Completion', cell: (t: any) => <StatusIndicator type={t.completionRate >= 80 ? 'success' : t.completionRate >= 50 ? 'warning' : 'error'}>{t.completionRate}%</StatusIndicator>, width: 120 },
                  ]}
                  items={teamMetrics}
                  empty={<Box textAlign="center">No technicians found</Box>}
                />
              </Container>
            )}

            {/* F. Insights (charts + filters + table) */}
            <Container header={<Header variant="h3">Insights</Header>}>
              <SpaceBetween size="l">
                {/* KPI Cards */}
                {!loadingInsights && insights.length > 0 && (
                  <ColumnLayout columns={4} variant="text-grid">
                    <div style={{ padding: '16px', backgroundColor: '#DBEAFE', border: '2px solid #93C5FD', borderRadius: '8px', textAlign: 'center' }}>
                      <Box fontSize="heading-xl" fontWeight="bold">{insights.length}</Box>
                      <Box fontSize="body-s" fontWeight="bold">Total</Box>
                    </div>
                    <div style={{ padding: '16px', backgroundColor: '#FEF3C7', border: '2px solid #FCD34D', borderRadius: '8px', textAlign: 'center' }}>
                      <Box fontSize="heading-xl" fontWeight="bold">{newCount}</Box>
                      <Box fontSize="body-s" fontWeight="bold">New</Box>
                    </div>
                    <div style={{ padding: '16px', backgroundColor: '#D1FAE5', border: '2px solid #6EE7B7', borderRadius: '8px', textAlign: 'center' }}>
                      <Box fontSize="heading-xl" fontWeight="bold">{ackCount}</Box>
                      <Box fontSize="body-s" fontWeight="bold">Acknowledged</Box>
                    </div>
                    <div style={{ padding: '16px', backgroundColor: '#EDE9FE', border: '2px solid #C4B5FD', borderRadius: '8px', textAlign: 'center' }}>
                      <Box fontSize="heading-xl" fontWeight="bold">{new Set(insights.map((i: any) => i.issueType)).size}</Box>
                      <Box fontSize="body-s" fontWeight="bold">Issue Types</Box>
                    </div>
                  </ColumnLayout>
                )}

                {/* Insight charts */}
                {!loadingInsights && insights.length > 0 && (
                  <ColumnLayout columns={2}>
                    <div>
                      <Box variant="h4" padding={{ bottom: 'xs' }}>Top Recurring Issues</Box>
                      <ResponsiveContainer width="100%" height={250}>
                        <BarChart data={insights.map((i: any) => ({ name: i.category || (i.description || '').split(' ').slice(0, 3).join(' '), reports: i.frequency || 0 })).sort((a: any, b: any) => b.reports - a.reports).slice(0, 6)} layout="vertical" margin={{ top: 5, right: 20, bottom: 5, left: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis type="number" fontSize={12} />
                          <YAxis dataKey="name" type="category" width={140} fontSize={11} tick={{ fill: '#333' }} />
                          <Tooltip contentStyle={{ fontSize: 13 }} />
                          <Bar dataKey="reports" name="Reports" radius={[0, 4, 4, 0]}>
                            {insights.slice(0, 6).map((_: any, idx: number) => <Cell key={idx} fill={COLORS[idx % COLORS.length]} />)}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                    <div>
                      <Box variant="h4" padding={{ bottom: 'xs' }}>Issues by Type</Box>
                      <ResponsiveContainer width="100%" height={250}>
                        <PieChart>
                          <Pie data={pieData} cx="50%" cy="50%" outerRadius={80} innerRadius={40} dataKey="value" label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`} fontSize={13} paddingAngle={2}>
                            {pieData.map((_: any, idx: number) => <Cell key={idx} fill={COLORS[idx % COLORS.length]} />)}
                          </Pie>
                          <Tooltip contentStyle={{ fontSize: 13 }} formatter={(value: any) => [`${value} insights`]} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </ColumnLayout>
                )}

                {/* Filters */}
                <SpaceBetween size="s">
                  <Input value={searchQuery} onChange={({ detail }) => setSearchQuery(detail.value)} placeholder="Search insights..." type="search" />
                  <SpaceBetween direction="horizontal" size="xs">
                    <Select selectedOption={typeFilter} onChange={({ detail }) => setTypeFilter(detail.selectedOption)}
                      options={[{ value: 'all', label: 'All Types' }, ...Array.from(new Set(insights.map((i: any) => i.issueType))).filter(Boolean).map(t => ({ value: t, label: t }))]} />
                    <Select selectedOption={statusFilter} onChange={({ detail }) => setStatusFilter(detail.selectedOption)}
                      options={[{ value: 'all', label: 'All Status' }, { value: 'new', label: 'New' }, { value: 'in-progress', label: 'Acknowledged' }]} />
                    <Select selectedOption={categoryFilter} onChange={({ detail }) => setCategoryFilter(detail.selectedOption)}
                      options={[{ value: 'all', label: 'All Categories' }, ...Array.from(new Set(insights.map((i: any) => i.category))).filter(Boolean).map(c => ({ value: c, label: c }))]} />
                  </SpaceBetween>
                </SpaceBetween>

                {/* Insights table */}
                <Table
                  sortingColumn={collectionProps.sortingColumn}
                  sortingDescending={collectionProps.sortingDescending}
                  onSortingChange={collectionProps.onSortingChange}
                  loading={loadingInsights}
                  columnDefinitions={[
                    {
                      id: 'type', header: 'Type', width: 110, sortingField: 'issueType',
                      cell: (i: any) => <Badge color={i.issueType === 'equipment' ? 'red' : i.issueType === 'tool' ? 'blue' : i.issueType === 'resource' ? 'green' : 'grey'}>{i.issueType?.toUpperCase()}</Badge>,
                    },
                    {
                      id: 'category', header: 'Category', width: 160, sortingField: 'category',
                      cell: (i: any) => i.category || '—',
                    },
                    {
                      id: 'description', header: 'Insight', sortingField: 'description',
                      cell: (i: any) => (
                        <ExpandableSection headerText={i.description?.substring(0, 80) + '...'} variant="footer">
                          <SpaceBetween size="xs">
                            <Box>{i.description}</Box>
                            {i.recommendedAction && <Box><Box variant="awsui-key-label">Recommended Action</Box>{i.recommendedAction}</Box>}
                          </SpaceBetween>
                        </ExpandableSection>
                      ),
                    },
                    {
                      id: 'frequency', header: 'Reports', width: 80, sortingField: 'frequency',
                      cell: (i: any) => <Box textAlign="center">{i.frequency}</Box>,
                    },
                    {
                      id: 'status', header: 'Status', width: 130, sortingField: 'status',
                      cell: (i: any) => <StatusIndicator type={i.status === 'new' ? 'pending' : 'success'}>{i.status === 'new' ? 'New' : 'Acknowledged'}</StatusIndicator>,
                    },
                    {
                      id: 'actions', header: 'Actions', width: 180,
                      cell: (i: any) => i.status === 'new'
                        ? <Button variant="primary" onClick={() => handleAcknowledge(i.insightId)}>Acknowledge</Button>
                        : <StatusIndicator type="success">Done</StatusIndicator>,
                    },
                  ]}
                  items={items}
                  empty={
                    <Box textAlign="center" color="inherit">
                      <b>No insights found</b>
                      <Box variant="p" color="inherit">{searchQuery ? 'Try adjusting your search' : 'Click "Trigger Analysis" to generate insights'}</Box>
                    </Box>
                  }
                  pagination={<Pagination currentPageIndex={paginationProps.currentPageIndex} pagesCount={paginationProps.pagesCount} onChange={paginationProps.onChange} />}
                  preferences={<CollectionPreferences title="Preferences" confirmLabel="Confirm" cancelLabel="Cancel" pageSizePreference={{ title: 'Items per page', options: [{ value: 5, label: '5' }, { value: 10, label: '10' }, { value: 20, label: '20' }, { value: 50, label: '50' }] }} preferences={{ pageSize }} onConfirm={({ detail }) => setPageSize(detail.pageSize ?? 10)} />}
                />
              </SpaceBetween>
            </Container>
          </SpaceBetween>
        </Container>
      </SpaceBetween>
      <Chatbot />
    </>
  );
}
