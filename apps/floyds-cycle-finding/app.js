const { useState, useEffect, useRef} = React;

const FloydCycleVisualizer = () => {
  const [tailLength, setTailLength] = useState(3);
  const [cycleLength, setCycleLength] = useState(5);
  const [speed, setSpeed] = useState(500);
  const [isPlaying, setIsPlaying] = useState(false);
  const [phase, setPhase] = useState('detection'); // detection, finding, measuring
  const [slowPos, setSlowPos] = useState(0);
  const [fastPos, setFastPos] = useState(0);
  const [stepCount, setStepCount] = useState(0);
  const [meetingPoint, setMeetingPoint] = useState(null);
  const [cycleStart, setCycleStart] = useState(null);
  const [measuredLength, setMeasuredLength] = useState(null);
  const [showProof, setShowProof] = useState(false);
  const intervalRef = useRef(null);

  const totalNodes = tailLength + cycleLength;

  const getNextPos = (pos) => {
    if (pos < tailLength - 1) return pos + 1;
    const cyclePos = (pos - tailLength + 1) % cycleLength;
    return tailLength + cyclePos;
  };

  const reset = () => {
    setIsPlaying(false);
    setPhase('detection');
    setSlowPos(0);
    setFastPos(0);
    setStepCount(0);
    setMeetingPoint(null);
    setCycleStart(null);
    setMeasuredLength(null);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
  };

  useEffect(() => {
    reset();
  }, [tailLength, cycleLength]);

  useEffect(() => {
    if (!isPlaying) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }

    intervalRef.current = setInterval(() => {
      if (phase === 'detection') {
        setSlowPos(prev => {
          const newSlow = getNextPos(prev);
          setFastPos(prevFast => {
            let newFast = getNextPos(prevFast);
            newFast = getNextPos(newFast);
            
            setStepCount(s => s + 1);
            
            if (newSlow === newFast) {
              setMeetingPoint(newSlow);
              setPhase('finding');
              setSlowPos(0);
              setFastPos(newFast);
              setStepCount(0);
            }
            
            return newFast;
          });
          return newSlow;
        });
      } else if (phase === 'finding') {
        if (slowPos === fastPos) {
          setCycleStart(slowPos);
          setPhase('measuring');
          setFastPos(getNextPos(slowPos));
          setStepCount(1);
        } else {
          setSlowPos(getNextPos(slowPos));
          setFastPos(getNextPos(fastPos));
          setStepCount(s => s + 1);
        }
      } else if (phase === 'measuring') {
        if (slowPos === fastPos) {
          setMeasuredLength(stepCount);
          setIsPlaying(false);
        } else {
          setFastPos(getNextPos(fastPos));
          setStepCount(s => s + 1);
        }
      }
    }, speed);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isPlaying, phase, slowPos, fastPos, speed]);

  const getNodePosition = (index) => {
    const centerX = 400;
    const centerY = 300;
    const radius = 150;
    
    if (index < tailLength) {
      const startX = centerX - radius - 100;
      const startY = centerY - (tailLength - 1) * 30;
      return { x: startX, y: startY + index * 60 };
    }
    
    const cycleIndex = index - tailLength;
    const angle = (cycleIndex / cycleLength) * 2 * Math.PI - Math.PI / 2;
    return {
      x: centerX + radius * Math.cos(angle),
      y: centerY + radius * Math.sin(angle)
    };
  };

  const getCurrentPhaseDescription = () => {
    if (phase === 'detection') {
      return `Phase 1: Detection - Slow pointer moves 1 step, fast pointer moves 2 steps. Steps: ${stepCount}`;
    } else if (phase === 'finding') {
      return `Phase 2: Finding cycle start - Both pointers move 1 step. Steps: ${stepCount}`;
    } else if (phase === 'measuring') {
      return `Phase 3: Measuring cycle length - Moving around the cycle. Steps: ${stepCount}`;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
          Floyd's Cycle Detection Algorithm
        </h1>
        <p className="text-slate-300 mb-8">The Tortoise and Hare Algorithm</p>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
            <label className="block text-sm font-medium mb-2">Tail Length (nodes before cycle)</label>
            <input
              type="range"
              min="0"
              max="6"
              value={tailLength}
              onChange={(e) => setTailLength(parseInt(e.target.value))}
              className="w-full"
            />
            <div className="text-center text-2xl font-bold text-blue-400 mt-2">{tailLength}</div>
          </div>

          <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
            <label className="block text-sm font-medium mb-2">Cycle Length (nodes in cycle)</label>
            <input
              type="range"
              min="3"
              max="8"
              value={cycleLength}
              onChange={(e) => setCycleLength(parseInt(e.target.value))}
              className="w-full"
            />
            <div className="text-center text-2xl font-bold text-purple-400 mt-2">{cycleLength}</div>
          </div>

          <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
            <label className="block text-sm font-medium mb-2">Animation Speed</label>
            <input
              type="range"
              min="100"
              max="1000"
              step="100"
              value={speed}
              onChange={(e) => setSpeed(parseInt(e.target.value))}
              className="w-full"
            />
            <div className="text-center text-sm text-slate-400 mt-2">
              {speed < 400 ? 'Fast' : speed < 700 ? 'Medium' : 'Slow'}
            </div>
          </div>
        </div>

        <div className="bg-slate-800 rounded-lg p-6 border border-slate-700 mb-6">
          <div className="flex gap-4 mb-4">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg font-medium transition"
            >
              {isPlaying ? <span className="text-lg leading-none">⏸</span> : <span className="text-lg leading-none">▶</span>}
              {isPlaying ? 'Pause' : 'Play'}
            </button>
            <button
              onClick={reset}
              className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 px-6 py-3 rounded-lg font-medium transition"
            >
              <span className="text-lg leading-none">↺</span>
              Reset
            </button>
          </div>

          <div className="text-sm text-slate-300 mb-4">{getCurrentPhaseDescription()}</div>

          <svg width="800" height="600" className="mx-auto">
            {/* Draw edges */}
            {Array.from({ length: totalNodes }).map((_, i) => {
              const start = getNodePosition(i);
              const end = getNodePosition(getNextPos(i));
              return (
                <line
                  key={`edge-${i}`}
                  x1={start.x}
                  y1={start.y}
                  x2={end.x}
                  y2={end.y}
                  stroke="#475569"
                  strokeWidth="2"
                  markerEnd="url(#arrowhead)"
                />
              );
            })}

            <defs>
              <marker id="arrowhead" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
                <polygon points="0 0, 10 3, 0 6" fill="#475569" />
              </marker>
            </defs>

            {/* Draw nodes */}
            {Array.from({ length: totalNodes }).map((_, i) => {
              const pos = getNodePosition(i);
              const isCycleNode = i >= tailLength;
              const isMeeting = meetingPoint === i;
              const isStart = cycleStart === i;
              
              return (
                <g key={`node-${i}`}>
                  <circle
                    cx={pos.x}
                    cy={pos.y}
                    r="25"
                    fill={isStart ? '#10b981' : isMeeting ? '#f59e0b' : isCycleNode ? '#8b5cf6' : '#3b82f6'}
                    stroke={isStart || isMeeting ? '#fff' : 'none'}
                    strokeWidth="3"
                  />
                  <text
                    x={pos.x}
                    y={pos.y}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill="white"
                    fontSize="14"
                    fontWeight="bold"
                  >
                    {i}
                  </text>
                </g>
              );
            })}

            {/* Draw pointers */}
            {phase === 'detection' && (
              <>
                <circle
                  cx={getNodePosition(slowPos).x}
                  cy={getNodePosition(slowPos).y - 40}
                  r="15"
                  fill="#22d3ee"
                  stroke="#fff"
                  strokeWidth="2"
                />
                <text
                  x={getNodePosition(slowPos).x}
                  y={getNodePosition(slowPos).y - 40}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill="#000"
                  fontSize="12"
                  fontWeight="bold"
                >
                  S
                </text>
                <circle
                  cx={getNodePosition(fastPos).x}
                  cy={getNodePosition(fastPos).y + 40}
                  r="15"
                  fill="#f472b6"
                  stroke="#fff"
                  strokeWidth="2"
                />
                <text
                  x={getNodePosition(fastPos).x}
                  y={getNodePosition(fastPos).y + 40}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill="#000"
                  fontSize="12"
                  fontWeight="bold"
                >
                  F
                </text>
              </>
            )}

            {(phase === 'finding' || phase === 'measuring') && (
              <>
                <circle
                  cx={getNodePosition(slowPos).x}
                  cy={getNodePosition(slowPos).y - 40}
                  r="15"
                  fill="#22d3ee"
                  stroke="#fff"
                  strokeWidth="2"
                />
                <text
                  x={getNodePosition(slowPos).x}
                  y={getNodePosition(slowPos).y - 40}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill="#000"
                  fontSize="12"
                  fontWeight="bold"
                >
                  A
                </text>
                <circle
                  cx={getNodePosition(fastPos).x}
                  cy={getNodePosition(fastPos).y + 40}
                  r="15"
                  fill="#f472b6"
                  stroke="#fff"
                  strokeWidth="2"
                />
                <text
                  x={getNodePosition(fastPos).x}
                  y={getNodePosition(fastPos).y + 40}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill="#000"
                  fontSize="12"
                  fontWeight="bold"
                >
                  B
                </text>
              </>
            )}
          </svg>

          <div className="flex gap-6 justify-center mt-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-blue-500"></div>
              <span>Tail nodes</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-purple-500"></div>
              <span>Cycle nodes</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-amber-500 border-2 border-white"></div>
              <span>Meeting point</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-green-500 border-2 border-white"></div>
              <span>Cycle start</span>
            </div>
          </div>

          {measuredLength !== null && (
            <div className="mt-6 p-4 bg-green-900 border border-green-700 rounded-lg text-center">
              <p className="font-bold text-lg">Algorithm Complete!</p>
              <p className="text-sm mt-2">
                Cycle starts at node {cycleStart} • Cycle length: {measuredLength}
              </p>
            </div>
          )}
        </div>

        <div className="bg-slate-800 rounded-lg border border-slate-700">
          <button
            onClick={() => setShowProof(!showProof)}
            className="w-full p-6 flex items-center justify-between hover:bg-slate-750 transition"
          >
            <h2 className="text-2xl font-bold">Understanding the Proof</h2>
            {showProof ? <span className="text-base">⌃</span> : <span className="text-base">⌄</span>}
          </button>

          {showProof && (
            <div className="p-6 border-t border-slate-700 space-y-6">
              <section>
                <h3 className="text-xl font-bold text-blue-400 mb-3">Part 1: Why do the pointers meet?</h3>
                <p className="text-slate-300 mb-3">
                  Imagine the slow pointer (tortoise) enters the cycle first. Once both pointers are inside the cycle, 
                  the fast pointer (hare) is essentially "chasing" the slow pointer around the loop.
                </p>
                <p className="text-slate-300 mb-3">
                  Each step, the fast pointer gets 1 node closer to the slow pointer (it moves 2 while slow moves 1). 
                  Since the cycle is finite, eventually the distance between them becomes 0 and they meet.
                </p>
                <div className="bg-slate-900 p-4 rounded border border-slate-600">
                  <p className="text-sm font-mono text-cyan-300">
                    Example: If they're 5 nodes apart in a cycle, after 5 steps they'll be at the same node.
                  </p>
                </div>
              </section>

              <section>
                <h3 className="text-xl font-bold text-purple-400 mb-3">Part 2: The magic of the meeting point</h3>
                <p className="text-slate-300 mb-3">
                  When they meet, let's say the slow pointer has taken <strong>k</strong> steps total. 
                  This means the fast pointer has taken <strong>2k</strong> steps (twice as many).
                </p>
                <p className="text-slate-300 mb-3">
                  Here's the key insight: both pointers are at the same location, but the fast pointer has traveled 
                  exactly <strong>k</strong> more steps than the slow pointer. Since they're at the same spot, 
                  those extra <strong>k</strong> steps must be complete loops around the cycle!
                </p>
                <p className="text-slate-300 mb-3">
                  This means <strong>k</strong> is a multiple of the cycle length. In other words, if the cycle 
                  has length C, then k = n × C for some whole number n.
                </p>
                <div className="bg-slate-900 p-4 rounded border border-slate-600">
                  <p className="text-sm font-mono text-purple-300">
                    If slow took 12 steps and cycle length is 4: fast took 24 steps = 12 steps + 3 complete loops
                  </p>
                </div>
              </section>

              <section>
                <h3 className="text-xl font-bold text-green-400 mb-3">Part 3: Finding where the cycle starts</h3>
                <p className="text-slate-300 mb-3">
                  Now we reset the slow pointer to the start (node 0) and keep the fast pointer where they met. 
                  We move both pointers <strong>one step at a time</strong> (same speed now).
                </p>
                <p className="text-slate-300 mb-3">
                  Let's say there are <strong>μ</strong> nodes before the cycle starts (the "tail"). When the slow pointer 
                  reaches the cycle start after μ steps, the fast pointer will have also moved μ steps from the meeting point.
                </p>
                <p className="text-slate-300 mb-3">
                  Since we know the meeting point is positioned such that k steps divides evenly into the cycle, 
                  moving μ more steps brings the fast pointer back to the cycle start. They meet exactly at the first node of the cycle!
                </p>
                <div className="bg-slate-900 p-4 rounded border border-slate-600">
                  <p className="text-sm font-mono text-green-300">
                    The math: If tail = 3 and cycle = 4, and they met after slow walked 6 steps, 
                    then 6 = 3 (tail) + 3 (into cycle). Moving slow 3 more from start and fast 3 more from meeting point 
                    both land at the cycle start.
                  </p>
                </div>
              </section>

              <section>
                <h3 className="text-xl font-bold text-amber-400 mb-3">Part 4: Measuring the cycle length</h3>
                <p className="text-slate-300 mb-3">
                  Once we know where the cycle starts, we can measure its length easily. Keep one pointer at the cycle start, 
                  and move the other pointer around the cycle counting steps.
                </p>
                <p className="text-slate-300 mb-3">
                  When the moving pointer comes back to meet the stationary pointer, the number of steps taken 
                  is exactly the cycle length!
                </p>
                <div className="bg-slate-900 p-4 rounded border border-slate-600">
                  <p className="text-sm font-mono text-amber-300">
                    Simple: start at node 5, walk around, count 1, 2, 3... until you're back at node 5. That count is the cycle length.
                  </p>
                </div>
              </section>

              <section className="border-t border-slate-600 pt-6">
                <h3 className="text-xl font-bold text-cyan-400 mb-3">Summary: Why it works</h3>
                <ol className="space-y-3 text-slate-300">
                  <li>
                    <strong className="text-cyan-300">1.</strong> Fast pointer catches slow pointer because it gains 1 node per step in the cycle
                  </li>
                  <li>
                    <strong className="text-cyan-300">2.</strong> At meeting point, slow has walked k steps, fast has walked 2k steps (k extra complete loops)
                  </li>
                  <li>
                    <strong className="text-cyan-300">3.</strong> Because k is a multiple of cycle length, moving both pointers at the same speed from (start, meeting point) makes them meet at cycle start
                  </li>
                  <li>
                    <strong className="text-cyan-300">4.</strong> Cycle length is measured by walking around once from the cycle start
                  </li>
                </ol>
              </section>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Mount to page
const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<FloydCycleVisualizer />);