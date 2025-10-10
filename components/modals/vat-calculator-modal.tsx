'use client';

import { useState, useEffect } from 'react';

import { Calculator, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

interface VatCalculatorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const VAT_RATE = 0.20; // 20% UK VAT rate

export function VatCalculatorModal({ open, onOpenChange }: VatCalculatorModalProps) {
  const [inputValue, setInputValue] = useState('');
  const [vatInclusive, setVatInclusive] = useState(false);
  const [calculatedValue, setCalculatedValue] = useState<number | null>(null);

  // Calculate result whenever input or toggle changes
  useEffect(() => {
    const value = parseFloat(inputValue);

    if (isNaN(value) || value <= 0) {
      setCalculatedValue(null);
      return;
    }

    if (vatInclusive) {
      // Remove VAT: divide by 1.20 to get the net price
      const netPrice = value / (1 + VAT_RATE);
      setCalculatedValue(netPrice);
    } else {
      // Add VAT: multiply by 1.20 to get the gross price
      const grossPrice = value * (1 + VAT_RATE);
      setCalculatedValue(grossPrice);
    }
  }, [inputValue, vatInclusive]);

  const handleClose = () => {
    // Reset values when closing
    setInputValue('');
    setVatInclusive(false);
    setCalculatedValue(null);
    onOpenChange(false);
  };

  const vatAmount = calculatedValue && inputValue
    ? vatInclusive
      ? parseFloat(inputValue) - calculatedValue  // VAT being removed
      : calculatedValue - parseFloat(inputValue)  // VAT being added
    : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-purple-600">
            <Calculator className="h-5 w-5" />
            VAT Calculator
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Input Amount */}
          <div className="space-y-2">
            <Label htmlFor="amount">Enter Amount (£)</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              min="0"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="0.00"
              className="text-lg"
            />
          </div>

          {/* VAT Inclusive Toggle */}
          <div className="flex items-center justify-between space-x-2 rounded-lg border p-4">
            <div className="space-y-0.5">
              <Label htmlFor="vat-inclusive" className="text-base">
                Price includes VAT
              </Label>
              <p className="text-sm text-muted-foreground">
                {vatInclusive
                  ? 'Remove VAT to get net price'
                  : 'Add VAT to get gross price'}
              </p>
            </div>
            <Switch
              id="vat-inclusive"
              checked={vatInclusive}
              onCheckedChange={setVatInclusive}
            />
          </div>

          {/* Results Display */}
          {calculatedValue !== null && (
            <div className="space-y-3 rounded-lg border border-purple-200 bg-purple-50/50 p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">
                  {vatInclusive ? 'Original (inc. VAT):' : 'Original (exc. VAT):'}
                </span>
                <span className="text-base font-semibold">
                  £{parseFloat(inputValue).toFixed(2)}
                </span>
              </div>

              {vatAmount !== null && (
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-muted-foreground">
                    VAT Amount (20%):
                  </span>
                  <span className="text-base font-semibold text-purple-600">
                    £{vatAmount.toFixed(2)}
                  </span>
                </div>
              )}

              <div className="flex items-center justify-between border-t border-purple-200 pt-3">
                <span className="text-sm font-medium text-muted-foreground">
                  {vatInclusive ? 'Net Price (exc. VAT):' : 'Gross Price (inc. VAT):'}
                </span>
                <span className="text-xl font-bold text-purple-600">
                  £{calculatedValue.toFixed(2)}
                </span>
              </div>
            </div>
          )}

          {/* Help Text */}
          <div className="rounded-lg bg-muted p-3">
            <p className="text-xs text-muted-foreground">
              <strong>Tip:</strong> Toggle the switch to change calculation mode.
              Turn ON to remove VAT from inclusive prices, or leave OFF to add VAT to net prices.
            </p>
          </div>
        </div>

        <div className="flex justify-end">
          <Button variant="outline" onClick={handleClose}>
            <X className="h-4 w-4 mr-2" />
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
