'use client';

import { useMemo, useState } from 'react';
import { Copy } from 'lucide-react';
import toast from 'react-hot-toast';
import { Badge } from '@/components/ui/badge';
import { shortTxHash } from '@/lib/utils/format';
import type { GrantRelease } from '@/types';

interface TransactionTableProps {
  transactions: GrantRelease[];
}

export function TransactionTable({ transactions }: TransactionTableProps) {
  const [statusFilter, setStatusFilter] = useState('all');
  const [milestoneFilter, setMilestoneFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'amount'>('date');

  const milestoneOptions = useMemo(() => {
    const labels = new Set<string>();
    for (const item of transactions) {
      labels.add(item.milestoneName);
    }
    return ['all', ...Array.from(labels)];
  }, [transactions]);

  const data = useMemo(() => {
    let rows = [...transactions];

    if (statusFilter !== 'all') {
      rows = rows.filter((row) => row.status === statusFilter);
    }
    if (milestoneFilter !== 'all') {
      rows = rows.filter((row) => row.milestoneName === milestoneFilter);
    }
    if (dateFrom) {
      rows = rows.filter((row) => (row.releasedAt ?? '').slice(0, 10) >= dateFrom);
    }
    if (dateTo) {
      rows = rows.filter((row) => (row.releasedAt ?? '').slice(0, 10) <= dateTo);
    }

    rows.sort((a, b) => {
      if (sortBy === 'amount') return b.amount - a.amount;
      return (b.releasedAt ?? '').localeCompare(a.releasedAt ?? '');
    });
    return rows;
  }, [dateFrom, dateTo, milestoneFilter, sortBy, statusFilter, transactions]);

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 gap-2 md:grid-cols-5">
        <select
          className="h-10 rounded-md border border-gray-300 px-2"
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
        >
          <option value="all">All statuses</option>
          <option value="pending">Pending</option>
          <option value="released">Released</option>
          <option value="redeemed">Redeemed</option>
        </select>

        <select
          className="h-10 rounded-md border border-gray-300 px-2"
          value={milestoneFilter}
          onChange={(event) => setMilestoneFilter(event.target.value)}
        >
          {milestoneOptions.map((option) => (
            <option key={option} value={option}>
              {option === 'all' ? 'All milestones' : option}
            </option>
          ))}
        </select>

        <input
          type="date"
          className="h-10 rounded-md border border-gray-300 px-2"
          value={dateFrom}
          onChange={(event) => setDateFrom(event.target.value)}
        />
        <input
          type="date"
          className="h-10 rounded-md border border-gray-300 px-2"
          value={dateTo}
          onChange={(event) => setDateTo(event.target.value)}
        />

        <select
          className="h-10 rounded-md border border-gray-300 px-2"
          value={sortBy}
          onChange={(event) => setSortBy(event.target.value as 'date' | 'amount')}
        >
          <option value="date">Sort by date</option>
          <option value="amount">Sort by amount</option>
        </select>
      </div>

      <div className="overflow-x-auto rounded-xl border border-gray-200">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 text-left text-gray-600">
            <tr>
              <th className="px-3 py-2">Patient</th>
              <th className="px-3 py-2">Milestone</th>
              <th className="px-3 py-2">Amount</th>
              <th className="px-3 py-2">Tx Hash</th>
              <th className="px-3 py-2">Date</th>
              <th className="px-3 py-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row) => (
              <tr key={row.id} className="border-t border-gray-200">
                <td className="px-3 py-2">{row.patientName}</td>
                <td className="px-3 py-2">{row.milestoneName}</td>
                <td className="px-3 py-2">${row.amount.toFixed(2)}</td>
                <td className="px-3 py-2">
                  {row.xionTxHash ? (
                    <button
                      type="button"
                      className="inline-flex items-center gap-1 font-mono text-xs text-teal-dark"
                      onClick={async () => {
                        await navigator.clipboard.writeText(row.xionTxHash ?? '');
                        toast.success('Tx hash copied');
                      }}
                    >
                      {shortTxHash(row.xionTxHash)}
                      <Copy className="h-3 w-3" />
                    </button>
                  ) : (
                    'N/A'
                  )}
                </td>
                <td className="px-3 py-2">{row.releasedAt ? new Date(row.releasedAt).toLocaleDateString() : 'N/A'}</td>
                <td className="px-3 py-2">
                  <Badge
                    variant={
                      row.status === 'redeemed'
                        ? 'synced'
                        : row.status === 'released'
                          ? 'active'
                          : 'pending'
                    }
                  >
                    {row.status}
                  </Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
