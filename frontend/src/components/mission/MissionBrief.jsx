import React from 'react';
import { Target, ListChecks, Lightbulb, Info } from 'lucide-react';

// Presentational mission brief. Content mirrors the original Mission Specs
// verbatim — only the presentation structure changed.
export default function MissionBrief() {
  return (
    <div className="mission-brief">
      <div className="mission-brief__section">
        <h2 className="mission-brief__heading">
          <Target size={14} className="neon-purple" aria-hidden="true" /> OBJECTIVE
        </h2>
        <p className="mission-brief__text">
          Your task is to optimize the search query performance for follower prefix lookup.
          The Instagram engineering team reported that lookup latency increases linearly, failing their core SLAs.
        </p>
      </div>

      <div className="mission-brief__section">
        <h2 className="mission-brief__heading">
          <ListChecks size={14} className="neon-purple" aria-hidden="true" /> CONSTRAINTS
        </h2>
        <ul className="mission-brief__list font-mono">
          <li>Max dataset (N): 50,000</li>
          <li>Latency limit: &lt; 5.00 ms</li>
          <li>Memory budget: &lt; 10.00 MB</li>
        </ul>
      </div>

      <div className="mission-brief__section">
        <h2 className="mission-brief__heading">
          <Lightbulb size={14} className="neon-purple" aria-hidden="true" /> EXPECTED SOLUTION
        </h2>
        <p className="mission-brief__text">
          Instead of filtering the list on every search request (which is $O(N)$), index the users inside a
          Trie structure. Searching a prefix of length $L$ inside a Trie is $O(L)$, resulting in stable query latency.
        </p>
      </div>

      <div className="mission-brief__section mission-brief__hint">
        <Info size={13} className="neon-cyan" aria-hidden="true" />
        <p className="mission-brief__text">
          Press <strong>Run</strong> to execute the benchmark suite against the current file. A passing run
          verifies the mission and updates your Passport.
        </p>
      </div>
    </div>
  );
}