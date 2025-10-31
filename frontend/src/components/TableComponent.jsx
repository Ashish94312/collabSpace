// frontend/src/components/TableComponent.jsx
import React, { useState, useCallback } from 'react';

const INITIAL_ROWS = 3;
const INITIAL_COLS = 3;

function TableComponent({ initialData }) {
  const [tableData, setTableData] = useState(
    initialData || Array(INITIAL_ROWS).fill(0).map(() => Array(INITIAL_COLS).fill(''))
  );

  const numRows = tableData.length;
  const numCols = tableData[0]?.length || 0;

  // --- Logic Handlers ---
  const updateCell = useCallback((rowIndex, colIndex, value) => {
    setTableData(prevData => {
      const newData = prevData.map(row => [...row]);
      if (newData[rowIndex] && newData[rowIndex][colIndex] !== undefined) {
        newData[rowIndex][colIndex] = value;
      }
      return newData;
    });
  }, []);

  const addRow = useCallback((afterIndex) => {
    const newRow = Array(numCols).fill('');
    setTableData(prevData => [
      ...prevData.slice(0, afterIndex + 1),
      newRow,
      ...prevData.slice(afterIndex + 1),
    ]);
  }, [numCols]);

  const removeRow = useCallback((rowIndex) => {
    if (numRows > 1) {
      setTableData(prevData => prevData.filter((_, index) => index !== rowIndex));
    }
  }, [numRows]);

  const addColumn = useCallback((afterIndex) => {
    const newColIndex = afterIndex + 1;
    setTableData(prevData => prevData.map(row => [
      ...row.slice(0, newColIndex),
      '',
      ...row.slice(newColIndex),
    ]));
  }, []);

  const removeColumn = useCallback((colIndex) => {
    if (numCols > 1) {
      setTableData(prevData => prevData.map(row => row.filter((_, index) => index !== colIndex)));
    }
  }, [numCols]);

  // --- Rendering ---
  return (
    <div 
      className="content-table-wrapper"
      style={{ overflowX: 'auto', maxWidth: '100%', position: 'relative', padding: '5px' }} 
    >
      {/* Table Control Bar */}
      <div style={{ position: 'absolute', top: '0', right: '0', background: 'rgba(50, 50, 50, 0.8)', padding: '4px', borderRadius: '0 0 0 8px', zIndex: 10 }}>
          <button onMouseDown={(e) => { e.preventDefault(); addRow(numRows - 1); }} style={{ color: 'lightgreen', background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px', margin: '0 4px' }}>➕ Row</button>
          <button onMouseDown={(e) => { e.preventDefault(); removeRow(numRows - 1); }} disabled={numRows <= 1} style={{ color: 'pink', background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px', margin: '0 4px' }}>➖ Row</button>
          <button onMouseDown={(e) => { e.preventDefault(); addColumn(numCols - 1); }} style={{ color: 'lightblue', background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px', margin: '0 4px' }}>➕ Col</button>
          <button onMouseDown={(e) => { e.preventDefault(); removeColumn(numCols - 1); }} disabled={numCols <= 1} style={{ color: 'lightcoral', background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px', margin: '0 4px' }}>➖ Col</button>
      </div>

      <table className="custom-editable-table" style={{ borderCollapse: 'collapse', width: '100%', minWidth: '600px' }}>
        <tbody>
          {tableData.map((row, rowIndex) => (
            <tr key={rowIndex} style={{ borderTop: '1px solid #ccc' }}>
              {row.map((cellValue, colIndex) => (
                <td key={colIndex} style={{ padding: '0', border: '1px solid #374151', minWidth: '100px' }}>
                  <input
                    type="text"
                    value={cellValue}
                    onMouseDown={e => e.stopPropagation()}
                    onClick={e => e.stopPropagation()} 
                    onChange={(e) => updateCell(rowIndex, colIndex, e.target.value)}
                    placeholder={rowIndex === 0 ? `Header ${colIndex + 1}` : 'Cell'}
                    style={{
                        width: '100%', padding: '8px', border: 'none', 
                        backgroundColor: rowIndex === 0 ? '#4b5563' : '#374151',
                        color: 'white', fontSize: '14px', 
                        fontWeight: rowIndex === 0 ? 'bold' : 'normal'
                    }}
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default TableComponent;