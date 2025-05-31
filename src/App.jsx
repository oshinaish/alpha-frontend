
import React, { useState, useEffect } from "react";
import axios from "axios";

function App() {
  const [file, setFile] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    axios.get("https://budget-pdf-backend.onrender.com/get-categories")
      .then(res => {
        if (res.data.status === "success") {
          setCategories(res.data.memory);
        }
      });
  }, []);

  const handleFileUpload = async () => {
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);
    setLoading(true);

    const res = await axios.post("https://budget-pdf-backend.onrender.com/upload-pdf", formData);
    if (res.data.status === "success") {
      setTransactions(res.data.raw_transactions);
    }

    setLoading(false);
  };

  const handleCategoryChange = async (line, category) => {
    const res = await axios.post("https://budget-pdf-backend.onrender.com/save-category", { line, category });
    if (res.data.status === "success") {
      setCategories(prev => ({ ...prev, [line]: category }));
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <h1>Alpha Budget Uploader</h1>
      <input type="file" onChange={(e) => setFile(e.target.files[0])} />
      <button onClick={handleFileUpload} disabled={loading}>
        {loading ? "Uploading..." : "Upload PDF"}
      </button>

      {transactions.length > 0 && (
        <table border="1" style={{ marginTop: "20px", width: "100%" }}>
          <thead>
            <tr>
              <th>Transaction</th>
              <th>Category</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((line, index) => (
              <tr key={index}>
                <td>{line}</td>
                <td>
                  <input
                    type="text"
                    value={categories[line] || ""}
                    onChange={(e) => handleCategoryChange(line, e.target.value)}
                    placeholder="Enter category"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default App;
