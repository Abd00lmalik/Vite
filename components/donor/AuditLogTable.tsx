import type { AuditLog } from '@/types';

interface AuditLogTableProps {
  logs: AuditLog[];
}

export function AuditLogTable({ logs }: AuditLogTableProps) {
  if (!logs.length) {
    return <p className="text-sm text-gray-500">No audit logs available.</p>;
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200">
      <table className="min-w-full text-sm">
        <thead className="bg-gray-50 text-left text-gray-600">
          <tr>
            <th className="px-3 py-2">Time</th>
            <th className="px-3 py-2">Entity</th>
            <th className="px-3 py-2">Action</th>
            <th className="px-3 py-2">By</th>
          </tr>
        </thead>
        <tbody>
          {logs.map((log) => (
            <tr key={log.id} className="border-t border-gray-200">
              <td className="px-3 py-2">{new Date(log.timestamp).toLocaleString()}</td>
              <td className="px-3 py-2">{log.entityType}</td>
              <td className="px-3 py-2">{log.action}</td>
              <td className="px-3 py-2">{log.performedBy}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

