import { useState } from "react";

function App() {
    const [file, setFile] = useState(null);
    const [loading, setLoading] = useState(false);

    const upload = async () => {
        if (!file) return alert("Upload a contract");

        const fd = new FormData();
        fd.append("file", file);

        setLoading(true);
        const res = await fetch("http://127.0.0.1:8000/upload?country=india", {
            method: "POST",
            body: fd,
        });

        const data = await res.json();
        localStorage.setItem("analysis", JSON.stringify(data));
        window.location.href = "/dashboard";
    };

    return (
        <div className="app">
            <div className="sidebar">
                <div>📄</div>
                <div>⚖️</div>
                <div>📊</div>
            </div>

            <div className="main">
                <div className="card welcome">
                    <div>
                        <h1>Hi 👋</h1>
                        <p>Upload a contract to get legal insights instantly.</p>
                        <input type="file" onChange={(e) => setFile(e.target.files[0])} />
                        <button onClick={upload}>
                            {loading ? "Analyzing..." : "Upload Contract"}
                        </button>
                    </div>
                    <div style={{ fontSize: "80px" }}>🐻</div>
                </div>
            </div>
        </div>
    );
}

export default App;
