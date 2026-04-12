import { db } from '@/lib/db/schema';
import type { ProgramReport } from '@/types';

export async function generateReport(programId: string): Promise<ProgramReport> {
  const program = await db.programs.get(programId);
  const patients = await db.patients.where('programId').equals(programId).toArray();
  const vaccinations = await db.vaccinations.toArray();
  const grants = await db.grantReleases.where('patientId').anyOf(patients.map((patient) => patient.id)).toArray();

  const totalCourses = patients.filter((patient) => {
    const patientVaccinations = vaccinations.filter((record) => record.patientId === patient.id);
    return (program?.milestones ?? []).every((milestone) =>
      patientVaccinations.some(
        (record) =>
          record.vaccineName === milestone.vaccineName &&
          record.doseNumber === milestone.doseNumber
      )
    );
  }).length;

  const totalReleased = grants.reduce((sum, grant) => sum + grant.amount, 0);
  const escrowStart = (program?.escrowBalance ?? 0) + totalReleased;
  const efficiency = escrowStart > 0 ? (totalReleased / escrowStart) * 100 : 0;

  const flaggedRecords = vaccinations.filter((record) => record.syncStatus === 'flagged').length;
  const fraudRate = vaccinations.length > 0 ? (flaggedRecords / vaccinations.length) * 100 : 0;

  const dropoutByMilestone = (program?.milestones ?? []).map((milestone) => {
    const completed = vaccinations.filter(
      (record) =>
        record.vaccineName === milestone.vaccineName &&
        record.doseNumber === milestone.doseNumber
    ).length;

    return {
      milestone: milestone.name,
      completed,
      enrolled: patients.length,
      rate: patients.length > 0 ? (completed / patients.length) * 100 : 0,
    };
  });

  return {
    program,
    totalCourses,
    totalReleased,
    efficiency,
    fraudRate,
    flaggedRecords,
    dropoutByMilestone,
    generatedAt: new Date().toISOString(),
  };
}

export function exportToCSV(report: ProgramReport): void {
  const rows = [
    ['Metric', 'Value'],
    ['Program', report.program?.name ?? 'N/A'],
    ['Complete Courses', report.totalCourses.toString()],
    ['Total Released', `$${report.totalReleased}`],
    ['Disbursement Efficiency', `${report.efficiency.toFixed(1)}%`],
    ['Fraud Flag Rate', `${report.fraudRate.toFixed(1)}%`],
    ...report.dropoutByMilestone.map((row) => [
      `${row.milestone} Completion`,
      `${row.rate.toFixed(1)}%`,
    ]),
  ];

  const csv = rows.map((row) => row.join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `vite-report-${new Date().toISOString()}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function exportToPrintableHTML(report: ProgramReport): void {
  const html = `
    <html>
      <head>
        <title>VITE Program Report</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 32px; color: #1f2937; }
          h1 { color: #005A61; }
          table { width: 100%; border-collapse: collapse; margin-top: 16px; }
          td, th { border: 1px solid #d1d5db; padding: 8px; }
          th { background: #f3f4f6; text-align: left; }
        </style>
      </head>
      <body>
        <h1>VITE Program Report</h1>
        <p>Program: ${report.program?.name ?? 'N/A'}</p>
        <p>Generated: ${new Date(report.generatedAt).toLocaleString()}</p>
        <table>
          <tr><th>Metric</th><th>Value</th></tr>
          <tr><td>Complete Courses</td><td>${report.totalCourses}</td></tr>
          <tr><td>Total Released</td><td>$${report.totalReleased.toFixed(2)}</td></tr>
          <tr><td>Disbursement Efficiency</td><td>${report.efficiency.toFixed(1)}%</td></tr>
          <tr><td>Fraud Flag Rate</td><td>${report.fraudRate.toFixed(1)}%</td></tr>
        </table>
      </body>
    </html>
  `;

  const popup = window.open('', '_blank', 'width=900,height=700');
  if (!popup) return;
  popup.document.open();
  popup.document.write(html);
  popup.document.close();
}

