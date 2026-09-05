import React, { useState, useEffect } from 'react';
import { Play, Folder, FileCode, PanelRight, RotateCcw, Trash2, X, Lightbulb, Lock } from 'lucide-react';
import { apiFetch } from '../../api/client';
import { Button, Alert, Modal } from '../../components/shared';
import CodeEditor from './CodeEditor';
import IDEConsole from './IDEConsole';
import MissionHeader from './MissionHeader';
import MissionBrief from './MissionBrief';

const EDITABLE_FILE = 'FollowerSearch.kt';
const HINT = 'Hint: a Trie index turns O(N) prefix filtering into O(L) lookups.';

const FILES = {
  'FollowerSearch.kt': {
    unoptimized: `package com.atlas.mission.controllers

import com.atlas.mission.models.User
import com.atlas.mission.models.FollowerEdge

class FollowerSearch {

    // TODO: Optimize this for accounts with >50k followers.
    // Current complexity is O(N). Target is O(log N) or better for prefix search.
    fun searchFollowers(query: String, followers: List<User>): List<User> {
        if (query.isBlank()) return emptyList()
        
        return followers.filter { user ->
            user.username.startsWith(query, ignoreCase = true) ||
            user.displayName.startsWith(query, ignoreCase = true)
        }.take(50)
    }
}`,
    optimized: `package com.atlas.mission.controllers

import com.atlas.mission.models.User
import com.atlas.mission.models.FollowerEdge

class FollowerSearch {
    // Optimized prefix lookup using a Trie index structure.
    // Space Complexity: O(N * S) where S is average string length.
    // Query Time Complexity: O(L) where L is query length (O(1) relative to N).
    
    private val trie = TrieNode()

    class TrieNode {
        val children = HashMap<Char, TrieNode>()
        val users = ArrayList<User>()
    }

    fun buildIndex(followers: List<User>) {
        trie.children.clear()
        trie.users.clear()
        for (user in followers) {
            insert(user.username.lowercase(), user)
            insert(user.displayName.lowercase(), user)
        }
    }

    private fun insert(key: String, user: User) {
        var node = trie
        for (char in key) {
            node = node.children.getOrPut(char) { TrieNode() }
            if (node.users.size < 50 && !node.users.contains(user)) {
                node.users.add(user)
            }
        }
    }

    fun searchFollowers(query: String, followers: List<User>): List<User> {
        if (query.isBlank()) return emptyList()
        if (trie.children.isEmpty() && followers.isNotEmpty()) {
            buildIndex(followers) // Lazy initialization
        }
        
        var node = trie
        val normalizedQuery = query.lowercase()
        for (char in normalizedQuery) {
            node = node.children[char] ?: return emptyList()
        }
        return node.users.take(50)
    }
}`
  },
  'User.kt': `package com.atlas.mission.models

data class User(
    val id: String,
    val username: String,
    val displayName: String,
    val avatarUrl: String,
    val isVerified: Boolean = false
)`,
  'FollowerEdge.kt': `package com.atlas.mission.models

data class FollowerEdge(
    val id: String,
    val followerId: String,
    val followedId: String,
    val timestamp: Long
)`,
  'SearchBenchmarks.kt': `package com.atlas.mission

import com.atlas.mission.controllers.FollowerSearch
import com.atlas.mission.models.User
import kotlin.system.measureNanoTime

class SearchBenchmarks {
    fun runPerformanceTest() {
        val dataset = List(50000) { i -> 
            User("u_$i", "follower_$i", "Follower $i", "") 
        }
        val searchEngine = FollowerSearch()
        
        // Measure execution latency
        val timeNs = measureNanoTime {
            searchEngine.searchFollowers("follower_4999", dataset)
        }
        println("LATENCY: \${timeNs / 1_000_000.0} ms")
    }
}`
};

