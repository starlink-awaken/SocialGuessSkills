import { useState } from 'react';
import { HypothesisForm } from './components/HypothesisForm';
import { exportToJSON, downloadJSON, exportToMarkdown, downloadMarkdown } from './lib/export';
import type { Hypothesis } from './types';
import './index.css';

function App() {
  const [hypothesis, setHypothesis] = useState<Hypothesis | null>(null);
  const [workflowProgress, setWorkflowProgress] = useState<any>(null);
  const [model, setModel] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleRunAnalysis = async (hypothesisData: Hypothesis) => {
    setLoading(true);
    setHypothesis(hypothesisData);
    setWorkflowProgress({ iteration: 1, converged: false, agents: [] });
    setModel(null);

    try {
      await new Promise(resolve => setTimeout(resolve, 1000));

      setWorkflowProgress({
        iteration: 1,
        converged: true,
        agents: [
          { agentType: 'systems', status: 'completed' },
          { agentType: 'econ', status: 'completed' },
          { agentType: 'socio', status: 'completed' },
          { agentType: 'governance', status: 'completed' },
          { agentType: 'culture', status: 'completed' },
          { agentType: 'risk', status: 'completed' },
          { agentType: 'validation', status: 'completed' },
        ],
      });

      setModel({
        hypothesis: hypothesisData,
        systemStructure: {
          coreAgents: [],
          interactionPatterns: [],
          governanceStructure: [],
          economicModel: {},
          culturalNorms: [],
          technologyLevel: 'modern',
        },
        agentOutputs: [],
        conflicts: [],
        confidenceScore: 0.85,
        iterationCount: 1,
      });
    } catch (error) {
      console.error('Error running analysis:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>SocialGuess - Social System Modeling</h1>
      </header>

      <main className="app-main">
        {!hypothesis && (
          <section className="section">
            <HypothesisForm
              onSubmit={handleRunAnalysis}
              disabled={loading}
            />
          </section>
        )}

        {workflowProgress && (
          <section className="section">
            <h2>Workflow Progress</h2>
            <div className="workflow-progress">
              <div className="progress-info">
                <p>Iteration: {workflowProgress.iteration}</p>
                <p>Converged: {workflowProgress.converged ? 'Yes' : 'No'}</p>
              </div>

              <div className="agents-grid">
                {workflowProgress.agents?.map((agent: any) => (
                  <div
                    key={agent.agentType}
                    className={`agent-card agent-${agent.status}`}
                  >
                    <h3>{agent.agentType}</h3>
                    <p className={`status ${agent.status}`}>
                      {agent.status}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {model && (
          <section className="section">
            <div className="section-header">
              <h2>Model Results</h2>
              <div className="export-buttons">
                <button
                  type="button"
                  onClick={() => {
                    if (hypothesis) {
                      const jsonData = exportToJSON(model, hypothesis);
                      downloadJSON(jsonData);
                    }
                  }}
                  className="export-button json"
                >
                  Export JSON
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (hypothesis) {
                      const mdData = exportToMarkdown(model, hypothesis);
                      downloadMarkdown(mdData);
                    }
                  }}
                  className="export-button md"
                >
                  Export Markdown
                </button>
              </div>
            </div>
            <div className="model-results">
              <div className="result-card">
                <h3>Confidence Score</h3>
                <p className="confidence">{(model.confidenceScore * 100).toFixed(1)}%</p>
              </div>

              <div className="result-card">
                <h3>Iterations</h3>
                <p>{model.iterationCount}</p>
              </div>

              <div className="result-card">
                <h3>Converged</h3>
                <p>{workflowProgress?.converged ? 'Yes' : 'No'}</p>
              </div>

              <div className="result-card full-width">
                <h3>Hypothesis</h3>
                <div className="hypothesis-display">
                  <div>
                    <strong>Assumptions:</strong>
                    <ul>
                      {model.hypothesis.assumptions.map((a: string, i: number) => (
                        <li key={i}>{a}</li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <strong>Constraints:</strong>
                    <ul>
                      {model.hypothesis.constraints.map((c: string, i: number) => (
                        <li key={i}>{c}</li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <strong>Goals:</strong>
                    <ul>
                      {model.hypothesis.goals.map((g: string, i: number) => (
                        <li key={i}>{g}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

export default App;
