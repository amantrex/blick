"use client";
import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import * as XLSX from "xlsx";
import Papa from "papaparse";

interface SheetData {
  name: string;
  data: any[][];
  headers: string[];
}

interface ImportProgress {
  total: number;
  processed: number;
  success: number;
  failed: number;
}

export default function ImportContactsPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [file, setFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState<string>("");
  const [sheets, setSheets] = useState<SheetData[]>([]);
  const [selectedSheet, setSelectedSheet] = useState<SheetData | null>(null);
  const [phoneColumn, setPhoneColumn] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [importProgress, setImportProgress] = useState<ImportProgress | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setFileName(selectedFile.name);
    setSheets([]);
    setSelectedSheet(null);
    setPhoneColumn("");
    setError(null);
    setSuccess(null);
    setImportProgress(null);

    // Process the file
    processFile(selectedFile);
  };

  const processFile = (selectedFile: File) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        
        const processedSheets: SheetData[] = [];
        
        workbook.SheetNames.forEach(sheetName => {
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
          
          if (jsonData.length > 0) {
            const headers = jsonData[0] as string[];
            const data = jsonData.slice(1) as any[][];
            
            processedSheets.push({
              name: sheetName,
              data,
              headers
            });
          }
        });

        setSheets(processedSheets);
        
        if (processedSheets.length === 0) {
          setError("No valid data found in the file");
        }
      } catch (err) {
        console.error("Error processing file:", err);
        setError("Failed to process the file. Please ensure it's a valid Excel or CSV file.");
      }
    };

    reader.readAsArrayBuffer(selectedFile);
  };

  const handleSheetSelect = (sheetName: string) => {
    const sheet = sheets.find(s => s.name === sheetName);
    setSelectedSheet(sheet || null);
    setPhoneColumn("");
  };

  const handlePhoneColumnSelect = (column: string) => {
    setPhoneColumn(column);
  };

  const handleImport = async () => {
    if (!selectedSheet || !phoneColumn || !file) {
      setError("Please select a sheet and phone column");
      return;
    }

    setIsProcessing(true);
    setError(null);
    setSuccess(null);

    try {
      // Filter rows that have phone numbers
      const validRows = selectedSheet.data.filter(row => {
        const phoneIndex = selectedSheet.headers.indexOf(phoneColumn);
        return phoneIndex >= 0 && row[phoneIndex] && row[phoneIndex].toString().trim() !== "";
      });

      if (validRows.length === 0) {
        setError("No rows with valid phone numbers found in the selected column");
        setIsProcessing(false);
        return;
      }

      setImportProgress({
        total: validRows.length,
        processed: 0,
        success: 0,
        failed: 0
      });

      // Create contacts in batches
      const batchSize = 10;
      let successCount = 0;
      let failedCount = 0;

      for (let i = 0; i < validRows.length; i += batchSize) {
        const batch = validRows.slice(i, i + batchSize);
        
        try {
          const contacts = batch.map(row => {
            const phoneIndex = selectedSheet.headers.indexOf(phoneColumn);
            const phone = row[phoneIndex]?.toString().trim() || "";
            
            // Map other columns to contact fields
            const contact: any = {
              phone,
              tags: [`${fileName}`, selectedSheet.name]
            };

            // Try to map common fields
            selectedSheet.headers.forEach((header, index) => {
              const value = row[index]?.toString().trim();
              if (value && index !== phoneIndex) {
                const lowerHeader = header.toLowerCase();
                if (lowerHeader.includes("name") || lowerHeader.includes("full name")) {
                  contact.name = value;
                } else if (lowerHeader.includes("email")) {
                  contact.email = value;
                } else if (lowerHeader.includes("tag") || lowerHeader.includes("category")) {
                  if (contact.tags) {
                    contact.tags.push(value);
                  } else {
                    contact.tags = [value];
                  }
                }
              }
            });

            // If no name found, use phone as fallback
            if (!contact.name) {
              contact.name = phone;
            }

            return contact;
          });

          // Send batch to API
          const response = await fetch("/api/contacts/import", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ contacts })
          });

          if (!response.ok) {
            throw new Error("Failed to import contacts");
          }

          successCount += contacts.length;
        } catch (err) {
          failedCount += batch.length;
        }

        setImportProgress(prev => prev ? {
          ...prev,
          processed: Math.min(prev.processed + batchSize, validRows.length),
          success: successCount,
          failed: failedCount
        } : null);
      }

      setSuccess(`Successfully imported ${successCount} contacts. ${failedCount > 0 ? `${failedCount} failed.` : ""}`);
      
      // Reset form
      setTimeout(() => {
        router.push("/dashboard/contacts");
      }, 2000);

    } catch (err: any) {
      setError(err.message || "An error occurred during import");
    } finally {
      setIsProcessing(false);
    }
  };

  const resetForm = () => {
    setFile(null);
    setFileName("");
    setSheets([]);
    setSelectedSheet(null);
    setPhoneColumn("");
    setError(null);
    setSuccess(null);
    setImportProgress(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Import Contacts</h1>
        <p className="text-gray-600 mt-2">
          Upload a CSV or Excel file to import multiple contacts at once
        </p>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        {/* Step 1: File Upload */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Step 1: Upload File</h2>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={handleFileSelect}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
            >
              Choose File
            </button>
            <p className="text-sm text-gray-500 mt-2">
              Supported formats: CSV, Excel (.xlsx, .xls)
            </p>
            {fileName && (
              <p className="text-sm text-green-600 mt-2">
                Selected: {fileName}
              </p>
            )}
          </div>
        </div>

        {/* Step 2: Sheet Selection */}
        {sheets.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Step 2: Select Sheet</h2>
            <select
              value={selectedSheet?.name || ""}
              onChange={(e) => handleSheetSelect(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Choose a sheet...</option>
              {sheets.map((sheet) => (
                <option key={sheet.name} value={sheet.name}>
                  {sheet.name} ({sheet.data.length} rows)
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Step 3: Column Mapping */}
        {selectedSheet && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Step 3: Map Phone Column</h2>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select the column containing phone numbers:
              </label>
              <select
                value={phoneColumn}
                onChange={(e) => handlePhoneColumnSelect(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Choose a column...</option>
                {selectedSheet.headers.map((header) => (
                  <option key={header} value={header}>
                    {header}
                  </option>
                ))}
              </select>
            </div>

            {/* Preview */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Preview (first 5 rows):</h4>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      {selectedSheet.headers.map((header) => (
                        <th
                          key={header}
                          className={`px-2 py-1 text-left ${
                            header === phoneColumn ? "bg-green-100 text-green-800" : ""
                          }`}
                        >
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {selectedSheet.data.slice(0, 5).map((row, rowIndex) => (
                      <tr key={rowIndex} className="border-b">
                        {row.map((cell, cellIndex) => (
                          <td
                            key={cellIndex}
                            className={`px-2 py-1 ${
                              selectedSheet.headers[cellIndex] === phoneColumn
                                ? "bg-green-50 font-medium"
                                : ""
                            }`}
                          >
                            {cell?.toString() || ""}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Import */}
        {selectedSheet && phoneColumn && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Step 4: Import Contacts</h2>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-blue-800">
                <strong>Import Summary:</strong>
                <br />
                • File: {fileName}
                <br />
                • Sheet: {selectedSheet.name}
                <br />
                • Phone Column: {phoneColumn}
                <br />
                • Total Rows: {selectedSheet.data.length}
                <br />
                • Estimated Contacts: {selectedSheet.data.filter(row => {
                  const phoneIndex = selectedSheet.headers.indexOf(phoneColumn);
                  return phoneIndex >= 0 && row[phoneIndex] && row[phoneIndex].toString().trim() !== "";
                }).length}
              </p>
            </div>

            <button
              onClick={handleImport}
              disabled={isProcessing}
              className="w-full bg-green-600 text-white py-3 px-4 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {isProcessing ? "Importing..." : "Start Import"}
            </button>
          </div>
        )}

        {/* Progress */}
        {importProgress && (
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Import Progress</h3>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span>Processed: {importProgress.processed}/{importProgress.total}</span>
                <span>{Math.round((importProgress.processed / importProgress.total) * 100)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(importProgress.processed / importProgress.total) * 100}%` }}
                ></div>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-green-600">Success: {importProgress.success}</span>
                <span className="text-red-600">Failed: {importProgress.failed}</span>
              </div>
            </div>
          </div>
        )}

        {/* Messages */}
        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
            {success}
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-between">
          <button
            onClick={() => router.push("/dashboard/contacts")}
            className="text-gray-600 hover:text-gray-800 px-4 py-2"
          >
            ← Back to Contacts
          </button>
          
          {file && (
            <button
              onClick={resetForm}
              className="text-gray-600 hover:text-gray-800 px-4 py-2"
            >
              Reset Form
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
