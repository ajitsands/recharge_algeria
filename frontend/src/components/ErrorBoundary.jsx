import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  handleReset = () => {
    try {
      localStorage.removeItem('razik_admin_active_tab');
      localStorage.removeItem('razik_dealer_screen');
    } catch (e) {}
    window.location.href = window.location.origin + window.location.pathname;
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#0f172a',
          color: '#ffffff',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          padding: '20px'
        }}>
          <div style={{
            maxWidth: '500px',
            width: '100%',
            backgroundColor: '#1e293b',
            borderRadius: '16px',
            padding: '32px',
            textAlign: 'center',
            boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
            border: '1px solid rgba(255,255,255,0.1)'
          }}>
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              backgroundColor: 'rgba(214, 40, 40, 0.2)',
              color: '#d21034',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px auto'
            }}>
              <AlertTriangle style={{ width: '32px', height: '32px' }} />
            </div>

            <h2 style={{ fontSize: '20px', fontWeight: '800', marginBottom: '10px' }}>
              حدث خطأ أثناء تحميل الصفحة
            </h2>
            <p style={{ fontSize: '13px', color: '#94a3b8', lineHeight: '1.6', marginBottom: '24px' }}>
              تم حفظ بياناتك بأمان. انقر على الزر أدناه لإعادة تحميل وتحديث التطبيق فوراً.
            </p>

            {this.state.error && (
              <pre style={{
                textAlign: 'left',
                backgroundColor: '#0f172a',
                padding: '12px',
                borderRadius: '8px',
                fontSize: '11px',
                color: '#f87171',
                overflowX: 'auto',
                marginBottom: '20px',
                maxHeight: '120px'
              }}>
                {this.state.error?.message || String(this.state.error)}
              </pre>
            )}

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={this.handleReset}
                style={{
                  flex: 1,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  padding: '12px 20px',
                  backgroundColor: '#008744',
                  color: '#ffffff',
                  borderRadius: '10px',
                  fontWeight: '700',
                  fontSize: '14px',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                <RefreshCw style={{ width: '16px', height: '16px' }} />
                <span>إعادة تحميل التطبيق (Reload)</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
