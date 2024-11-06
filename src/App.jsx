// App.jsx
import React, { useState } from 'react';
import DocViewer, { DocViewerRenderers } from "@cyntler/react-doc-viewer";
import mammoth from "mammoth";
import * as XLSX from "xlsx"; // Use * as XLSX to avoid import error

function App() {
  const [docs, setDocs] = useState([]);
  const [textContent, setTextContent] = useState("");
  const [tableContent, setTableContent] = useState(null);
  const [error, setError] = useState("");

  const handleFileChange = async (event) => {
    const selectedFiles = event.target.files;
    const updatedDocs = [];
    setTableContent(null); // Reset table content for each upload
    setTextContent(""); // Reset text content for each upload

    Array.from(selectedFiles).forEach(async (file) => {
      const fileURL = URL.createObjectURL(file);

      // Handle different file types
      if (file.type === "text/plain") {
        // Load text file content
        const content = await file.text();
        setTextContent(content);
      } else if (file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
        // Load DOCX content with mammoth
        try {
          const result = await mammoth.extractRawText({ arrayBuffer: await file.arrayBuffer() });
          setTextContent(result.value);
        } catch {
          setError("Failed to load DOCX file.");
        }
      } else if (file.type === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet") {
        // Load XLSX content with SheetJS and render as table
        const workbook = XLSX.read(await file.arrayBuffer(), { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 });

        setTableContent(jsonData); // Set table content
      } else {
        // Fallback to DocViewer for supported types
        updatedDocs.push({ uri: fileURL, fileType: file.type });
      }
    });

    setDocs(updatedDocs);
  };

  return (
    <div className="App">
      <h2>Upload and View Files</h2>
      <input type="file" onChange={handleFileChange} multiple />
      <button onClick={() => { setDocs([]); setTextContent(""); setTableContent(null); }}>Clear Files</button>
      {error && <p style={{ color: "red" }}>{error}</p>}

      {/* Render DocViewer for files like PDF */}
      {docs.length > 0 && (
        <DocViewer documents={docs} pluginRenderers={DocViewerRenderers} />
      )}

      {/* Render text content for TXT and DOCX */}
      {textContent && <pre style={{ whiteSpace: "pre-wrap" }}>{textContent}</pre>}

      {/* Render table for XLSX content */}
      {tableContent && (
        <table border="1" style={{ borderCollapse: "collapse", margin: "10px 0" }}>
          <tbody>
            {tableContent.map((row, rowIndex) => (
              <tr key={rowIndex}>
                {row.map((cell, cellIndex) => (
                  <td key={cellIndex} style={{ padding: "5px" }}>{cell}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default App;