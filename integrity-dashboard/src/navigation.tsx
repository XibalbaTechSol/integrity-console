import {
  Brain,
  FileCheck2,
  Gauge,
  ShieldCheck,
  UsersRound,
} from 'lucide-react';

export const NAVIGATION_ITEMS = [
  { to: '/dashboard', label: 'Command Center', icon: Gauge, aliases: ['/overview'] },
  { to: '/identity', label: 'Agent Identity', icon: UsersRound, aliases: ['/agents', '/agent0', '/passport', '/erc8004', '/fleet'] },
  { to: '/cortex', label: 'Cortex Memory', icon: Brain, aliases: ['/memory', '/knowledge'] },
  { to: '/shield', label: 'Shield Defense', icon: ShieldCheck, aliases: ['/security', '/protection', '/kernel'] },
  { to: '/intelligence', label: 'AIS & Evidence', icon: FileCheck2, aliases: ['/ais', '/evidence', '/records', '/proofs', '/contracts', '/activity', '/correlation'] },
];
