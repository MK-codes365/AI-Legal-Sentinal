import { useState } from "react";

export default function Dashboard() {
    const data = JSON.parse(localStorage.getItem("analysis"));
    const [q, setQ] = useState("");
    const [a, setA] = useState("");

    if (!data) return <p>No data</p>;

    const ask = async () => {
        const res = await fetch("http://127.0.0.1:8000/ask-contract", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ question: q }),
        });
        const r = await res.json();
        setA(r.answer);
    };

    return (
        <div className="app">
            <div className="sidebar">
                <div>🏠</div>
                <div>📄</div>
                <div>⚠️</div>
                <div>❓</div>
            </div>

            <div className="main">
                <div className="header">
                    <h2>Dashboard</h2>
                    <span>🧑 Freelancer</span>
                </div>

                <div className="card welcome">
                    <div>
                        <h2>Contract Overview</h2>
                        <p>Here’s a quick summary of your contract risks.</p>
                    </div>
                    <div style={{ fontSize: "70px" }}>🐻</div>
                </div>

                <div className="stats">
                    <div className="stat-card">
                        <h3>Risk Score</h3>
                        <p>{data.risk_score}/100</p>
                    </div>
                    <div className="stat-card">
                        <h3>Flagged Clauses</h3>
                        <p>{data.total_flags}</p>
                    </div>
                    <div className="stat-card">
                        <h3>Country</h3>
                        <p>{data.country}</p>
                    </div>
                    <div className="stat-card">
                        <h3>Language</h3>
                        <p>{data.language}</p>
                    </div>
                </div>

                <div className="content">
                    <div className="card">
                        <h3>Risky Clauses</h3>
                        {data.risk_flags.map((f, i) => (
                            <p key={i}>
                                ⚠️ <strong>{f.title}</strong><br />
                                {f.explanation}
                            </p>
                        ))}
                    </div>

                    <div className="card">
                        <h3>Ask About Contract</h3>
                        <input
                            placeholder="Is there a non-compete?"
                            value={q}
                            onChange={(e) => setQ(e.target.value)}
                        />
                        <button onClick={ask}>Ask</button>
                        {a && <p style={{ marginTop: "10px" }}>{a}</p>}
                    </div>
                </div>
            </div>
        </div>
    );
}
