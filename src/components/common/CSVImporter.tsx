import React, { useState } from 'react';
import { Upload, Download, AlertCircle, CheckCircle, X } from 'lucide-react';
import * as XLSX from 'xlsx';
import { User } from '../../types';
import toast from 'react-hot-toast';

interface CSVImporterProps {
  onImport: (data: Partial<User>[]) => Promise<void>;
  onClose: () => void;
  type: 'students' | 'teachers';
}

export const CSVImporter: React.FC<CSVImporterProps> = ({ onImport, onClose, type }) => {
  const [file, setFile] = useState<File | null>(null);
  const [data, setData] = useState<any[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [importing, setImporting] = useState(false);

  const requiredFields = type === 'students' 
    ? ['name', 'email', 'class', 'rollNumber']
    : ['name', 'email', 'qualification'];

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = event.target.files?.[0];
    if (!uploadedFile) return;

    setFile(uploadedFile);
    setErrors([]);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        // Validate data
        const validationErrors: string[] = [];
        const validData: any[] = [];

        jsonData.forEach((row: any, index) => {
          const missingFields = requiredFields.filter(field => !row[field]);
          if (missingFields.length > 0) {
            validationErrors.push(`Row ${index + 2}: Missing fields - ${missingFields.join(', ')}`);
          } else {
            validData.push(row);
          }
        });

        setErrors(validationErrors);
        setData(validData);
      } catch (error) {
        toast.error('Failed to parse file. Please check the format.');
      }
    };

    reader.readAsArrayBuffer(uploadedFile);
  };

  const handleImport = async () => {
    if (data.length === 0) return;

    setImporting(true);
    try {
      const userData: Partial<User>[] = data.map(row => ({
        name: row.name,
        email: row.email,
        role: type === 'students' ? 'student' : 'teacher',
        ...(type === 'students' && {
          classId: row.class,
          rollNumber: row.rollNumber,
          parentName: row.parentName,
          parentPhone: row.parentPhone,
        }),
        ...(type === 'teachers' && {
          qualification: row.qualification,
          phone: row.phone,
        }),
      }));

      await onImport(userData);
      toast.success(`${data.length} ${type} imported successfully!`);
      onClose();
    } catch (error) {
      toast.error('Failed to import data');
    } finally {
      setImporting(false);
    }
  };

  const downloadTemplate = () => {
    const templateData = type === 'students' 
      ? [{ name: 'John Doe', email: 'john@student.com', class: 'Grade 10A', rollNumber: '001', parentName: 'Jane Doe', parentPhone: '+1234567890' }]
      : [{ name: 'Jane Smith', email: 'jane@teacher.com', qualification: 'M.Ed Mathematics', phone: '+1234567890' }];

    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Template');
    XLSX.writeFile(wb, `${type}_template.xlsx`);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl p-8 w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <Upload className="w-6 h-6 text-blue-600" />
            Import {type.charAt(0).toUpperCase() + type.slice(1)}
          </h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Download Template */}
        <div className="mb-6 p-4 bg-blue-50 rounded-xl border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-semibold text-blue-900 mb-1">Download Template</h4>
              <p className="text-sm text-blue-700">
                Download the Excel template with the correct format
              </p>
            </div>
            <button
              onClick={downloadTemplate}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Download className="w-4 h-4" />
              Template
            </button>
          </div>
        </div>

        {/* File Upload */}
        <div className="mb-6">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Upload Excel File
          </label>
          <input
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={handleFileUpload}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
          />
        </div>

        {/* Validation Errors */}
        {errors.length > 0 && (
          <div className="mb-6 p-4 bg-red-50 rounded-xl border border-red-200">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <h4 className="font-semibold text-red-900">Validation Errors</h4>
            </div>
            <ul className="text-sm text-red-700 space-y-1">
              {errors.map((error, index) => (
                <li key={index}>• {error}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Data Preview */}
        {data.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <h4 className="font-semibold text-green-900">
                {data.length} valid records found
              </h4>
            </div>
            <div className="max-h-40 overflow-y-auto border border-gray-200 rounded-lg">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    {requiredFields.map(field => (
                      <th key={field} className="px-3 py-2 text-left font-medium text-gray-700">
                        {field.charAt(0).toUpperCase() + field.slice(1)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.slice(0, 5).map((row, index) => (
                    <tr key={index} className="border-t border-gray-200">
                      {requiredFields.map(field => (
                        <td key={field} className="px-3 py-2 text-gray-900">
                          {row[field]}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
              {data.length > 5 && (
                <div className="px-3 py-2 text-sm text-gray-500 bg-gray-50 border-t">
                  ... and {data.length - 5} more records
                </div>
              )}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-4">
          <button
            onClick={onClose}
            className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-semibold"
          >
            Cancel
          </button>
          <button
            onClick={handleImport}
            disabled={data.length === 0 || errors.length > 0 || importing}
            className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all font-semibold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {importing ? 'Importing...' : `Import ${data.length} Records`}
          </button>
        </div>
      </div>
    </div>
  );
};