const RUN_PRELUDE = [
  'Building Kotlin JVM module...',
  'Executing task: :compileKotlin',
  'Compilation Successful.',
  'Executing task: :test --tests "com.atlas.mission.SearchBenchmarks"',
  'Running performance suite for 50,000 followers...'
];

function draftKey(userId) {
  return `atlas_mission_draft_${userId}`;
}

export default function MissionIDE({ user, accessToken, missionCompleted, onCompleteMission }) {
  const [selectedFile, setSelectedFile] = useState('FollowerSearch.kt');
  const [runStatus, setRunStatus] = useState('idle'); // idle | running | success | failed | api_error
  const [hasRun, setHasRun] = useState(missionCompleted);
  const [logs, setLogs] = useState([
    'System ready.',
    'Press RUN MISSION to execute the benchmark suite.'
  ]);
  const [briefOpen, setBriefOpen] = useState(() =>
    typeof window !== 'undefined' && window.matchMedia('(min-width: 981px)').matches
  );
  const [consoleOpen, setConsoleOpen] = useState(true);
  const [resetConfirm, setResetConfirm] = useState(false);

  // Per-file code map. User code in the editable file survives file switching,
  // and a browser-local draft protects edits made during a session.
  const [files, setFiles] = useState(() => {
    const seed = {
      'FollowerSearch.kt': missionCompleted
        ? FILES['FollowerSearch.kt'].optimized
        : FILES['FollowerSearch.kt'].unoptimized,
      'User.kt': FILES['User.kt'],
      'FollowerEdge.kt': FILES['FollowerEdge.kt'],
      'SearchBenchmarks.kt': FILES['SearchBenchmarks.kt']
    };
    if (!missionCompleted && user?.id) {
      try {
        const saved = localStorage.getItem(draftKey(user.id));
        if (saved) seed['FollowerSearch.kt'] = saved;
      } catch {
        // Storage unavailable — keep the pristine seed.
      }
    }
    return seed;
  });

  const code = files[selectedFile] || '';
  const editable = selectedFile === EDITABLE_FILE;
  const running = runStatus === 'running';
  const editableCode = files[EDITABLE_FILE];
  const isDirty = editableCode !== FILES[EDITABLE_FILE].unoptimized;

  // Debounced browser-local draft of the editable file (not server-side).
  useEffect(() => {
    if (!user?.id || missionCompleted) return;
    const t = setTimeout(() => {
      try {
        localStorage.setItem(draftKey(user.id), editableCode);
      } catch {
        // Storage unavailable — draft skipped this round.
      }
    }, 400);
    return () => clearTimeout(t);
  }, [editableCode, user?.id, missionCompleted]);

  const status = missionCompleted
    ? 'verified'
    : hasRun || isDirty ? 'in-progress' : 'not-started';

  const clearDraft = () => {
    if (!user?.id) return;
    try {
      localStorage.removeItem(draftKey(user.id));
    } catch {
      // Storage unavailable — ignore.
    }
  };

  const handleFileClick = (fileName) => {
    setSelectedFile(fileName);
  };

  const handleLoadSolution = () => {
    // Existing toggle: swap the editable file with the reference implementation.
    if (editable) {
      setFiles(prev => ({ ...prev, [EDITABLE_FILE]: FILES[EDITABLE_FILE].optimized }));
    }
  };

  const handleResetCode = () => {
    if (isDirty) {
      setResetConfirm(true);
    } else {
      doReset();
    }
  };

  const doReset = () => {
    setFiles(prev => ({ ...prev, [EDITABLE_FILE]: FILES[EDITABLE_FILE].unoptimized }));
    clearDraft();
    setResetConfirm(false);
  };

  const handleExecuteMission = async () => {
    if (running) return;
    setRunStatus('running');
    setHasRun(true);
    setLogs(RUN_PRELUDE);

    try {
      const res = await apiFetch('/missions/execute', {
        method: 'POST',
        token: accessToken,
        body: JSON.stringify({
          userId: user.id,
          code: files[EDITABLE_FILE],
          fileName: selectedFile
        })
      });

      const reply = await res.json();

      if (res.ok) {
        setLogs(Array.isArray(reply.logs) ? reply.logs : RUN_PRELUDE);
        if (reply.success) {
          setRunStatus('success');
          clearDraft();
          if (onCompleteMission) onCompleteMission(reply.user);
        } else {
          setRunStatus('failed');
        }
      } else {
        setLogs(prev => [
          ...prev,
          `[ERROR] Execution failed: ${reply.error || 'Server error'}`
        ]);
        setRunStatus('api_error');
      }
    } catch (err) {
      console.error(err);
      setLogs(prev => [
        ...prev,
        '[ERROR] Connection lost. Failed to contact the execution service.'
      ]);
      setRunStatus('api_error');
    }
  };

  const banner = runStatus === 'success' ? (
    <Alert variant="success">
      <strong>Simulation passed.</strong> All benchmark assertions matched the reference solution. Mission scoring is simulated (prototype) — no XP or Passport changes are applied.
    </Alert>
  ) : runStatus === 'failed' ? (
    <Alert variant="warning">
      <strong>Benchmark failed.</strong> Review the console output, then refine the code and run again. {HINT}
    </Alert>
  ) : runStatus === 'api_error' ? (
    <Alert variant="danger">
      <strong>Couldn’t reach the execution service.</strong> Check that the backend is running, then press Run to retry.
    </Alert>
  ) : null;

  return (
    <div className="mission-ide-root">
      <MissionHeader
        title="Followers Search Scale"
        difficulty="MEDIUM"
        type="OPTIMIZATION"
        language="Kotlin / JVM"
        status={status}
      />

      {/* IDE Toolbar — primary execution action, then tertiary helpers */}
      <div className="ide-toolbar" role="toolbar" aria-label="Mission IDE controls">
        <div className="ide-toolbar__primary">
          <Button
            variant="accent"
            loading={running}
            icon={<Play size={15} />}
            onClick={handleExecuteMission}
            disabled={running}
            title="Run current code (Ctrl/⌘ + Enter)"
            aria-keyshortcuts="Control+Enter Meta+Enter"
            style={{ minWidth: '150px' }}
          >
            RUN MISSION
          </Button>
          <span className="ide-kbd font-mono" aria-hidden="true">Ctrl/⌘ + Enter</span>
        </div>

        <div className="ide-toolbar__secondary">
          <button
            type="button"
            className={`ctrl-btn font-mono ${briefOpen ? 'active' : ''}`}
            onClick={() => setBriefOpen(prev => !prev)}
            aria-pressed={briefOpen}
            aria-label="Toggle mission brief"
            style={{ display: 'flex', gap: '6px', alignItems: 'center' }}
          >
            <PanelRight size={13} aria-hidden="true" /> BRIEF
          </button>

          {editable && (
            <>
              <button
                type="button"
                className="ctrl-btn load font-mono"
                onClick={handleLoadSolution}
                title="Load the reference Trie implementation"
                style={{ display: 'flex', gap: '6px', alignItems: 'center' }}
              >
                <Lightbulb size={13} aria-hidden="true" /> LOAD SOLUTION (TRIE)
              </button>
              <button
                type="button"
                className="ctrl-btn reset font-mono"
                onClick={handleResetCode}
                title="Restore the original unoptimized implementation"
                style={{ display: 'flex', gap: '6px', alignItems: 'center' }}
              >
                <RotateCcw size={13} aria-hidden="true" /> RESET
              </button>
            </>
          )}
        </div>
      </div>

      <div className="ide-banner" aria-live="polite">
        {banner}
      </div>

      {/* Workspace: explorer | editor | brief */}
      <div className="ide-workspace">
        <aside className="ide-explorer glass-panel" aria-label="Project explorer">
          <div className="panel-title font-mono">PROJECT EXPLORER</div>
          <div className="tree-folder">
            <div className="folder-name font-mono">
              <Folder size={14} className="neon-purple" aria-hidden="true" />
              <span>mission-scaling-search</span>
            </div>
            <div className="folder-children">
              <div className="folder-name folder-label font-mono"><Folder size={13} aria-hidden="true" /> src/main/kotlin</div>
              <div className="folder-children file-list">
                {['FollowerSearch.kt', 'User.kt', 'FollowerEdge.kt'].map(f => (
                  <button
                    key={f}
                    type="button"
                    className={`file-item font-mono ${selectedFile === f ? 'active' : ''}`}
                    onClick={() => handleFileClick(f)}
                    aria-current={selectedFile === f ? 'true' : undefined}
                    aria-label={`${f}${f === EDITABLE_FILE ? ', editable' : ', read only'}`}
                  >
                    <FileCode size={12} className={f === EDITABLE_FILE ? 'neon-cyan' : ''} aria-hidden="true" />
                    <span>{f}</span>
                    {f !== EDITABLE_FILE && <Lock size={10} className="file-item__lock" aria-hidden="true" />}
                  </button>
                ))}
              </div>

              <div className="folder-name folder-label font-mono"><Folder size={13} aria-hidden="true" /> src/test/kotlin</div>
              <div className="folder-children file-list">
                <button
                  type="button"
                  className={`file-item font-mono ${selectedFile === 'SearchBenchmarks.kt' ? 'active' : ''}`}
                  onClick={() => handleFileClick('SearchBenchmarks.kt')}
                  aria-current={selectedFile === 'SearchBenchmarks.kt' ? 'true' : undefined}
                  aria-label="SearchBenchmarks.kt, read only"
                >
                  <FileCode size={12} aria-hidden="true" />
                  <span>SearchBenchmarks.kt</span>
                  <Lock size={10} className="file-item__lock" aria-hidden="true" />
                </button>
              </div>
            </div>
          </div>
        </aside>

        <main className="ide-editor glass-panel" aria-label="Code editor workspace">
          <div className="editor-tab-header">
            <div className="tab-title font-mono active">
              <FileCode size={14} className="neon-cyan" aria-hidden="true" />
              <span>{selectedFile}</span>
            </div>
          </div>
          <CodeEditor
            code={code}
            onChange={next => setFiles(prev => ({ ...prev, [selectedFile]: next }))}
            readOnly={!editable}
            fileName={selectedFile}
            onRun={handleExecuteMission}
            runDisabled={running}
          />
        </main>

        <aside className={`ide-brief glass-panel ${briefOpen ? 'is-open' : 'is-closed'}`} aria-label="Mission brief">
          <div className="ide-brief__head">
            <span className="panel-title font-mono">MISSION BRIEF</span>
            <button
              type="button"
              className="ide-brief__close"
              onClick={() => setBriefOpen(false)}
              aria-label="Close mission brief"
            >
              <X size={15} aria-hidden="true" />
            </button>
          </div>
          <div className="ide-brief__body">
            <MissionBrief />
          </div>
        </aside>
      </div>

      <IDEConsole
        logs={logs}
        state={runStatus}
        collapsed={!consoleOpen}
        onToggleCollapse={() => setConsoleOpen(prev => !prev)}
      />

      <Modal
        open={resetConfirm}
        onClose={() => setResetConfirm(false)}
        title="Reset code?"
        footer={
          <>
            <Button variant="ghost" onClick={() => setResetConfirm(false)}>CANCEL</Button>
            <Button variant="danger" icon={<Trash2 size={14} />} onClick={doReset}>RESET CODE</Button>
          </>
        }
      >
        <p>
          Replace the current implementation of {EDITABLE_FILE} with the original unoptimized
          version? Any edits you have made will be lost.
        </p>
        <p className="font-mono" style={{ fontSize: '11px', color: 'var(--text-dim)', marginTop: '8px' }}>
          Your browser-local draft is cleared as well.
        </p>
      </Modal>
    </div>
  );
}