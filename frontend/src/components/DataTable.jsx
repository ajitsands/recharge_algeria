import React, { useState, useMemo } from 'react';
import { Search, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, ArrowUpDown, ArrowUp, ArrowDown, X } from 'lucide-react';

export default function DataTable({
  columns = [],
  data = [],
  keyField = 'id',
  defaultPageSize = 10,
  pageSizeOptions = [5, 10, 25, 50],
  defaultSortField = null,
  defaultSortDir = 'desc',
  searchPlaceholder = 'Search records...',
  lang = 'ar',
  emptyMessage = null
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState(defaultSortField);
  const [sortDir, setSortDir] = useState(defaultSortDir);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSizeState] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('razik_dt_page_size');
      if (saved && pageSizeOptions.includes(Number(saved))) {
        return Number(saved);
      }
    }
    return defaultPageSize;
  });

  const setPageSize = (size) => {
    setPageSizeState(size);
    if (typeof window !== 'undefined') {
      localStorage.setItem('razik_dt_page_size', size);
    }
  };

  // Filter Data
  const filteredData = useMemo(() => {
    if (!searchTerm.trim()) return data;
    const term = searchTerm.toLowerCase();

    return data.filter(row => {
      return Object.values(row).some(val => {
        if (val === null || val === undefined) return false;
        return String(val).toLowerCase().includes(term);
      });
    });
  }, [data, searchTerm]);

  // Sort Data
  const sortedData = useMemo(() => {
    if (!sortField) return filteredData;

    return [...filteredData].sort((a, b) => {
      let aVal = a[sortField];
      let bVal = b[sortField];

      // Number comparison
      if (!isNaN(parseFloat(aVal)) && !isNaN(parseFloat(bVal)) && isFinite(aVal) && isFinite(bVal)) {
        return sortDir === 'asc' ? parseFloat(aVal) - parseFloat(bVal) : parseFloat(bVal) - parseFloat(aVal);
      }

      // String comparison
      aVal = String(aVal || '').toLowerCase();
      bVal = String(bVal || '').toLowerCase();

      if (sortDir === 'asc') {
        return aVal.localeCompare(bVal);
      } else {
        return bVal.localeCompare(aVal);
      }
    });
  }, [filteredData, sortField, sortDir]);

  // Pagination Math
  const totalRecords = sortedData.length;
  const totalPages = Math.max(1, Math.ceil(totalRecords / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);

  const paginatedData = useMemo(() => {
    const start = (safeCurrentPage - 1) * pageSize;
    return sortedData.slice(start, start + pageSize);
  }, [sortedData, safeCurrentPage, pageSize]);

  const handleSort = (field) => {
    if (!field) return;
    if (sortField === field) {
      setSortDir(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  };

  const startIndex = totalRecords === 0 ? 0 : (safeCurrentPage - 1) * pageSize + 1;
  const endIndex = Math.min(safeCurrentPage * pageSize, totalRecords);

  return (
    <div className="datatable-wrapper" style={{ width: '100%' }}>
      {/* Top Controls: Search + Page Size */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px',
        marginBottom: '14px',
        padding: '2px 0'
      }}>
        {/* Search Input */}
        <div style={{ position: 'relative', minWidth: '260px', flex: '1', maxWidth: '420px' }}>
          <Search style={{
            position: 'absolute',
            [lang === 'ar' ? 'right' : 'left']: '12px',
            top: '50%',
            transform: 'translateY(-50%)',
            width: '15px',
            height: '15px',
            color: 'var(--text-muted)'
          }} />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            placeholder={searchPlaceholder || (lang === 'ar' ? 'بحث سريع وفوري في كافة الحقول...' : 'Fast search across all columns...')}
            className="filter-input"
            style={{
              width: '100%',
              paddingLeft: lang === 'ar' ? '32px' : '36px',
              paddingRight: lang === 'ar' ? '36px' : '32px',
              fontSize: '12.5px',
              borderRadius: '10px'
            }}
          />
          {searchTerm && (
            <button
              onClick={() => { setSearchTerm(''); setCurrentPage(1); }}
              style={{
                position: 'absolute',
                [lang === 'ar' ? 'left' : 'right']: '10px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--text-muted)',
                padding: '2px'
              }}
            >
              <X style={{ width: '14px', height: '14px' }} />
            </button>
          )}
        </div>

        {/* Page Size Selector & Total count badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
            {lang === 'ar' ? 'عرض:' : 'Show:'}
          </span>
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="filter-input"
            style={{
              padding: '5px 10px',
              fontSize: '12px',
              borderRadius: '8px',
              fontWeight: '700'
            }}
          >
            {pageSizeOptions.map(opt => (
              <option key={opt} value={opt}>
                {opt} {lang === 'ar' ? 'سجلات' : 'rows'}
              </option>
            ))}
          </select>

          <span style={{
            padding: '4px 10px',
            borderRadius: '8px',
            backgroundColor: 'var(--algeria-green-light)',
            color: 'var(--algeria-green)',
            fontSize: '11.5px',
            fontWeight: '800'
          }}>
            {totalRecords} {lang === 'ar' ? 'سجل' : 'records'}
          </span>
        </div>
      </div>

      {/* Table Container */}
      <div style={{ overflowX: 'auto', width: '100%', borderRadius: '12px', border: '1px solid var(--border-subtle)' }}>
        <table className="erp-table" style={{ width: '100%', borderCollapse: 'collapse', margin: 0 }}>
          <thead>
            <tr>
              {columns.map((col, idx) => {
                const isSortable = !!col.sortKey;
                const isCurrentSort = sortField === col.sortKey;

                return (
                  <th
                    key={col.key || idx}
                    onClick={() => isSortable && handleSort(col.sortKey)}
                    style={{
                      cursor: isSortable ? 'pointer' : 'default',
                      userSelect: 'none',
                      whiteSpace: 'nowrap',
                      textAlign: col.align || 'start',
                      padding: '12px 14px',
                      ...(col.style || {})
                    }}
                  >
                    <div style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      justifyContent: col.align === 'center' ? 'center' : (col.align === 'end' ? 'flex-end' : 'flex-start')
                    }}>
                      <span>{col.header}</span>
                      {isSortable && (
                        <span style={{ color: isCurrentSort ? 'var(--algeria-green)' : 'var(--text-muted)' }}>
                          {isCurrentSort ? (
                            sortDir === 'asc' ? <ArrowUp style={{ width: '13px', height: '13px' }} /> : <ArrowDown style={{ width: '13px', height: '13px' }} />
                          ) : (
                            <ArrowUpDown style={{ width: '12px', height: '12px', opacity: 0.5 }} />
                          )}
                        </span>
                      )}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {paginatedData.length > 0 ? (
              paginatedData.map((row, rIdx) => (
                <tr key={row[keyField] || rIdx}>
                  {columns.map((col, cIdx) => (
                    <td
                      key={col.key || cIdx}
                      style={{
                        textAlign: col.align || 'start',
                        padding: '12px 14px',
                        ...(col.cellStyle || {})
                      }}
                    >
                      {col.render ? col.render(row, rIdx) : row[col.key]}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columns.length} style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)', fontSize: '13px' }}>
                  {emptyMessage || (lang === 'ar' ? 'لا توجد بيانات مطابقة للبحث' : 'No matching records found')}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Bottom Pagination Controls */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px',
        marginTop: '12px',
        padding: '4px 2px',
        fontSize: '12px',
        color: 'var(--text-secondary)'
      }}>
        {/* Showing X to Y of Z */}
        <div>
          {lang === 'ar' ? (
            <span>
              عرض <strong style={{ color: 'var(--text-primary)' }}>{startIndex}</strong> إلى <strong style={{ color: 'var(--text-primary)' }}>{endIndex}</strong> من أصل <strong style={{ color: 'var(--text-primary)' }}>{totalRecords}</strong> عملية
            </span>
          ) : (
            <span>
              Showing <strong style={{ color: 'var(--text-primary)' }}>{startIndex}</strong> to <strong style={{ color: 'var(--text-primary)' }}>{endIndex}</strong> of <strong style={{ color: 'var(--text-primary)' }}>{totalRecords}</strong> entries
            </span>
          )}
        </div>

        {/* Page navigation buttons */}
        {totalPages > 1 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <button
              onClick={() => setCurrentPage(1)}
              disabled={safeCurrentPage === 1}
              style={{
                padding: '6px 8px',
                borderRadius: '8px',
                border: '1px solid var(--border-subtle)',
                backgroundColor: 'var(--bg-surface-alt)',
                color: safeCurrentPage === 1 ? 'var(--text-muted)' : 'var(--text-primary)',
                cursor: safeCurrentPage === 1 ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center'
              }}
              title="First Page"
            >
              {lang === 'ar' ? <ChevronsRight style={{ width: '14px', height: '14px' }} /> : <ChevronsLeft style={{ width: '14px', height: '14px' }} />}
            </button>

            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={safeCurrentPage === 1}
              style={{
                padding: '6px 10px',
                borderRadius: '8px',
                border: '1px solid var(--border-subtle)',
                backgroundColor: 'var(--bg-surface-alt)',
                color: safeCurrentPage === 1 ? 'var(--text-muted)' : 'var(--text-primary)',
                cursor: safeCurrentPage === 1 ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontWeight: '700'
              }}
            >
              {lang === 'ar' ? <ChevronRight style={{ width: '14px', height: '14px' }} /> : <ChevronLeft style={{ width: '14px', height: '14px' }} />}
              <span>{lang === 'ar' ? 'السابق' : 'Prev'}</span>
            </button>

            {/* Page number indicators */}
            <span style={{
              padding: '6px 12px',
              borderRadius: '8px',
              backgroundColor: 'var(--algeria-green)',
              color: '#ffffff',
              fontWeight: '800',
              fontFamily: 'monospace',
              fontSize: '12px'
            }}>
              {safeCurrentPage} / {totalPages}
            </span>

            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={safeCurrentPage === totalPages}
              style={{
                padding: '6px 10px',
                borderRadius: '8px',
                border: '1px solid var(--border-subtle)',
                backgroundColor: 'var(--bg-surface-alt)',
                color: safeCurrentPage === totalPages ? 'var(--text-muted)' : 'var(--text-primary)',
                cursor: safeCurrentPage === totalPages ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontWeight: '700'
              }}
            >
              <span>{lang === 'ar' ? 'التالي' : 'Next'}</span>
              {lang === 'ar' ? <ChevronLeft style={{ width: '14px', height: '14px' }} /> : <ChevronRight style={{ width: '14px', height: '14px' }} />}
            </button>

            <button
              onClick={() => setCurrentPage(totalPages)}
              disabled={safeCurrentPage === totalPages}
              style={{
                padding: '6px 8px',
                borderRadius: '8px',
                border: '1px solid var(--border-subtle)',
                backgroundColor: 'var(--bg-surface-alt)',
                color: safeCurrentPage === totalPages ? 'var(--text-muted)' : 'var(--text-primary)',
                cursor: safeCurrentPage === totalPages ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center'
              }}
              title="Last Page"
            >
              {lang === 'ar' ? <ChevronsLeft style={{ width: '14px', height: '14px' }} /> : <ChevronsRight style={{ width: '14px', height: '14px' }} />}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
