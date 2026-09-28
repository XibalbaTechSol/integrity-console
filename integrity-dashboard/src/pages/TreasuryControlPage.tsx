import { TokenWallet } from '../components/ui/TokenWallet';
import { FleetWalletOverview } from '../components/ui/FleetWalletOverview';
import { ControlHeader } from '../components/control/ControlHeader';
import { AgentRiskContext } from '../components/control/AgentRiskContext';

// Wallet view. The staking, credit, markets and stability tabs, and the TVL / loan / market
// volume metrics, read contracts cut from the protocol (integrity-core docs/EXECUTION_PLAN.md
// A1: markets and the A2A capital pool; staking is deferred), and the oracle no longer serves
// /v1/stats, /v1/agent/{id}/{stake,credit} or /v1/markets.
export default function TreasuryControlPage() {
  return (
    <div className="control-page control-page-full treasury-page">
      <ControlHeader
        eyebrow="Wallet control"
        title="Wallet"
        description="Operator wallets and each agent's $ITK balance."
      />
      <div className="control-page-body treasury-page-body">
        <AgentRiskContext purpose="funds" />
        <div className="control-hub-content">
          <FleetWalletOverview />
          <TokenWallet />
        </div>
      </div>
    </div>
  );
}
