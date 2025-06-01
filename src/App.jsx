import React, { useState, useEffect } from "react";

function App() {
  const [file, setFile] = useState(null);
  const [lines, setLines] = useState([]);
  const [memory, setMemory] = useState({});
  const [categorized, setCategorized] = useState({});

  const categories = ["Dining", "Travel", "Groceries", "Utilities", "Shopping", "Rent", "Others"];

  useEffect(() => {
    fetch("https://alpha-backened.onrender.com/get-categories")
      .then((res) => res.json())
      .then((data) => {
        if (data.status === "success") setMemory(data.memory || {});
      });
  }, []);

  const handleFileChange = (e) => setFile(e.target.files[0]);

  const uploadFile = async () => {
    if (!file) return alert("Upload a PDF first!");

    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch("https://alpha-backened.onrender.com/upload-pdf", {
      method: "POST",
      body: formData,
    });

    const data = await res.json();
    if (data.status === "success") {
      setLines(data.raw_transactions);
      const initialCategorized = {};
      data.raw_transactions.forEach((line) => {
        initialCategorized[line] = memory[line] || "";
      });
      setCategorized(initialCategorized);
    } else {
      alert("Error extracting PDF");
    }
  };

  const handleCategoryChange = async (line, category) => {
    setCategorized((prev) => ({ ...prev, [line]: category }));

    await fetch("https://alpha-backened.onrender.com/save-category", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ line, category }),
    });
  };

  return (
    <div style={{ padding: "20px", fontFamily: "Arial" }}>
      <h2>Upload your bank statement</h2>
      <input type="file" accept=".pdf" onChange={handleFileChange} />
      <button onClick={uploadFile} style={{ marginLeft: "10px" }}>Upload</button>

      {lines.length > 0 && (
        <div style={{ marginTop: "20px" }}>
          <h3>Transactions</h3>
          <table border="1" cellPadding="10" cellSpacing="0">
            <thead>
              <tr>
                <th>Transaction</th>
                <th>Category</th>
              </tr>
            </thead>
            <tbody>
              {lines.map((line, idx) => (
                <tr key={idx}>
                  <td>{line}</td>
                  <td>
                    <select
                      value={categorized[line] || ""}
                      onChange={(e) => handleCategoryChange(line, e.target.value)}
                    >
                      <option value="">Select Category</option>
                      {categories.map((cat) => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default App;

