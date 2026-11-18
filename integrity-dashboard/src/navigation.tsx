import {
  Brain,
  FileCheck2,
  Gauge,
  Globe,
  Settings2,
  UsersRound,
  WalletCards,
} from 'lucide-react';

export const NAVIGATION_ITEMS = [
  { to: '/dashboard', label: 'Command center', icon: Gauge, aliases: ['/identity'] },
  { to: '/agents', label: 'Agent registry', icon: UsersRound, aliases: ['/fleet', '/knowledge', '/memory'] },
  { to: '/agent0', label: 'Agent0 Passport', icon: Globe, aliases: ['/passport', '/erc8004'] },
  { to: '/ais', label: 'AIS intelligence', icon: Brain, aliases: ['/intelligence'] },
  { to: '/evidence', label: 'Evidence ledger', icon: FileCheck2, aliases: ['/records', '/proofs', '/contracts', '/activity', '/correlation'] },
  { to: '/treasury', label: 'Treasury', icon: WalletCards, aliases: ['/wallets', '/transactions', '/financials', '/prediction-markets', '/quant'] },
  { to: '/system', label: 'Operations', icon: Settings2, aliases: ['/health', '/kernel', '/kernel-intent', '/licence', '/developer', '/wiki', '/docs'] },
];
