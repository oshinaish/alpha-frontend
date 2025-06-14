import React, { useState, useEffect, useMemo } from "react";
import axios from "axios"; // Using axios consistently as it's in your dependencies

function App() {
  const [file, setFile] = useState(null);
  const [transactions, setTransactions] = useState([]); // All transactions from PDF
  const [filteredTransactions, setFilteredTransactions] = useState([]); // Transactions after applying filters
  const [memory, setMemory] = useState({}); // Categorization memory (description -> category)
  const [categorized, setCategorized] = useState({}); // UI state for selected categories

  // State for filters
  const [selectedMonth, setSelectedMonth] = useState("all");
  const [selectedYear, setSelectedYear] = useState("all");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Hardcoded categories for selection (you mentioned configurable in PRD, this is a future task)
  const categories = ["Dining", "Travel", "Groceries", "Utilities", "Shopping", "Rent", "Others", "Income"]; 

  // Generate month and year options dynamically
  const months = useMemo(() => ([
    { value: "all", label: "All Months" },
    { value: "01", label: "January" }, { value: "02", label: "February" },
    { value: "03", label: "March" }, { value: "04", label: "April" },
    { value: "05", label: "May" }, { value: "06", label: "June" },
    { value: "07", label: "July" }, { value: "08", label: "August" },
    { value: "09", label: "September" }, { value: "10", label: "October" },
    { value: "11", label: "November" }, { value: "12", label: "December" },
  ]), []);

  const years = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const yearOptions = [{ value: "all", label: "All Years" }];
    // Generate years from current year back to 2000 (adjust range as needed)
    for (let i = currentYear; i >= 2000; i--) {
      yearOptions.push({ value: String(i), label: String(i) });
    }
    return yearOptions;
  }, []);

  // Fetch categorization memory on component mount
  useEffect(() => {
    axios.get("https://alpha-backend.onrender.com/get-categories")
      .then((res) => {
        if (res.data.status === "success") {
          setMemory(res.data.memory || {});
        } else {
          setError("Failed to load categories: " + res.data.message);
        }
      })
      .catch((err) => {
        setError("Network error fetching categories: " + err.message);
        console.error("Error fetching categories:", err);
      });
  }, []);

  // Effect to filter transactions whenever transactions, memory, or filters change
  useEffect(() => {
    const applyFilters = () => {
      let tempFiltered = transactions;

      // Apply month filter
      if (selectedMonth !== "all") {
        tempFiltered = tempFiltered.filter(tx => {
          // tx.date is expected to be 'YYYY-MM-DD'
          const txMonth = tx.date ? tx.date.substring(5, 7) : null; 
          return txMonth === selectedMonth;
        });
      }

      // Apply year filter
      if (selectedYear !== "all") {
        tempFiltered = tempFiltered.filter(tx => {
          // tx.date is expected to be 'YYYY-MM-DD'
          const txYear = tx.date ? tx.date.substring(0, 4) : null; 
          return txYear === selectedYear;
        });
      }
      setFilteredTransactions(tempFiltered);

      // Initialize categorized state based on filtered transactions and memory
      const initialCategorized = {};
      tempFiltered.forEach((tx) => {
        // Use the description directly as the key, matching backend
        initialCategorized[tx.description] = memory[tx.description] || "";
      });
      setCategorized(initialCategorized);

    };

    applyFilters(); 
  }, [transactions, memory, selectedMonth, selectedYear]); // Dependencies for re-filtering and re-categorizing UI


  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setError(null); // Clear previous errors
  };

  const uploadFile = async () => {
    if (!file) {
      alert("Please select a PDF file first!");
      return;
    }

    setIsLoading(true);
    setError(null); // Clear previous errors
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await axios.post("https://alpha-backend.onrender.com/upload-pdf", formData, {
        headers: {
          'Content-Type': 'multipart/form-data' // Important for FormData
        }
      });

      if (res.data.status === "success") {
        setTransactions(res.data.transactions); // Update 'transactions' with the new data
        // The useEffect will handle updating 'filteredTransactions' and 'categorized'
      } else {
        setError("Error extracting PDF: " + res.data.message);
      }
    } catch (err) {
      setError("Network error during PDF upload or API issue: " + err.message);
      console.error("Error uploading PDF:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCategoryChange = async (description, category) => {
    // Update local state immediately for responsiveness
    setCategorized((prev) => ({ ...prev, [description]: category }));

    try {
      await axios.post("https://alpha-backend.onrender.com/save-category", {
        description: description, // Send description as the key
        category: category,
      }, {
        headers: { "Content-Type": "application/json" }
      });
      // Update the memory state to reflect the successful save
      setMemory(prev => ({...prev, [description]: category}));

    } catch (err) {
      setError("Error saving category: " + err.message);
      console.error("Error saving category:", err);
      // Optionally, revert UI state if save fails for better UX
      // setCategorized((prev) => ({ ...prev, [description]: memory[description] || "" }));
    }
  };

  return (
    <div style={{ padding: "20px", fontFamily: "Arial", maxWidth: "900px", margin: "auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <h2 style={{ margin: 0 }}>BahiKhata - Budget Uploader</h2>
        <div style={{ display: "flex", gap: "10px" }}>
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            style={{ padding: "8px", borderRadius: "4px", border: "1px solid #ccc" }}
          >
            {months.map((m) => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </select>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            style={{ padding: "8px", borderRadius: "4px", border: "1px solid #ccc" }}
          >
            {years.map((y) => (
              <option key={y.value} value={y.value}>{y.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div style={{ marginBottom: "20px" }}>
        <input type="file" accept=".pdf" onChange={handleFileChange} />
        <button onClick={uploadFile} disabled={isLoading} style={{ marginLeft: "10px", padding: "8px 15px", cursor: "pointer", backgroundColor: isLoading ? '#ccc' : '#4CAF50', color: 'white', border: 'none', borderRadius: '4px' }}>
          {isLoading ? "Uploading..." : "Upload PDF"}
        </button>
      </div>

      {error && <p style={{ color: "red", backgroundColor: '#ffe6e6', border: '1px solid red', padding: '10px', borderRadius: '4px' }}>Error: {error}</p>}
      {isLoading && transactions.length === 0 && <p style={{ color: "#007bff" }}>Extracting transactions from PDF, please wait...</p>}

      {filteredTransactions.length > 0 && (
        <div style={{ marginTop: "20px" }}>
          <h3 style={{ marginBottom: "10px" }}>Transactions ({filteredTransactions.length} of {transactions.length} shown)</h3>
          <table border="1" cellPadding="10" cellSpacing="0" style={{ width: "100%", borderCollapse: "collapse", border: "1px solid #ddd" }}>
            <thead>
              <tr style={{ backgroundColor: "#f2f2f2" }}>
                <th style={{ textAlign: "left", padding: "12px", border: "1px solid #ddd" }}>Date</th>
                <th style={{ textAlign: "left", padding: "12px", border: "1px solid #ddd" }}>Description</th>
                <th style={{ textAlign: "left", padding: "12px", border: "1px solid #ddd" }}>Category</th>
              </tr>
            </thead>
            <tbody>
              {filteredTransactions.map((tx, idx) => (
                <tr key={tx.original_line || idx} style={{ borderBottom: "1px solid #eee" }}> {/* Use original_line as key if available, fallback to idx */}
                  <td style={{ padding: "8px", verticalAlign: "top", border: "1px solid #eee" }}>{tx.date}</td>
                  <td style={{ padding: "8px", verticalAlign: "top", border: "1px solid #eee" }}>{tx.description}</td>
                  <td style={{ padding: "8px", verticalAlign: "top", border: "1px solid #eee" }}>
                    <select
                      value={categorized[tx.description] || ""}
                      onChange={(e) => handleCategoryChange(tx.description, e.target.value)}
                      style={{ width: "100%", padding: "5px", borderRadius: "4px", border: "1px solid #ccc" }}
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