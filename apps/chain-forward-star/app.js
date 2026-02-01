const { useState, useEffect } = React;

const AdjacencyEdgeListViz = () => {
  const [nodes, setNodes] = useState([0, 1, 2, 3]);
  const [edges, setEdges] = useState([]);
  const [head, setHead] = useState(Array(4).fill(-1));
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [highlightedEdge, setHighlightedEdge] = useState(null);
  const [highlightedNode, setHighlightedNode] = useState(null);
  const [fromNode, setFromNode] = useState(0);
  const [toNode, setToNode] = useState(1);
  const [edgeWeight, setEdgeWeight] = useState(1);

  const nodePositions = {
    0: { x: 150, y: 100 },
    1: { x: 350, y: 100 },
    2: { x: 150, y: 250 },
    3: { x: 350, y: 250 }
  };

  const addEdge = () => {
    if (fromNode === toNode) return;

    const newEdge = {
      id: edges.length,
      to: toNode,
      weight: edgeWeight,
      next: head[fromNode],
      from: fromNode
    };

    setEdges([...edges, newEdge]);
    const newHead = [...head];
    newHead[fromNode] = edges.length;
    setHead(newHead);
    setHighlightedEdge(edges.length);

    setTimeout(() => setHighlightedEdge(null), 1000);
  };

  const reset = () => {
    setEdges([]);
    setHead(Array(4).fill(-1));
    setCurrentStep(0);
    setIsPlaying(false);
    setHighlightedEdge(null);
    setHighlightedNode(null);
  };

  const traverseEdges = (nodeId) => {
    setHighlightedNode(nodeId);
    let edgeId = head[nodeId];
    const edgeSequence = [];

    while (edgeId !== -1) {
      edgeSequence.push(edgeId);
      edgeId = edges[edgeId].next;
    }

    let idx = 0;
    const interval = setInterval(() => {
      if (idx < edgeSequence.length) {
        setHighlightedEdge(edgeSequence[idx]);
        idx++;
      } else {
        clearInterval(interval);
        setHighlightedEdge(null);
        setHighlightedNode(null);
      }
    }, 600);
  };

  const loadExample = () => {
    reset();
    setTimeout(() => {
      const exampleEdges = [
        { from: 0, to: 1, weight: 5 },
        { from: 0, to: 2, weight: 3 },
        { from: 1, to: 3, weight: 2 },
        { from: 2, to: 3, weight: 7 },
        { from: 3, to: 1, weight: 1 }
      ];

      exampleEdges.forEach((edge, i) => {
        setTimeout(() => {
          const newEdge = {
            id: i,
            to: edge.to,
            weight: edge.weight,
            next: i === 0 ? -1 : (edge.from === exampleEdges[i - 1].from ? i - 1 : -1),
            from: edge.from
          };

          setEdges((prev) => [...prev, newEdge]);

          setHead((prev) => {
            const newHead = [...prev];
            let shouldUpdate = true;

            for (let j = i - 1; j >= 0; j--) {
              if (exampleEdges[j].from === edge.from) {
                shouldUpdate = false;
                break;
              }
            }

            if (shouldUpdate || i === 0) {
              newEdge.next = newHead[edge.from];
              newHead[edge.from] = i;
            }

            return newHead;
          });

          setHighlightedEdge(i);
          setTimeout(() => setHighlightedEdge(null), 500);
        }, i * 800);
      });
    }, 100);
  };

  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-8 overflow-auto">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-4xl font-bold text-white mb-2">Adjacency Edge List Visualization</h1>
          <p className="text-purple-200">An efficient graph representation combining adjacency lists and edge lists</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Graph Visualization */}
          <div className="bg-slate-800/50 backdrop-blur rounded-lg p-6 border border-purple-500/30">
            <h2 className="text-xl font-semibold text-white mb-4">Graph Representation</h2>
            <svg width="500" height="350" className="bg-slate-900/50 rounded">
              {/* Draw edges */}
              {edges.map((edge) => {
                const from = nodePositions[edge.from];
                const to = nodePositions[edge.to];
                const isHighlighted = highlightedEdge === edge.id;

                const dx = to.x - from.x;
                const dy = to.y - from.y;
                const len = Math.sqrt(dx * dx + dy * dy);
                const unitX = dx / len;
                const unitY = dy / len;

                const endX = to.x - unitX * 25;
                const endY = to.y - unitY * 25;
                const startX = from.x + unitX * 25;
                const startY = from.y + unitY * 25;

                return (
                  <g key={edge.id}>
                    <line
                      x1={startX}
                      y1={startY}
                      x2={endX}
                      y2={endY}
                      stroke={isHighlighted ? "#a78bfa" : "#6366f1"}
                      strokeWidth={isHighlighted ? 3 : 2}
                      markerEnd="url(#arrowhead)"
                      className="transition-all duration-300"
                    />
                    <text
                      x={(startX + endX) / 2}
                      y={(startY + endY) / 2 - 5}
                      fill={isHighlighted ? "#a78bfa" : "#94a3b8"}
                      fontSize="14"
                      fontWeight={isHighlighted ? "bold" : "normal"}
                      className="transition-all duration-300"
                    >
                      w:{edge.weight}
                    </text>
                  </g>
                );
              })}

              <defs>
                <marker id="arrowhead" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
                  <polygon points="0 0, 10 3, 0 6" fill="#6366f1" />
                </marker>
              </defs>

              {/* Draw nodes */}
              {nodes.map((node) => (
                <g key={node} onClick={() => traverseEdges(node)} className="cursor-pointer">
                  <circle
                    cx={nodePositions[node].x}
                    cy={nodePositions[node].y}
                    r="25"
                    fill={highlightedNode === node ? "#a78bfa" : "#1e293b"}
                    stroke={highlightedNode === node ? "#c4b5fd" : "#8b5cf6"}
                    strokeWidth="3"
                    className="transition-all duration-300 hover:fill-slate-700"
                  />
                  <text
                    x={nodePositions[node].x}
                    y={nodePositions[node].y}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill="white"
                    fontSize="18"
                    fontWeight="bold"
                  >
                    {node}
                  </text>
                </g>
              ))}
            </svg>
            <p className="text-sm text-purple-200 mt-2">Click on a node to traverse its edges</p>
          </div>

          {/* Linked List Representation */}
          <div className="bg-slate-800/50 backdrop-blur rounded-lg p-6 border border-purple-500/30 overflow-auto">
            <h2 className="text-xl font-semibold text-white mb-4">Adjacency Linked List View</h2>

            <div className="space-y-4 max-h-[350px] overflow-y-auto">
              {nodes.map((node) => {
                const nodeEdges = [];
                let edgeId = head[node];

                while (edgeId !== -1 && edges[edgeId]) {
                  nodeEdges.push(edges[edgeId]);
                  edgeId = edges[edgeId].next;
                }

                return (
                  <div key={node} className="flex items-center gap-2 flex-wrap">
                    <div
                      className={`bg-purple-700 text-white px-3 py-2 rounded font-bold text-sm whitespace-nowrap ${
                        highlightedNode === node ? "ring-2 ring-purple-300" : ""
                      }`}
                    >
                      Node {node}
                    </div>

                    <span className="text-purple-400 flex-shrink-0 text-lg">›</span>

                    {nodeEdges.length === 0 ? (
                      <div className="bg-slate-900 text-slate-500 px-3 py-2 rounded text-sm">NULL</div>
                    ) : (
                      <div className="flex items-center gap-2 flex-wrap">
                        {nodeEdges.map((edge, idx) => (
                          <React.Fragment key={edge.id}>
                            <div
                              className={`bg-slate-900 border-2 px-3 py-2 rounded text-xs font-mono transition-all ${
                                highlightedEdge === edge.id
                                  ? "border-purple-400 shadow-lg shadow-purple-500/50"
                                  : "border-slate-700"
                              }`}
                            >
                              <div className="text-purple-300 mb-1">edge[{edge.id}]</div>
                              <div className="text-white">to: {edge.to}</div>
                              <div className="text-white">w: {edge.weight}</div>
                              <div className="text-slate-400">next: {edge.next}</div>
                            </div>

                            {idx < nodeEdges.length - 1 && (
                              <span className="text-slate-600 flex-shrink-0 text-lg">›</span>
                            )}
                          </React.Fragment>
                        ))}

                        <span className="text-slate-600 flex-shrink-0 text-lg">›</span>
                        <div className="bg-slate-900 text-slate-500 px-3 py-1 rounded text-xs">NULL</div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Arrays View */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Head Array */}
          <div className="bg-slate-800/50 backdrop-blur rounded-lg p-6 border border-purple-500/30">
            <h2 className="text-xl font-semibold text-white mb-4">head[] Array</h2>
            <div className="grid grid-cols-4 gap-2">
              {head.map((val, idx) => (
                <div
                  key={idx}
                  className={`bg-slate-900 rounded p-3 border-2 transition-all ${
                    highlightedNode === idx ? "border-purple-400" : "border-slate-700"
                  }`}
                >
                  <div className="text-xs text-purple-300">node {idx}</div>
                  <div className="text-lg font-mono text-white">{val}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Edges Array */}
          <div className="bg-slate-800/50 backdrop-blur rounded-lg p-6 border border-purple-500/30">
            <h2 className="text-xl font-semibold text-white mb-4">edges[] Array</h2>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {edges.length === 0 ? (
                <div className="text-slate-400 text-sm">No edges yet. Add some edges to see the structure!</div>
              ) : (
                edges.map((edge, idx) => (
                  <div
                    key={idx}
                    className={`bg-slate-900 rounded p-3 border-2 transition-all ${
                      highlightedEdge === idx ? "border-purple-400 shadow-lg shadow-purple-500/50" : "border-slate-700"
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-purple-300">edge[{idx}]</span>
                      <span className="text-xs text-slate-400">from node {edge.from}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 mt-2 text-sm font-mono">
                      <div>
                        <div className="text-xs text-slate-400">to</div>
                        <div className="text-white">{edge.to}</div>
                      </div>
                      <div>
                        <div className="text-xs text-slate-400">weight</div>
                        <div className="text-white">{edge.weight}</div>
                      </div>
                      <div>
                        <div className="text-xs text-slate-400">next</div>
                        <div className="text-white">{edge.next}</div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="bg-slate-800/50 backdrop-blur rounded-lg p-6 border border-purple-500/30">
          <h2 className="text-xl font-semibold text-white mb-4">Controls</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-medium text-purple-300 mb-3">Add Edge</h3>
              <div className="flex gap-3 items-end flex-wrap">
                <div>
                  <label className="text-xs text-slate-400 block mb-1">From</label>
                  <select
                    value={fromNode}
                    onChange={(e) => setFromNode(Number(e.target.value))}
                    className="bg-slate-900 text-white rounded px-3 py-2 border border-slate-700"
                  >
                    {nodes.map((n) => (
                      <option key={n} value={n}>
                        {n}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">To</label>
                  <select
                    value={toNode}
                    onChange={(e) => setToNode(Number(e.target.value))}
                    className="bg-slate-900 text-white rounded px-3 py-2 border border-slate-700"
                  >
                    {nodes.map((n) => (
                      <option key={n} value={n}>
                        {n}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Weight</label>
                  <input
                    type="number"
                    value={edgeWeight}
                    onChange={(e) => setEdgeWeight(Number(e.target.value))}
                    className="bg-slate-900 text-white rounded px-3 py-2 border border-slate-700 w-20"
                  />
                </div>
                <button
                  onClick={addEdge}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded flex items-center gap-2 transition-colors"
                >
                  <span className="text-lg leading-none">+</span>
                  Add
                </button>
              </div>
            </div>

            <div className="flex gap-3 items-end justify-end">
              <button
                onClick={loadExample}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded transition-colors"
              >
                Load Example
              </button>
              <button
                onClick={reset}
                className="bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded flex items-center gap-2 transition-colors"
              >
                <span className="text-lg leading-none">↺</span>
                Reset
              </button>
            </div>
          </div>
        </div>

        {/* Algorithm Explanation */}
        <div className="bg-slate-800/50 backdrop-blur rounded-lg p-6 border border-purple-500/30 mt-6">
          <h2 className="text-xl font-semibold text-white mb-3">How It Works</h2>
          <div className="text-purple-200 space-y-2 text-sm">
            <p>
              <strong className="text-purple-300">head[] array:</strong> Stores the index of the most recent edge added
              for each node (or -1 if no edges).
            </p>
            <p>
              <strong className="text-purple-300">edges[] array:</strong> Each edge stores its destination (to), weight,
              and a pointer (next) to the previous edge from the same source node.
            </p>
            <p>
              <strong className="text-purple-300">Traversal:</strong> To get all edges from node u, start at head[u] and
              follow the next pointers until reaching -1.
            </p>
            <p className="text-xs text-slate-400 mt-4">
              This creates a linked list structure within an array, combining O(1) edge insertion with efficient edge
              enumeration.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

// Mount to page
const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<AdjacencyEdgeListViz />);
