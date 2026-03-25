interface ReportData {
  reportId: string;
  taskId: string;
  taskTitle: string;
  location: string;
  technicianName: string;
  technicianId: string;
  runbookId: string;
  runbookVersion: string;
  startedAt: string;
  completedAt: string;
  actualDuration: number;
  estimatedDuration: number;
  everythingOk: boolean;
  hadDelays: boolean;
  delayReason?: string;
  runbookRating: number;
  comments?: string;
  photos: string[];
}

export function generateTextReport(data: ReportData): string {
  const startTime = new Date(data.startedAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
  const endTime = new Date(data.completedAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
  const date = new Date(data.completedAt).toISOString().split('T')[0];

  // Parse issues from comments if present
  const issuesMatch = data.comments?.match(/Issues: ([^\n]+)/);
  const issues = issuesMatch ? issuesMatch[1].split(', ') : [];
  const actualComments = data.comments?.replace(/Issues: [^\n]+\n\n/, '') || '';

  return `
# Field Report: ${data.reportId}

**Report ID:** ${data.reportId}  
**Task ID:** ${data.taskId}  
**Technician:** ${data.technicianName} (${data.technicianId})  
**Runbook:** ${data.runbookId} ${data.runbookVersion}  
**Location:** ${data.location}  
**Date:** ${date}

## Timing
- Started: ${startTime}
- Completed: ${endTime}
- Duration: ${data.actualDuration} minutes (estimated: ${data.estimatedDuration} minutes)

## Status
- Everything OK: ${data.everythingOk ? 'Yes' : 'No'}
- Had Delays: ${data.hadDelays ? 'Yes' : 'No'}
- Runbook Rating: ${data.runbookRating}/5 stars

${data.hadDelays && data.delayReason ? `
## Delay Details
${data.delayReason}
` : ''}

## Step-Specific Feedback

${issues.includes('Missing tools') ? `
### Tools Issue
- Issue: Required tools were not available
- Time Impact: Caused delays
- Safety Critical: Potential
` : ''}

${issues.includes('Missing steps') ? `
### Procedure Steps Issue
- Issue: Procedure omits necessary steps
- Suggestion: Add missing steps to runbook
- Safety Critical: Potential
` : ''}

${issues.includes('Incorrect time estimate') ? `
### Time Estimation Issue
- Issue: Actual time differs significantly from estimate
- Actual: ${data.actualDuration} minutes vs Estimated: ${data.estimatedDuration} minutes
- Variance: ${data.actualDuration - data.estimatedDuration} minutes (${((data.actualDuration - data.estimatedDuration) / data.estimatedDuration * 100).toFixed(1)}%)
` : ''}

${issues.includes('Safety concerns') ? `
### Safety Issue
- Issue: Safety risks not mentioned in procedure
- Safety Critical: Yes
- Suggestion: Update runbook with safety warnings
` : ''}

${issues.length === 0 ? '### General\n- No specific issues reported\n- Procedure followed as documented\n- All steps completed successfully\n' : ''}

## Comments

${actualComments || 'No additional comments provided'}

## Photos

${data.photos.length} photo(s) attached
${data.photos.map((url, i) => `![Photo ${i + 1}](${url})`).join('\n')}

---
**Report Generated:** ${data.completedAt}  
**Status:** ${data.everythingOk ? '✅ Completed Successfully' : '⚠️ Issues Reported'}
`.trim();
}
