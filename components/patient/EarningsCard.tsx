import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface EarningsCardProps {
  totalEarned: number;
  available: number;
  redeemed: number;
  onRedeem: () => void;
}

export function EarningsCard({ totalEarned, available, redeemed, onRedeem }: EarningsCardProps) {
  return (
    <Card className="border-teal-100 bg-teal-50">
      <CardContent className="space-y-2 p-4">
        <p className="text-sm text-teal-dark">Total earned</p>
        <p className="text-3xl font-bold text-teal-dark">${totalEarned.toFixed(2)}</p>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <p className="rounded-lg bg-white p-2 text-gray-700">Available: ${available.toFixed(2)}</p>
          <p className="rounded-lg bg-white p-2 text-gray-700">Redeemed: ${redeemed.toFixed(2)}</p>
        </div>
        {available > 0 ? (
          <Button className="w-full" onClick={onRedeem}>
            REDEEM
          </Button>
        ) : null}
      </CardContent>
    </Card>
  );
}


