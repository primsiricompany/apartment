import React, { useState } from 'react';

// นี่คือ Component หลักสำหรับแสดงผลหน้าตาเว็บของคุณ
export default function App() {
  const [count, setCount] = useState(0);

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <div style={styles.logoContainer}>
          <span style={styles.logo}>⚛️</span>
        </div>
        <h1 style={styles.title}>ยินดีต้อนรับสู่ React บน Vercel!</h1>
        <p style={styles.subtitle}>
          โครงสร้างโปรเจกต์ของคุณได้รับการจัดเตรียมเรียบร้อยแล้วและพร้อมใช้งาน
        </p>

        {/* ตัวอย่างการใช้งาน State ทั่วไป */}
        <div style={styles.card}>
          <p style={styles.cardText}>ทดสอบการทำงานของ React State:</p>
          <button style={styles.button} onClick={() => setCount(count + 1)}>
            คลิกสะสมคะแนน: {count}
          </button>
        </div>

        <div style={styles.statusBadge}>
          <span style={styles.dot}></span> พร้อมสำหรับการ Deploy บน Vercel
        </div>
      </header>
    </div>
  );
}

// สไตล์ CSS แบบ Inline เพื่อให้หน้าเว็บเริ่มต้นดูสวยงาม ทันสมัย และ Responsive
const styles = {
  container: {
    fontFamily: 'system-ui, -apple-system, sans-serif',
    backgroundColor: '#0f172a',
    color: '#f8fafc',
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
    boxSizing: 'border-box'
  },
  header: {
    textAlign: 'center',
    maxWidth: '600px',
    width: '100%'
  },
  logoContainer: {
    fontSize: '4rem',
    marginBottom: '20px',
    animation: 'spin 20s linear infinite'
  },
  title: {
    fontSize: '2.5rem',
    fontWeight: '800',
    margin: '0 0 10px 0',
    background: 'linear-gradient(to right, #38bdf8, #818cf8)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    letterSpacing: '-0.05em'
  },
  subtitle: {
    fontSize: '1.1rem',
    color: '#94a3b8',
    lineHeight: '1.6',
    margin: '0 0 30px 0'
  },
  card: {
    backgroundColor: '#1e293b',
    border: '1px solid #334155',
    borderRadius: '16px',
    padding: '24px',
    marginBottom: '30px',
    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3)'
  },
  cardText: {
    margin: '0 0 15px 0',
    color: '#cbd5e1'
  },
  button: {
    backgroundColor: '#3b82f6',
    color: '#ffffff',
    border: 'none',
    padding: '12px 24px',
    fontSize: '1rem',
    fontWeight: '600',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
    outline: 'none'
  },
  statusBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    backgroundColor: '#064e3b',
    color: '#34d399',
    padding: '6px 16px',
    borderRadius: '9999px',
    fontSize: '0.875rem',
    fontWeight: '500'
  },
  dot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    backgroundColor: '#10b981',
    display: 'inline-block'
  }
};