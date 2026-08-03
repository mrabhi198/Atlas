import React, { useState } from 'react';
import { Play, Folder, FileCode, Terminal, HelpCircle, RefreshCw, Cpu, CheckCircle } from 'lucide-react';

export default function MissionIDE({ user, accessToken, missionCompleted, onCompleteMission }) {
  const [selectedFile, setSelectedFile] = useState('FollowerSearch.kt');
  const [isCompiling, setIsCompiling] = useState(false);
  const [terminalLogs, setTerminalLogs] = useState([
    'System ready.',
    'Execute compiler using run controls above.'
  ]);
  const [codeOptimized, setCodeOptimized] = useState(missionCompleted);

  // Predefined file contents for the tree explorer
  const fileContents = {
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

  const [editorCode, setEditorCode] = useState(
    missionCompleted ? fileContents['FollowerSearch.kt'].optimized : fileContents['FollowerSearch.kt'].unoptimized
  );

  const handleFileClick = (fileName) => {
    setSelectedFile(fileName);
    if (fileName === 'FollowerSearch.kt') {
      setEditorCode(codeOptimized ? fileContents['FollowerSearch.kt'].optimized : fileContents['FollowerSearch.kt'].unoptimized);
    } else {
      setEditorCode(fileContents[fileName]);
    }
  };

  const handleLoadOptimized = () => {
    if (selectedFile === 'FollowerSearch.kt') {
      setCodeOptimized(true);
      setEditorCode(fileContents['FollowerSearch.kt'].optimized);
    }
  };

  const handleResetCode = () => {
    if (selectedFile === 'FollowerSearch.kt') {
      setCodeOptimized(false);
      setEditorCode(fileContents['FollowerSearch.kt'].unoptimized);
    }
  };

  const handleExecuteMission = async () => {
    setIsCompiling(true);
    setTerminalLogs([
      'Building Kotlin JVM module...',
      'Executing task: :compileKotlin',
      'Compilation Successful.',
      'Executing task: :test --tests "com.atlas.mission.SearchBenchmarks"',
      'Running performance suite for 50,000 followers...'
    ]);

    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api'}`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({
          userId: user.id,
          code: editorCode,
          fileName: selectedFile
        })
      });

      if (res.ok) {
        const reply = await res.json();
        setTerminalLogs(reply.logs);
        if (reply.success) {
          onCompleteMission(reply.user);
        }
      } else {
        const err = await res.json();
        setTerminalLogs(prev => [
          ...prev,
          `[ERROR] Execution failed: ${err.error || 'Server error'}`
        ]);
      }
    } catch (err) {
      console.error(err);
      setTerminalLogs(prev => [
        ...prev,
        '[ERROR] Connection lost. Failed to contact compiler node on port 5001.'
      ]);
    } finally {
      setIsCompiling(false);
    }
  };

  return (
    <div className="mission-ide-root">
      <div className="ide-layout-container">
        {/* Left Explorer Panel */}
        <aside className="ide-explorer glass-panel">
          <div className="panel-title font-mono">PROJECT EXPLORER</div>
          <div className="tree-folder">
            <div className="folder-name active font-mono">
              <Folder size={14} className="neon-purple" />
              <span>mission-scaling-search</span>
            </div>
            <div className="folder-children">
              <div className="folder-name font-mono">
                <Folder size={14} />
                <span>src/main/kotlin</span>
              </div>
              <div className="folder-children file-list">
                <div 
                  className={`file-item font-mono ${selectedFile === 'FollowerSearch.kt' ? 'active' : ''}`}
                  onClick={() => handleFileClick('FollowerSearch.kt')}
                >
                  <FileCode size={12} className="neon-cyan" />
                  <span>FollowerSearch.kt</span>
                </div>
                <div 
                  className={`file-item font-mono ${selectedFile === 'User.kt' ? 'active' : ''}`}
                  onClick={() => handleFileClick('User.kt')}
                >
                  <FileCode size={12} />
                  <span>User.kt</span>
                </div>
                <div 
                  className={`file-item font-mono ${selectedFile === 'FollowerEdge.kt' ? 'active' : ''}`}
                  onClick={() => handleFileClick('FollowerEdge.kt')}
                >
                  <FileCode size={12} />
                  <span>FollowerEdge.kt</span>
                </div>
              </div>

              <div className="folder-name font-mono">
                <Folder size={14} />
                <span>src/test/kotlin</span>
              </div>
              <div className="folder-children file-list">
                <div 
                  className={`file-item font-mono ${selectedFile === 'SearchBenchmarks.kt' ? 'active' : ''}`}
                  onClick={() => handleFileClick('SearchBenchmarks.kt')}
                >
                  <FileCode size={12} />
                  <span>SearchBenchmarks.kt</span>
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* Central Code Editor */}
        <main className="ide-editor-container glass-panel">
          <div className="editor-tab-header">
            <div className="tab-title font-mono active">
              <FileCode size={14} className="neon-cyan" />
              <span>{selectedFile}</span>
            </div>
            {selectedFile === 'FollowerSearch.kt' && (
              <div className="editor-controls">
                <button onClick={handleLoadOptimized} className="ctrl-btn load font-mono">
                  LOAD TRIE INDEX
                </button>
                <button onClick={handleResetCode} className="ctrl-btn reset font-mono">
                  RESET
                </button>
              </div>
            )}
          </div>

          <div className="editor-workspace">
            <div className="line-numbers font-mono">
              {Array.from({ length: editorCode.split('\n').length }).map((_, i) => (
                <div key={i}>{i + 1}</div>
              ))}
            </div>
            <textarea
              className="code-textarea font-mono"
              value={editorCode}
              onChange={e => setEditorCode(e.target.value)}
              readOnly={selectedFile !== 'FollowerSearch.kt'}
              spellCheck="false"
            />
          </div>
        </main>

        {/* Right Requirements Panel */}
        <aside className="ide-specs glass-panel">
          <div className="panel-title font-mono">MISSION SPECS</div>
          <div className="spec-content">
            <h2 className="spec-title">Followers Search Scale</h2>
            <div className="spec-tags">
              <span className="spec-pill difficulty font-mono">MEDIUM</span>
              <span className="spec-pill type font-mono">OPTIMIZATION</span>
            </div>
            <p className="spec-desc">
              Your task is to optimize the search query performance for follower prefix lookup.
              The Instagram engineering team reported that lookup latency increases linearly, failing their core SLAs.
            </p>

            <div className="spec-section">
              <h4>Constraints</h4>
              <ul className="spec-list font-mono">
                <li>Max dataset (N): 50,000</li>
                <li>Latency limit: &lt; 5.00 ms</li>
                <li>Memory budget: &lt; 10.00 MB</li>
              </ul>
            </div>

            <div className="spec-section">
              <h4>Expected Solution</h4>
              <p className="spec-desc">
                Instead of filtering the list on every search request (which is $O(N)$), index the users inside a 
                Trie structure. Searching a prefix of length $L$ inside a Trie is $O(L)$, resulting in stable query latency.
              </p>
            </div>

            <div className="spec-section">
              <h4>Verify Benchmark</h4>
              <button 
                onClick={handleExecuteMission} 
                disabled={isCompiling}
                className="neon-btn font-sans w-full"
              >
                {isCompiling ? (
                  <>
                    <RefreshCw size={16} className="animate-spin" /> Compiling JVM...
                  </>
                ) : (
                  <>
                    <Play size={16} /> Execute Mission
                  </>
                )}
              </button>
            </div>
          </div>
        </aside>
      </div>

      {/* Bottom Terminal & Compiler Panel */}
      <footer className="ide-terminal glass-panel">
        <div className="terminal-header font-mono">
          <div className="title">
            <Terminal size={14} className="neon-cyan" />
            <span>GRADLE DAEMON CONSOLE (BUILD OUT)</span>
          </div>
          <div className="terminal-indicator">
            <span className={`indicator-bulb ${isCompiling ? 'active' : ''}`}></span>
            <span>{isCompiling ? 'EXECUTING TEST' : 'IDLE'}</span>
          </div>
        </div>
        <div className="terminal-log-content font-mono">
          {terminalLogs.map((log, index) => (
            <div 
              key={index} 
              className={`log-line ${
                log.includes('PASS') || log.includes('SUCCESS') ? 'success' : 
                log.includes('FAILED') || log.includes('Error') || log.includes('❌') ? 'error' : ''
              }`}
            >
              {log}
            </div>
          ))}
        </div>
      </footer>
    </div>
  );
}
