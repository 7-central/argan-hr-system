'use client';

import { Search } from 'lucide-react';

import { Input } from '@/components/ui/input';

interface ContractSearchProps {
  placeholder?: string;
  className?: string;
  value: string;
  onChange: (value: string) => void;
}

export function ContractSearch({
  placeholder = 'Search contracts by number or version...',
  className,
  value,
  onChange,
}: ContractSearchProps) {
  return (
    <div className={`relative ${className || ''}`}>
      <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="pl-8 md:w-[300px] lg:w-[400px]"
      />
    </div>
  );
}
