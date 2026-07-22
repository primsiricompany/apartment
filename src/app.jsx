import React, { useState, useEffect } from 'react';

export default function App() {
  // --- States ---
  const [rooms, setRooms] = useState([]);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [operatorName, setOperatorName] = useState('แอดมินหลัก');
  const [googleSheetUrl, setGoogleSheetUrl] = useState('');
  const [electricRate, setElectricRate] = useState(8);
  const [waterRate, setWaterRate] = useState(18);
  const [filterTenantType, setFilterTenantType] = useState('all');
  const [isAlertBannerOpen, setIsAlertBannerOpen] = useState(true);

  // States สำหรับซ่อมบำรุง
  const [maintenanceData, setMaintenanceData] = useState([
    { id: 1, datetime: "15/07/2026 09:00", location: "ทางเดิน/ทางหนีไฟ", detail: "หลอดไฟทางเดินชั้น 2 ขาด", priority: "ปานกลาง", status: "กำลังดำเนินการ" },
    { id: 2, datetime: "14/07/2026 14:30", location: "ที่จอดรถยนต์/มอเตอร์ไซค์", detail: "ขยะเต็มถังหลักส่วนกลาง", priority: "ต่ำ", status: "เสร็จสิ้น" }
  ]);
  const [maintLocation, setMaintLocation] = useState('ทางเดิน/ทางหนีไฟ');
  const [maintPriority, setMaintPriority] = useState('ต่ำ');
  const [maintDetail, setMaintDetail] = useState('');

  // States สำหรับประวัติการแก้ไข (Audit Log)
  const [auditLogs, setAuditLogs] = useState([
    { timestamp: "15/07/2026 11:30", action: "เปิดระบบและเตรียมการทำงาน", operator: "ระบบอัตโนมัติ" }
  ]);

  // States สำหรับบิลและการคำนวณ
  const [billingRoomId, setBillingRoomId] = useState('');
  const [billingElecCurr, setBillingElecCurr] = useState(0);
  const [billingWaterCurr, setBillingWaterCurr] = useState(0);
  const [billingOtherName, setBillingOtherName] = useState('');
  const [billingOtherPrice, setBillingOtherPrice] = useState(0);

  // States สำหรับ Modal แก้ไขข้อมูลห้อง
  const [isRoomModalOpen, setIsRoomModalOpen] = useState(false);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [tempOperatorName, setTempOperatorName] = useState('');

  // ฟอร์มสำหรับแก้ไขรายละเอียดใน Modal (รวมถึงแก้ไขชื่อ/เลขห้องด้วย)
  const [editingRoomOriginalId, setEditingRoomOriginalId] = useState(''); // เพื่ออ้างอิงตอนกดเซฟ
  const [modalRoomId, setModalRoomId] = useState(''); // ฟิลด์แก้ไขชื่อห้อง
  const [modalStatus, setModalStatus] = useState('ว่าง');
  const [modalRent, setModalRent] = useState(3500);
  const [modalTenantName, setModalTenantName] = useState('');
  const [modalTenantPhone, setModalTenantPhone] = useState('');
  const [modalContractStart, setModalContractStart] = useState('');
  const [modalContractEnd, setModalContractEnd] = useState('');
  const [modalElectricMeter, setModalElectricMeter] = useState(0);
  const [modalWaterMeter, setModalWaterMeter] = useState(0);

  // Sync Test State
  const [syncTestMessage, setSyncTestMessage] = useState(null);
  const [isTestingSync, setIsTestingSync] = useState(false);

  // --- Effects & Initializations ---
  useEffect(() => {
    // โหลดข้อมูลเบื้องต้น
    const savedRooms = localStorage.getItem('apartment_rooms_react');
    if (savedRooms) {
      setRooms(JSON.parse(savedRooms));
    } else {
      const initialRooms = [];
      for (let i = 1; i <= 20; i++) {
        const floor = Math.floor((i - 1) / 5) + 1;
        const roomNum = floor * 100 + ((i - 1) % 5 + 1);
        initialRooms.push({
          id: roomNum.toString(),
          status: i % 4 === 0 ? "ไม่ว่าง" : (i % 6 === 0 ? "จองแล้ว" : (i % 9 === 0 ? "ชำรุด" : "ว่าง")),
          rent: 3500 + (floor * 200),
          tenantName: i % 4 === 0 ? "คุณ สมควร ดีใจ" : (i % 6 === 0 ? "คุณ นารี สดใส" : ""),
          tenantPhone: i % 4 === 0 ? "081-234-5678" : (i % 6 === 0 ? "089-987-6543" : ""),
          contractStart: i % 4 === 0 ? "2026-01-01" : "",
          contractEnd: i % 4 === 0 ? (i === 4 ? "2026-08-15" : "2027-01-01") : "",
          electricMeter: i % 4 === 0 ? 120 : 0,
          waterMeter: i % 4 === 0 ? 45 : 0
        });
      }
      setRooms(initialRooms);
      localStorage.setItem('apartment_rooms_react', JSON.stringify(initialRooms));
    }

    // โหลดการตั้งค่าอื่นๆ
    const savedUrl = localStorage.getItem('setting_sheet_url_react');
    if (savedUrl) setGoogleSheetUrl(savedUrl);

    const savedElectric = localStorage.getItem('setting_electric_rate_react');
    if (savedElectric) setElectricRate(parseFloat(savedElectric));

    const savedWater = localStorage.getItem('setting_water_rate_react');
    if (savedWater) setWaterRate(parseFloat(savedWater));

    const savedOperator = localStorage.getItem('operator_name_react');
    if (savedOperator) setOperatorName(savedOperator);
  }, []);

  // ฟังก์ชั่นเซฟค่าลง Local
  const saveRooms = (newRooms) => {
    setRooms(newRooms);
    localStorage.setItem('apartment_rooms_react', JSON.stringify(newRooms));
  };

  // --- Handlers & Functions ---

  // ล็อกประวัติความปลอดภัย
  const addAuditLog = (action) => {
    const now = new Date();
    const timeStr = now.toLocaleString('th-TH');
    setAuditLogs(prev => [
      { timestamp: timeStr, action, operator: operatorName },
      ...prev.slice(0, 49) // จำกัดประวัติไว้สูงสุด 50 แถว
    ]);
  };

  // แจ้งเตือนสิทธิ
  const showFloatingNotification = (msg) => {
    const notif = document.createElement('div');
    notif.className = "fixed bottom-5 right-5 bg-indigo-900 text-white text-xs px-4 py-3 rounded-xl shadow-lg flex items-center gap-2 z-50 animate-bounce";
    notif.innerHTML = `<i class="fa-solid fa-circle-check text-emerald-400"></i> ${msg}`;
    document.body.appendChild(notif);
    setTimeout(() => notif.remove(), 3000);
  };

  // การส่งข้อมูลขึ้น Google Sheets API
  const sendToGoogleSheet = async (payload) => {
    if (!googleSheetUrl) return;
    try {
      await fetch(googleSheetUrl, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      showFloatingNotification("บันทึกข้อมูลและส่งคลาวด์สำเร็จ");
    } catch (e) {
      console.error(e);
    }
  };

  // เพิ่มหรือลดห้องพัก
  const adjustRoomCount = (delta) => {
    if (delta === 1) {
      const lastRoom = rooms[rooms.length - 1];
      let newId = "101";
      if (lastRoom) {
        const lastNum = parseInt(lastRoom.id) || 101;
        const lastFloor = Math.floor(lastNum / 100);
        const lastIndex = lastNum % 100;
        newId = lastIndex >= 5 ? ((lastFloor + 1) * 100 + 1).toString() : (lastNum + 1).toString();
      }
      const updated = [...rooms, {
        id: newId,
        status: "ว่าง",
        rent: 3500,
        tenantName: "",
        tenantPhone: "",
        contractStart: "",
        contractEnd: "",
        electricMeter: 0,
        waterMeter: 0
      }];
      saveRooms(updated);
      addAuditLog(`เพิ่มห้องพักใหม่: ห้อง ${newId}`);
    } else if (delta === -1 && rooms.length > 1) {
      const popped = rooms[rooms.length - 1];
      const updated = rooms.slice(0, -1);
      saveRooms(updated);
      addAuditLog(`ลบห้องพัก: ห้อง ${popped.id}`);
    }
  };

  // ตั้งค่าอัตราราคาน้ำ/ไฟฟ้า
  const handleUtilityRateChange = (type, value) => {
    const val = parseFloat(value) || 0;
    if (type === 'elec') {
      setElectricRate(val);
      localStorage.setItem('setting_electric_rate_react', val);
    } else {
      setWaterRate(val);
      localStorage.setItem('setting_water_rate_react', val);
    }
    const statusEl = document.getElementById('utility-save-status');
    if (statusEl) {
      statusEl.classList.remove('hidden');
      setTimeout(() => statusEl.classList.add('hidden'), 2000);
    }
    addAuditLog(`แก้ไขอัตราการบริการ (น้ำ: ${type === 'water' ? val : waterRate}฿, ไฟ: ${type === 'elec' ? val : electricRate}฿)`);
  };

  // เปิดใช้งาน Modal ปรับแต่งห้อง
  const openRoomModal = (room) => {
    setEditingRoomOriginalId(room.id);
    setModalRoomId(room.id);
    setModalStatus(room.status);
    setModalRent(room.rent);
    setModalTenantName(room.tenantName || '');
    setModalTenantPhone(room.tenantPhone || '');
    setModalContractStart(room.contractStart || '');
    setModalContractEnd(room.contractEnd || '');
    setModalElectricMeter(room.electricMeter || 0);
    setModalWaterMeter(room.waterMeter || 0);
    setIsRoomModalOpen(true);
  };

  // บันทึกรายละเอียดห้องจากการแก้ไขใน Modal
  const saveRoomDetails = () => {
    // 1. ตรวจสอบชื่อห้องซ้ำ (หากเปลี่ยนชื่อใหม่)
    if (modalRoomId.trim() === '') {
      alert("กรุณาระบุชื่อห้อง / เลขห้องด้วยครับ");
      return;
    }

    const isDuplicate = rooms.some(r => r.id === modalRoomId && r.id !== editingRoomOriginalId);
    if (isDuplicate) {
      alert(`ไม่สามารถเปลี่ยนชื่อห้องเป็น "${modalRoomId}" ได้ เนื่องจากมีชื่อห้องนี้ในระบบอยู่แล้วครับ`);
      return;
    }

    const updated = rooms.map(r => {
      if (r.id === editingRoomOriginalId) {
        return {
          ...r,
          id: modalRoomId.trim(), // เปลี่ยนแปลงชื่อห้องได้จริงที่นี่!
          status: modalStatus,
          rent: parseFloat(modalRent) || 0,
          tenantName: (modalStatus === 'ไม่ว่าง' || modalStatus === 'จองแล้ว') ? modalTenantName : '',
          tenantPhone: (modalStatus === 'ไม่ว่าง' || modalStatus === 'จองแล้ว') ? modalTenantPhone : '',
          contractStart: (modalStatus === 'ไม่ว่าง' || modalStatus === 'จองแล้ว') ? modalContractStart : '',
          contractEnd: (modalStatus === 'ไม่ว่าง' || modalStatus === 'จองแล้ว') ? modalContractEnd : '',
          electricMeter: parseFloat(modalElectricMeter) || 0,
          waterMeter: parseFloat(modalWaterMeter) || 0,
        };
      }
      return r;
    });

    saveRooms(updated);
    setIsRoomModalOpen(false);
    addAuditLog(`แก้ไขห้อง ${editingRoomOriginalId} ${editingRoomOriginalId !== modalRoomId ? `-> เปลี่ยนชื่อห้องเป็น ${modalRoomId}` : ''} (สถานะ: ${modalStatus})`);
  };

  // เปลี่ยนชื่อ Operator
  const saveOperatorName = () => {
    if (tempOperatorName.trim()) {
      setOperatorName(tempOperatorName);
      localStorage.setItem('operator_name_react', tempOperatorName);
      setIsUserModalOpen(false);
      addAuditLog(`เปลี่ยนผู้บันทึกเป็น: ${tempOperatorName}`);
    }
  };

  // เปลี่ยนแปลงเลขห้อง / ชื่อห้องโดยตรง
  const handleRoomIdChange = (oldId, newId) => {
    const trimmed = newId.trim();
    if (!trimmed || trimmed === oldId) return;

    // ตรวจสอบชื่อห้องซ้ำกับห้องอื่นในระบบ
    if (rooms.some(r => r.id === trimmed && r.id !== oldId)) {
      showFloatingNotification(`เลขห้อง "${trimmed}" มีอยู่ในระบบแล้ว`);
      return;
    }

    const updated = rooms.map(r => r.id === oldId ? { ...r, id: trimmed } : r);
    saveRooms(updated);

    // ปรับเปลี่ยน ID ของห้องในกรณีที่กำลังเลือกคำนวณบิลห้องนี้อยู่
    if (billingRoomId === oldId) {
      setBillingRoomId(trimmed);
    }

    addAuditLog(`แก้ไขเลขห้อง: จาก ${oldId} เป็น ${trimmed}`);
    showFloatingNotification(`เปลี่ยนเลขห้องจาก ${oldId} เป็น ${trimmed} เรียบร้อยแล้ว`);
  };

  // การคำนวณบิล
  const selectedRoomForBill = rooms.find(r => r.id === billingRoomId) || null;

  useEffect(() => {
    if (selectedRoomForBill) {
      setBillingElecCurr(selectedRoomForBill.electricMeter || 0);
      setBillingWaterCurr(selectedRoomForBill.waterMeter || 0);
    }
  }, [billingRoomId]);

  const billElecUnits = Math.max(0, billingElecCurr - (selectedRoomForBill?.electricMeter || 0));
  const billElecCost = billElecUnits * electricRate;
  const billWaterUnits = Math.max(0, billingWaterCurr - (selectedRoomForBill?.waterMeter || 0));
  const billWaterCost = billWaterUnits * waterRate;
  const billGrandTotal = (selectedRoomForBill?.rent || 0) + billElecCost + billWaterCost + (parseFloat(billingOtherPrice) || 0);

  // บันทึกบิลและบันทึกค่าน้ำไฟล่าสุด
  const handleSaveBilling = () => {
    if (!selectedRoomForBill) return;

    const updated = rooms.map(r => {
      if (r.id === billingRoomId) {
        return {
          ...r,
          electricMeter: billingElecCurr,
          waterMeter: billingWaterCurr
        };
      }
      return r;
    });

    saveRooms(updated);
    addAuditLog(`ออกบิลและจดมิเตอร์ ห้อง ${billingRoomId} ยอดรวม: ${billGrandTotal.toLocaleString()} บาท`);
    
    if (googleSheetUrl) {
      sendToGoogleSheet({
        roomId: billingRoomId,
        tenantName: selectedRoomForBill.tenantName,
        actionType: "สร้างบิลและบันทึกค่าน้ำไฟ",
        details: `ค่าไฟฟ้า: ${billElecUnits} หน่วย (${billingElecCurr}-${selectedRoomForBill.electricMeter}), ค่าน้ำ: ${billWaterUnits} หน่วย (${billingWaterCurr}-${selectedRoomForBill.waterMeter}), อื่นๆ: ${billingOtherName || 'ไม่มี'}`,
        operator: operatorName,
        totalAmount: billGrandTotal
      });
    } else {
      showFloatingNotification("บันทึกค่าน้ำค่าน้ำไฟแล้ว (คลาวด์ไม่ได้เชื่อมต่อ)");
    }
  };

  // การจัดการแจ้งปัญหาความเสียหาย
  const submitMaintenance = () => {
    if (!maintDetail.trim()) return alert("กรุณากรอกอาการชำรุดด้วยครับ");
    const now = new Date();
    const datetimeStr = now.toLocaleString('th-TH');

    const newReport = {
      id: maintenanceData.length + 1,
      datetime: datetimeStr,
      location: maintLocation,
      detail: maintDetail,
      priority: maintPriority,
      status: "รอดำเนินการ"
    };

    setMaintenanceData([newReport, ...maintenanceData]);
    setMaintDetail('');
    addAuditLog(`รายงานปัญหาพื้นที่ส่วนกลาง บริเวณ: ${maintLocation}`);

    if (googleSheetUrl) {
      sendToGoogleSheet({
        roomId: "ส่วนกลาง",
        tenantName: "-",
        actionType: "แจ้งบำรุงรักษาส่วนกลาง",
        details: `สถานที่: ${maintLocation}, อาการชำรุด: ${maintDetail}, ระดับความเร่งด่วน: ${maintPriority}`,
        operator: operatorName,
        totalAmount: 0
      });
    }
  };

  const handleCompleteMaintenance = (id) => {
    const updated = maintenanceData.map(item => {
      if (item.id === id) {
        addAuditLog(`แก้ไขปัญหาพื้นที่ส่วนกลางเรียบร้อย: ${item.location}`);
        return { ...item, status: "เสร็จสิ้น" };
      }
      return item;
    });
    setMaintenanceData(updated);
  };

  // คำนวณสัญญาเช่าเหลือน้อยกว่า 2 เดือน
  const expiringContracts = rooms.filter(room => {
    if (room.status === 'ไม่ว่าง' && room.contractEnd) {
      const today = new Date();
      const end = new Date(room.contractEnd);
      const diffTime = end - today;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays <= 60 && diffDays >= 0;
    }
    return false;
  });

  // คัดกรองห้องพักในแดชบอร์ด
  const totalRooms = rooms.length;
  const vacantRooms = rooms.filter(r => r.status === 'ว่าง').length;
  const occupiedRooms = rooms.filter(r => r.status === 'ไม่ว่าง').length;
  const reservedRooms = rooms.filter(r => r.status === 'จองแล้ว').length;
  const maintenanceRooms = rooms.filter(r => r.status === 'ชำรุด').length;

  let totalRevenue = 0;
  rooms.forEach(r => {
    if (r.status === 'ไม่ว่าง' || r.status === 'จองแล้ว') {
      totalRevenue += parseFloat(r.rent || 0);
    }
  });

  // ตัวเลือกคัดกรองห้องในแท็บผู้เช่า
  const filteredRoomsForTenant = rooms.filter(room => {
    if (filterTenantType === 'occupied') return room.status === 'ไม่ว่าง' || room.status === 'จองแล้ว';
    if (filterTenantType === 'vacant') return room.status === 'ว่าง' || room.status === 'ชำรุด';
    return true;
  });

  // ทดสอบเชื่อมโยง Google Sheet URL
  const testSyncConnection = async () => {
    if (!googleSheetUrl) {
      setSyncTestMessage({ success: false, text: "กรุณาระบุ Google Sheets Web App URL ในช่องว่างด้วยครับ" });
      return;
    }
    setIsTestingSync(true);
    setSyncTestMessage({ success: null, text: "กำลังส่งสัญญาณข้อมูลไปทดสอบระบบ..." });

    try {
      await fetch(googleSheetUrl, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomId: "ทดสอบการเชื่อมโยง",
          tenantName: "แอดมินจำลอง",
          actionType: "ทดสอบ API เชื่อมต่อสำเร็จ",
          details: "ระบบเชื่อมต่อจาก Client ไปยัง Google Apps Script และ Vercel ทำงานได้ตามปกติ",
          operator: operatorName,
          totalAmount: 0
        })
      });
      setSyncTestMessage({ success: true, text: "การแชร์การเชื่อมต่อ Google Sheets ทำงานได้ปกติเรียบร้อยแล้ว!" });
      addAuditLog("ทดสอบส่งข้อมูล API และพอร์ตไปยัง Google Sheet สำเร็จ");
    } catch (err) {
      setSyncTestMessage({ success: false, text: `ล้มเหลว: ${err.message}` });
    } finally {
      setIsTestingSync(false);
    }
  };

  // ฟังก์ชั่นช่วยเปลี่ยนฟอร์แมตวันที่แบบสากลให้ดูเข้าใจง่าย
  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  return (
    <div className="flex-grow flex flex-col">
      {/* Top Navigation Bar */}
      <header className="bg-indigo-900 text-white shadow-lg sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-indigo-600 rounded-lg">
                <i class="fa-solid fa-building-user text-xl text-white"></i>
              </div>
              <div>
                <span className="font-bold text-lg block sm:inline">ApartmentOS (Vercel)</span>
                <span className="text-xs text-indigo-200 block sm:inline sm:ml-2">ระบบจัดการและแก้ปัญหาหอพักอัจฉริยะ</span>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="hidden md:flex flex-col text-right">
                <span className="text-sm font-medium">ผู้บันทึก: {operatorName}</span>
                <span className="text-xs text-indigo-300">
                  <i className={`fa-solid fa-circle-dot mr-1 ${googleSheetUrl ? 'text-emerald-400' : 'text-red-500'}`}></i>
                  {googleSheetUrl ? 'เชื่อมคลาวด์แล้ว' : 'ไม่ได้เชื่อม Google Sheet'}
                </span>
              </div>
              <button 
                onClick={() => { setTempOperatorName(operatorName); setIsUserModalOpen(true); }} 
                className="bg-indigo-700 hover:bg-indigo-600 px-3 py-1.5 rounded-lg text-sm flex items-center gap-2 transition duration-200"
              >
                <i className="fa-solid fa-user-pen"></i>
                <span className="hidden sm:inline">เปลี่ยนผู้บันทึก</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Navigation Tabs */}
      <nav className="bg-white border-b border-slate-200 sticky top-16 z-30">
        <div className="max-w-7xl mx-auto px-4 overflow-x-auto scrollbar-none">
          <div className="flex space-x-2 py-2 min-w-max">
            {[
              { id: 'dashboard', label: 'แดชบอร์ด', icon: 'fa-chart-line' },
              { id: 'rooms', label: `ผังห้องพัก (${totalRooms} ห้อง)`, icon: 'fa-door-open' },
              { id: 'tenants', label: 'ข้อมูลผู้เช่า & มิเตอร์', icon: 'fa-users' },
              { id: 'billing', label: 'คำนวณบิลค่าเช่า', icon: 'fa-file-invoice-dollar' },
              { id: 'maintenance', label: 'แจ้งซ่อมพื้นที่ส่วนกลาง', icon: 'fa-screwdriver-wrench' },
              { id: 'settings', label: 'เชื่อมต่อ Google Sheet', icon: 'fa-cloud-arrow-up' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 flex items-center gap-2 ${
                  activeTab === tab.id 
                    ? 'bg-indigo-50 text-indigo-700 font-semibold' 
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <i className={`fa-solid ${tab.icon}`}></i> {tab.label}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="flex-grow max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        
        {/* CONTRACT EXPIRATION ALERT BANNER */}
        {expiringContracts.length > 0 && isAlertBannerOpen && (
          <div className="bg-amber-50 border-l-4 border-amber-500 p-4 mb-6 rounded-r-lg shadow-sm">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <i className="fa-solid fa-triangle-exclamation text-amber-500 text-xl mt-0.5 animate-bounce"></i>
              </div>
              <div className="ml-3 flex-grow">
                <h3 className="text-sm font-semibold text-amber-800">แจ้งเตือนสัญญาเช่าใกล้หมดอายุ (เหลือน้อยกว่า 2 เดือน)</h3>
                <div className="text-xs text-amber-700 mt-1 space-y-1">
                  {expiringContracts.map(room => (
                    <p key={room.id}>
                      <i className="fa-solid fa-bell mr-1"></i>
                      <strong>ห้อง {room.id}</strong> (ผู้เช่า: {room.tenantName || 'ไม่ระบุ'}) สัญญาเช่ากำลังจะสิ้นสุดในวันที่ {formatDate(room.contractEnd)}
                    </p>
                  ))}
                </div>
              </div>
              <button onClick={() => setIsAlertBannerOpen(false)} className="ml-auto text-amber-500 hover:text-amber-800">
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>
          </div>
        )}

        {/* --- TAB: DASHBOARD --- */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">ประมาณการรายรับเดือนนี้</span>
                  <h3 className="text-2xl font-bold text-slate-800">{totalRevenue.toLocaleString()} ฿</h3>
                  <p className="text-xs text-emerald-500"><i className="fa-solid fa-check-double mr-1"></i>คิดจากห้องที่จองและไม่ว่าง</p>
                </div>
                <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl"><i className="fa-solid fa-wallet text-2xl"></i></div>
              </div>

              <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">ห้องว่างพร้อมเช่า</span>
                  <h3 className="text-2xl font-bold text-emerald-600">{vacantRooms} ห้อง</h3>
                  <p className="text-xs text-slate-500">{((vacantRooms / (totalRooms || 1)) * 100).toFixed(0)}% จากทั้งหมด</p>
                </div>
                <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl"><i className="fa-solid fa-house-circle-check text-2xl"></i></div>
              </div>

              <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">ห้องไม่ว่าง (มีผู้เช่า)</span>
                  <h3 className="text-2xl font-bold text-rose-600">{occupiedRooms} ห้อง</h3>
                  <p className="text-xs text-slate-500">{((occupiedRooms / (totalRooms || 1)) * 100).toFixed(0)}% จากทั้งหมด</p>
                </div>
                <div className="p-3 bg-rose-50 text-rose-600 rounded-xl"><i className="fa-solid fa-house-user text-2xl"></i></div>
              </div>

              <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">ชำรุด/ปิดปรับปรุง</span>
                  <h3 className="text-2xl font-bold text-amber-600">{maintenanceRooms} ห้อง</h3>
                  <p className="text-xs text-slate-500">{((maintenanceRooms / (totalRooms || 1)) * 100).toFixed(0)}% จากทั้งหมด</p>
                </div>
                <div className="p-3 bg-amber-50 text-amber-600 rounded-xl"><i className="fa-solid fa-screwdriver-wrench text-2xl"></i></div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <h3 className="text-base font-bold text-slate-800 mb-4"><i className="fa-solid fa-chart-pie text-indigo-500 mr-2"></i>สัดส่วนสถานะห้องพัก</h3>
                <div className="space-y-4">
                  <div className="h-4 w-full bg-slate-100 rounded-full overflow-hidden flex">
                    <div className="bg-emerald-500 h-full transition-all duration-500" style={{ width: `${(vacantRooms / (totalRooms || 1)) * 100}%` }}></div>
                    <div className="bg-rose-500 h-full transition-all duration-500" style={{ width: `${(occupiedRooms / (totalRooms || 1)) * 100}%` }}></div>
                    <div className="bg-sky-500 h-full transition-all duration-500" style={{ width: `${(reservedRooms / (totalRooms || 1)) * 100}%` }}></div>
                    <div className="bg-amber-500 h-full transition-all duration-500" style={{ width: `${(maintenanceRooms / (totalRooms || 1)) * 100}%` }}></div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-xs font-medium">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 bg-emerald-500 rounded-full"></span>
                      <span>ว่าง: <strong>{vacantRooms}</strong> ห้อง</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 bg-rose-500 rounded-full"></span>
                      <span>ไม่ว่าง: <strong>{occupiedRooms}</strong> ห้อง</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 bg-sky-500 rounded-full"></span>
                      <span>จองแล้ว: <strong>{reservedRooms}</strong> ห้อง</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 bg-amber-500 rounded-full"></span>
                      <span>ชำรุด: <strong>{maintenanceRooms}</strong> ห้อง</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 lg:col-span-2">
                <h3 class="text-base font-bold text-slate-800 mb-4"><i className="fa-solid fa-bolt text-amber-500 mr-2"></i>อัตราค่าน้ำ/ค่าไฟ และผู้ดูแล</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 bg-amber-50/50 border border-amber-100 rounded-xl space-y-2">
                    <span className="text-xs font-semibold text-amber-800 uppercase">ค่าไฟฟ้า (ต่อหน่วย)</span>
                    <div className="flex items-center gap-2">
                      <input 
                        type="number" 
                        value={electricRate} 
                        onChange={(e) => handleUtilityRateChange('elec', e.target.value)} 
                        className="w-20 px-2 py-1 border border-slate-300 rounded text-center text-sm font-semibold focus:ring-2 focus:ring-indigo-500" 
                      />
                      <span className="text-sm text-slate-600">บาท / หน่วย</span>
                    </div>
                  </div>

                  <div className="p-4 bg-sky-50/50 border border-sky-100 rounded-xl space-y-2">
                    <span className="text-xs font-semibold text-sky-800 uppercase">ค่าน้ำประปา (ต่อหน่วย)</span>
                    <div className="flex items-center gap-2">
                      <input 
                        type="number" 
                        value={waterRate} 
                        onChange={(e) => handleUtilityRateChange('water', e.target.value)} 
                        className="w-20 px-2 py-1 border border-slate-300 rounded text-center text-sm font-semibold focus:ring-2 focus:ring-indigo-500" 
                      />
                      <span className="text-sm text-slate-600">บาท / หน่วย</span>
                    </div>
                  </div>
                </div>
                <div className="mt-4 p-3 bg-slate-50 border border-slate-100 rounded-xl flex justify-between items-center text-xs">
                  <span className="text-slate-500"><i className="fa-solid fa-circle-info mr-1 text-indigo-500"></i>เปลี่ยนค่าที่นี่จะนำไปบันทึกและใช้คำนวณบิลในรอบถัดไป</span>
                  <span id="utility-save-status" className="text-emerald-600 hidden font-bold"><i className="fa-solid fa-check mr-1"></i>บันทึกสำเร็จ</span>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
              <h3 className="text-base font-bold text-slate-800 mb-4"><i className="fa-solid fa-history text-indigo-500 mr-2"></i>ประวัติการบันทึก & แก้ไขข้อมูลล่าสุด (Audit Log)</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-600">
                  <thead className="bg-slate-50 text-slate-400 text-xs uppercase font-semibold">
                    <tr>
                      <th className="py-2.5 px-4 rounded-l-lg">เวลาบันทึก</th>
                      <th className="py-2.5 px-4">กิจกรรม</th>
                      <th className="py-2.5 px-4">ผู้บันทึก</th>
                      <th className="py-2.5 px-4 rounded-r-lg text-right">สถานะคลาวด์</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {auditLogs.map((log, index) => (
                      <tr key={index} className="hover:bg-slate-50/50">
                        <td className="py-2.5 px-4 text-slate-400">{log.timestamp}</td>
                        <td className="py-2.5 px-4 font-semibold text-slate-700">{log.action}</td>
                        <td className="py-2.5 px-4 text-slate-500">{log.operator}</td>
                        <td className="py-2.5 px-4 text-right text-emerald-600"><i className="fa-solid fa-cloud-arrow-up mr-1"></i>ซิงก์สำเร็จ</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* --- TAB: ROOM GRID --- */}
        {activeTab === 'rooms' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-800">จัดการโครงสร้างผังห้องพัก</h3>
                <p className="text-xs text-slate-500">คุณสามารถปรับแต่งชื่อห้อง/เลขห้องได้ตามอิสระ หรือกดปุ่มเพิ่ม/ลดขอบเขตห้องพักได้</p>
              </div>
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => adjustRoomCount(-1)} 
                  className="px-3 py-1.5 bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200 rounded-lg text-sm font-semibold transition"
                >
                  <i className="fa-solid fa-minus mr-1"></i> ลดห้องพัก (-1)
                </button>
                <span className="text-sm font-bold bg-slate-100 px-4 py-2 rounded-lg border border-slate-200">{totalRooms} ห้อง</span>
                <button 
                  onClick={() => adjustRoomCount(1)} 
                  className="px-3 py-1.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border border-emerald-200 rounded-lg text-sm font-semibold transition"
                >
                  <i className="fa-solid fa-plus mr-1"></i> เพิ่มห้องพัก (+1)
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-4">
              {rooms.map(room => {
                let colorClass = "bg-emerald-50 border-emerald-200 text-emerald-800";
                let icon = <i className="fa-solid fa-house-circle-check text-xl text-emerald-500"></i>;

                if (room.status === 'ไม่ว่าง') {
                  colorClass = "bg-rose-50 border-rose-200 text-rose-800";
                  icon = <i className="fa-solid fa-house-user text-xl text-rose-500"></i>;
                } else if (room.status === 'จองแล้ว') {
                  colorClass = "bg-sky-50 border-sky-200 text-sky-800";
                  icon = <i className="fa-solid fa-handshake text-xl text-sky-500"></i>;
                } else if (room.status === 'ชำรุด') {
                  colorClass = "bg-amber-50 border-amber-200 text-amber-800";
                  icon = <i className="fa-solid fa-screwdriver-wrench text-xl text-amber-500"></i>;
                }

                return (
                  <div 
                    key={room.id}
                    onClick={() => openRoomModal(room)}
                    className={`p-4 rounded-2xl border cursor-pointer hover:scale-[1.02] transition-all duration-150 flex flex-col justify-between h-32 shadow-sm ${colorClass}`}
                  >
                    <div className="flex justify-between items-start">
                      <span className="text-sm font-bold truncate pr-1">ห้อง {room.id}</span>
                      {icon}
                    </div>
                    <div className="mt-2 space-y-0.5">
                      <p className="text-[9px] font-bold uppercase text-slate-400">{room.status}</p>
                      <p className="text-xs font-bold truncate text-slate-800">{room.tenantName || 'ว่าง (ไม่มีผู้เช่า)'}</p>
                      <p className="text-[10px] font-semibold text-slate-500">{room.rent.toLocaleString()} บาท/เดือน</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* --- TAB: TENANTS & METERS --- */}
        {activeTab === 'tenants' && (
          <div className="space-y-6">
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex flex-wrap gap-2 items-center">
              <span className="text-xs font-semibold text-slate-500">กรองรายชื่อผู้เช่า:</span>
              <button onClick={() => setFilterTenantType('all')} className={`px-3 py-1 text-xs font-bold rounded-lg ${filterTenantType === 'all' ? 'bg-indigo-600 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'}`}>ทั้งหมด</button>
              <button onClick={() => setFilterTenantType('occupied')} className={`px-3 py-1 text-xs font-bold rounded-lg ${filterTenantType === 'occupied' ? 'bg-indigo-600 text-white' : 'bg-rose-50 hover:bg-rose-100 text-rose-700'}`}>เฉพาะผู้พักอาศัย/จอง</button>
              <button onClick={() => setFilterTenantType('vacant')} className={`px-3 py-1 text-xs font-bold rounded-lg ${filterTenantType === 'vacant' ? 'bg-indigo-600 text-white' : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700'}`}>เฉพาะห้องพักว่าง</button>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-600">
                  <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-semibold">
                    <tr>
                      <th className="py-3 px-4">ชื่อห้อง</th>
                      <th className="py-3 px-4">สถานะ</th>
                      <th className="py-3 px-4">ชื่อผู้เช่า</th>
                      <th className="py-3 px-4">ค่าเช่าปัจจุบัน</th>
                      <th className="py-3 px-4">มิเตอร์ไฟฟ้าล่าสุด</th>
                      <th className="py-3 px-4">มิเตอร์น้ำประปาล่าสุด</th>
                      <th className="py-3 px-4">วันหมดสัญญาเช่า</th>
                      <th className="py-3 px-4 text-center">แก้ไขข้อมูล</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {filteredRoomsForTenant.map(room => (
                      <tr key={room.id} className="hover:bg-slate-50/50">
                        {}
                        <td className="py-3 px-4 font-bold text-indigo-900">
                          <div className="flex items-center gap-1">
                            <span className="text-slate-400 font-normal">ห้อง</span>
                            <input 
                              type="text" 
                              defaultValue={room.id}
                              key={room.id}
                              onBlur={(e) => handleRoomIdChange(room.id, e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.target.blur();
                                }
                              }}
                              className="w-20 border border-slate-200 hover:border-indigo-300 focus:border-indigo-500 rounded px-1.5 py-0.5 text-center font-bold text-indigo-900 bg-white shadow-sm transition focus:ring-2 focus:ring-indigo-200"
                              title="คลิกเพื่อแก้ไขเลขห้องได้ทันที (กด Enter หรือคลิกข้างนอกเพื่อบันทึก)"
                            />
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                            room.status === 'ว่าง' ? 'bg-emerald-100 text-emerald-800' : 
                            room.status === 'ไม่ว่าง' ? 'bg-rose-100 text-rose-800' : 'bg-sky-100 text-sky-800'
                          }`}>{room.status}</span>
                        </td>
                        <td className="py-3 px-4 font-semibold">{room.tenantName || '-'}</td>
                        <td className="py-3 px-4 font-semibold text-slate-700">{room.rent.toLocaleString()} ฿</td>
                        <td className="py-3 px-4">
                          <input 
                            type="number" 
                            value={room.electricMeter}
                            onChange={(e) => {
                              const updated = rooms.map(r => r.id === room.id ? { ...r, electricMeter: parseFloat(e.target.value) || 0 } : r);
                              saveRooms(updated);
                            }}
                            className="w-16 border border-slate-200 rounded p-1 text-center font-bold text-slate-700 focus:outline-indigo-500"
                          />
                        </td>
                        <td className="py-3 px-4">
                          <input 
                            type="number" 
                            value={room.waterMeter}
                            onChange={(e) => {
                              const updated = rooms.map(r => r.id === room.id ? { ...r, waterMeter: parseFloat(e.target.value) || 0 } : r);
                              saveRooms(updated);
                            }}
                            className="w-16 border border-slate-200 rounded p-1 text-center font-bold text-slate-700 focus:outline-indigo-500"
                          />
                        </td>
                        <td className="py-3 px-4 font-medium text-slate-500">{formatDate(room.contractEnd)}</td>
                        <td className="py-3 px-4 text-center">
                          <button onClick={() => openRoomModal(room)} className="text-indigo-600 hover:text-indigo-900 font-semibold"><i className="fa-regular fa-pen-to-square"></i> ปรับแต่ง</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* --- TAB: BILLING & CALCULATOR --- */}
        {activeTab === 'billing' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
              <h3 className="text-base font-bold text-slate-800 border-b border-slate-100 pb-2"><i className="fa-solid fa-calculator text-indigo-500 mr-2"></i>เลือกและป้อนข้อมูลบิลค่าน้ำไฟ</h3>
              
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">เลือกห้องพัก</label>
                  <select 
                    value={billingRoomId} 
                    onChange={(e) => setBillingRoomId(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg p-2 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  >
                    <option value="">-- เลือกห้องพักที่มีผู้เช่า --</option>
                    {rooms.filter(r => r.status === 'ไม่ว่าง' || r.status === 'จองแล้ว').map(r => (
                      <option key={r.id} value={r.id}>ห้อง {r.id} ({r.tenantName})</option>
                    ))}
                  </select>
                </div>

                {selectedRoomForBill && (
                  <div className="p-3 bg-slate-50 rounded-lg space-y-1.5 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-400 font-medium">ชื่อผู้เช่าปัจจุบัน:</span>
                      <span className="font-bold text-slate-700">{selectedRoomForBill.tenantName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400 font-medium">ค่าเช่าหลักต่อเดือน:</span>
                      <span className="font-bold text-slate-700">{selectedRoomForBill.rent.toLocaleString()} ฿</span>
                    </div>
                  </div>
                )}

                <div className="border-t border-slate-100 pt-3">
                  <h4 className="text-xs font-bold text-indigo-700 mb-2">มิเตอร์ค่าไฟฟ้าประจำเดือน</h4>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] text-slate-400">เลขมิเตอร์เดิม</label>
                      <input type="number" value={selectedRoomForBill?.electricMeter || 0} readOnly className="w-full border border-slate-200 rounded p-1.5 text-xs bg-slate-100 cursor-not-allowed" />
                    </div>
                    <div>
                      <label className="block text-[10px] text-indigo-600 font-bold">เลขมิเตอร์ใหม่</label>
                      <input 
                        type="number" 
                        value={billingElecCurr} 
                        onChange={(e) => setBillingElecCurr(parseFloat(e.target.value) || 0)}
                        className="w-full border border-indigo-300 rounded p-1.5 text-xs focus:ring-2 focus:ring-indigo-500" 
                      />
                    </div>
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-3">
                  <h4 className="text-xs font-bold text-sky-700 mb-2">มิเตอร์ค่าน้ำประปาประจำเดือน</h4>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] text-slate-400">เลขมิเตอร์เดิม</label>
                      <input type="number" value={selectedRoomForBill?.waterMeter || 0} readOnly className="w-full border border-slate-200 rounded p-1.5 text-xs bg-slate-100 cursor-not-allowed" />
                    </div>
                    <div>
                      <label className="block text-[10px] text-sky-600 font-bold">เลขมิเตอร์ใหม่</label>
                      <input 
                        type="number" 
                        value={billingWaterCurr} 
                        onChange={(e) => setBillingWaterCurr(parseFloat(e.target.value) || 0)}
                        className="w-full border border-sky-300 rounded p-1.5 text-xs focus:ring-2 focus:ring-sky-500" 
                      />
                    </div>
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-3">
                  <label className="block text-xs font-semibold text-slate-500 mb-1">ค่าบริการอื่นๆ หรือ ส่วนลดเพิ่ม (ถ้ามี)</label>
                  <div className="grid grid-cols-2 gap-2">
                    <input type="text" placeholder="ชื่อบริการเสริม" value={billingOtherName} onChange={(e) => setBillingOtherName(e.target.value)} className="w-full border border-slate-200 rounded p-1.5 text-xs focus:outline-indigo-500" />
                    <input type="number" placeholder="ค่าบริการ (บาท)" value={billingOtherPrice} onChange={(e) => setBillingOtherPrice(parseFloat(e.target.value) || 0)} className="w-full border border-slate-200 rounded p-1.5 text-xs focus:outline-indigo-500" />
                  </div>
                </div>

                <button 
                  onClick={handleSaveBilling}
                  disabled={!billingRoomId}
                  className="w-full mt-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white font-semibold py-2 px-4 rounded-lg text-xs transition duration-200 flex items-center justify-center gap-1.5"
                >
                  <i className="fa-solid fa-floppy-disk"></i> บันทึกข้อมูลและพอร์ตส่งประวัติ
                </button>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm lg:col-span-2 space-y-4">
              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <h3 className="text-base font-bold text-slate-800"><i className="fa-solid fa-file-invoice text-indigo-500 mr-2"></i>ตัวอย่างใบแจ้งหนี้ (Invoice Preview)</h3>
                <button onClick={() => window.print()} className="bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition">
                  <i className="fa-solid fa-print"></i> สั่งพิมพ์ / บันทึก PDF
                </button>
              </div>

              <div id="printArea" className="bg-white border border-slate-200 p-6 rounded-xl text-slate-800 space-y-5 max-w-xl mx-auto shadow-sm">
                <div className="flex justify-between border-b-2 border-indigo-900 pb-4">
                  <div>
                    <h2 class="text-xl font-bold text-indigo-900">ใบเสร็จค่าน้ำ / ค่าไฟ / ค่าเช่าห้อง</h2>
                    <p class="text-[10px] text-slate-400">ระบบบริหารจัดการพาร์ทเม้นท์อัจฉริยะ (Smart Apartment OS)</p>
                  </div>
                  <div className="text-right text-xs">
                    <p className="font-bold text-sm">ชื่อห้อง: <span className="text-indigo-600 font-black text-base">{selectedRoomForBill?.id || '-'}</span></p>
                    <p>วันที่จัดบิล: {new Date().toLocaleDateString('th-TH')}</p>
                    <p className="text-[10px] text-slate-400">ผู้ดำเนินการ: {operatorName}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs bg-slate-50 p-3 rounded-lg">
                  <div>
                    <span className="text-slate-400 font-semibold block">ผู้จอง/ผู้ทำสัญญาเช่า:</span>
                    <span className="font-bold text-slate-700 text-sm">{selectedRoomForBill?.tenantName || '-'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-semibold block">เบอร์ติดต่อ:</span>
                    <span className="font-bold text-slate-700">{selectedRoomForBill?.tenantPhone || '-'}</span>
                  </div>
                </div>

                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="border-b border-slate-300 font-bold text-slate-500">
                      <th className="py-2">รายการบริการและสาธารณูปโภค</th>
                      <th className="py-2 text-center">จดครั้งล่าสุด / ปัจจุบัน</th>
                      <th className="py-2 text-right">จำนวนหน่วย</th>
                      <th className="py-2 text-right">ราคาหน่วยละ</th>
                      <th className="py-2 text-right">จำนวนเงิน</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    <tr className="border-b border-slate-100">
                      <td className="py-2">ค่าเช่าห้องพักรายเดือน</td>
                      <td className="py-2 text-center">-</td>
                      <td className="py-2 text-right">1</td>
                      <td className="py-2 text-right">{(selectedRoomForBill?.rent || 0).toFixed(2)}</td>
                      <td className="py-2 text-right font-bold">{(selectedRoomForBill?.rent || 0).toFixed(2)}</td>
                    </tr>
                    <tr className="border-b border-slate-100">
                      <td className="py-2">ค่าไฟฟ้าประจำเดือน</td>
                      <td className="py-2 text-center text-slate-400">{selectedRoomForBill?.electricMeter || 0} / {billingElecCurr}</td>
                      <td className="py-2 text-right">{billElecUnits}</td>
                      <td className="py-2 text-right">{electricRate.toFixed(2)}</td>
                      <td className="py-2 text-right font-bold">{billElecCost.toFixed(2)}</td>
                    </tr>
                    <tr className="border-b border-slate-100">
                      <td className="py-2">ค่าน้ำประปาประจำเดือน</td>
                      <td className="py-2 text-center text-slate-400">{selectedRoomForBill?.waterMeter || 0} / {billingWaterCurr}</td>
                      <td className="py-2 text-right">{billWaterUnits}</td>
                      <td className="py-2 text-right">{waterRate.toFixed(2)}</td>
                      <td className="py-2 text-right font-bold">{billWaterCost.toFixed(2)}</td>
                    </tr>
                    {billingOtherPrice > 0 && (
                      <tr className="border-b border-slate-100">
                        <td className="py-2">{billingOtherName || 'ค่าบริการเพิ่มเติม'}</td>
                        <td className="py-2 text-center">-</td>
                        <td className="py-2 text-right">1</td>
                        <td className="py-2 text-right">{billingOtherPrice.toFixed(2)}</td>
                        <td className="py-2 text-right font-bold">{billingOtherPrice.toFixed(2)}</td>
                      </tr>
                    )}
                  </tbody>
                  <tfoot>
                    <tr className="border-t border-slate-300 font-bold text-slate-800">
                      <td colSpan="4" className="py-3 text-right text-sm">ยอดรวมยอดชำระสุทธิ (Grand Total):</td>
                      <td className="py-3 text-right text-base text-indigo-700">{billGrandTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })} ฿</td>
                    </tr>
                  </tfoot>
                </table>

                <div className="pt-4 border-t border-slate-200 grid grid-cols-2 gap-4 text-[10px] text-slate-500">
                  <div>
                    <p className="font-bold text-slate-700">คำเตือนและคำชี้แจง:</p>
                    <p>1. กรุณาชำระเงินตามเงื่อนเวลาเพื่อรักษาผลประโยชน์สัญญาเช่า</p>
                    <p>2. การทำประวัติผ่านระบบจะถูกบันทึกบนคลาวด์เพื่อป้องก้นความขัดแย้งเชิงพาณิชย์</p>
                  </div>
                  <div className="text-center pt-4">
                    <p className="border-b border-dashed border-slate-400 mx-auto w-32 h-6"></p>
                    <p className="mt-1">ผู้จัดทำบิล / ผู้ลงข้อมูล</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* --- TAB: MAINTENANCE --- */}
        {activeTab === 'maintenance' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
              <h3 className="text-base font-bold text-slate-800 pb-2 border-b border-slate-100"><i className="fa-solid fa-bullhorn text-indigo-500 mr-2"></i>รายงานปัญหาพื้นที่ส่วนกลาง</h3>
              
              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-slate-500 font-semibold mb-1">บริเวณที่ชำรุดเสียหาย</label>
                  <select 
                    value={maintLocation} 
                    onChange={(e) => setMaintLocation(e.target.value)} 
                    className="w-full border border-slate-200 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="ทางเดิน/ทางหนีไฟ">ทางเดิน / ทางหนีไฟ</option>
                    <option value="ลิฟต์โดยสาร">ลิฟต์โดยสาร</option>
                    <option value="ที่จอดรถยนต์/มอเตอร์ไซค์">ที่จอดรถยนต์ / มอเตอร์ไซค์</option>
                    <option value="ถังขยะส่วนกลาง">ถังขยะส่วนกลาง</option>
                    <option value="ระบบไฟแสงสว่าง">ระบบไฟแสงสว่างส่วนกลาง</option>
                    <option value="เครื่องปั๊มน้ำ/แทงค์น้ำ">เครื่องปั๊มน้ำ / แทงค์น้ำ</option>
                    <option value="อื่นๆ">อื่นๆ (ระบุในรายละเอียดเพิ่มเติม)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-500 font-semibold mb-1">ความรุนแรงของปัญหา</label>
                  <div className="grid grid-cols-3 gap-2">
                    {['ต่ำ', 'ปานกลาง', 'สูง'].map(level => (
                      <label key={level} className="border border-slate-200 rounded-lg p-2 text-center cursor-pointer hover:bg-slate-50 flex items-center justify-center gap-1">
                        <input 
                          type="radio" 
                          name="priority" 
                          value={level} 
                          checked={maintPriority === level}
                          onChange={() => setMaintPriority(level)}
                        />
                        <span className="font-bold text-[10px]">{level}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-slate-500 font-semibold mb-1">รายละเอียดปัญหา</label>
                  <textarea 
                    rows="3" 
                    value={maintDetail}
                    onChange={(e) => setMaintDetail(e.target.value)}
                    placeholder="ระบุตัวปัญหาชำรุด หรือพื้นที่เพื่อเร่งแก้ไขให้แก่ผู้ดูแล..." 
                    className="w-full border border-slate-200 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500"
                  ></textarea>
                </div>

                <button onClick={submitMaintenance} className="w-full bg-rose-600 hover:bg-rose-700 text-white font-semibold py-2.5 rounded-lg text-xs transition flex items-center justify-center gap-1.5">
                  <i className="fa-solid fa-paper-plane"></i> ยืนยันคำขอและบันทึกข้อมูล
                </button>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm lg:col-span-2 space-y-4">
              <h3 className="text-base font-bold text-slate-800"><i className="fa-solid fa-clipboard-list text-indigo-500 mr-2"></i>สถิติปัญหาและการบำรุงรักษา</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-600">
                  <thead className="bg-slate-50 text-slate-500 font-semibold uppercase">
                    <tr>
                      <th className="py-2.5 px-3">วันเวลา</th>
                      <th className="py-2.5 px-3">สถานที่พบปัญหา</th>
                      <th className="py-2.5 px-3">อาการชำรุด</th>
                      <th className="py-2.5 px-3">ระดับภัย</th>
                      <th className="py-2.5 px-3">สถานะ</th>
                      <th className="py-2.5 px-3 text-right">ดำเนินการ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {maintenanceData.map(item => (
                      <tr key={item.id} className="hover:bg-slate-50">
                        <td className="py-3 px-3 text-slate-400">{item.datetime}</td>
                        <td className="py-3 px-3 font-semibold text-slate-800">{item.location}</td>
                        <td className="py-3 px-3 truncate max-w-xs">{item.detail}</td>
                        <td className="py-3 px-3">
                          <span className={`px-2 py-0.5 rounded-full font-bold text-[9px] ${
                            item.priority === 'สูง' ? 'bg-rose-100 text-rose-800' : 
                            item.priority === 'ปานกลาง' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-800'
                          }`}>{item.priority}</span>
                        </td>
                        <td className="py-3 px-3 font-bold">{item.status}</td>
                        <td className="py-3 px-3 text-right">
                          {item.status !== 'เสร็จสิ้น' ? (
                            <button onClick={() => handleCompleteMaintenance(item.id)} className="bg-emerald-50 text-emerald-600 hover:bg-emerald-100 px-2 py-1 rounded font-bold">แก้ไขเรียบร้อยแล้ว</button>
                          ) : (
                            <span className="text-slate-400">ปิดงานเรียบร้อย</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-6 pt-6 border-t border-slate-100 space-y-3">
                <h4 className="text-sm font-bold text-indigo-900"><i className="fa-solid fa-circle-question mr-1"></i>คู่มือการประเมินและการแก้ไขปัญหาเบื้องต้นสำหรับผู้ดูแล</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="p-3 bg-indigo-50/50 border border-indigo-100 rounded-xl space-y-1">
                    <p className="font-bold text-indigo-900"><i className="fa-solid fa-lightbulb text-amber-500 mr-1"></i>ระบบไฟและหลอดไฟส่วนกลางดับ</p>
                    <p className="text-slate-500">1. เข้าไปตรวจสอบแผงสวิตช์และ Timer ตั้งเวลาเปิด-ปิดไฟ</p>
                    <p className="text-slate-500">2. ดูเบรกเกอร์ย่อย (MDB) ว่าทริปเนื่องจากไฟลัดวงจรหรือไม่</p>
                  </div>
                  <div className="p-3 bg-rose-50/50 border border-rose-100 rounded-xl space-y-1">
                    <p className="font-bold text-rose-900"><i class="fa-solid fa-faucet-drip text-sky-500 mr-1"></i>น้ำประปาส่วนกลางหยุดไหล</p>
                    <p className="text-slate-500">1. เข้าตรวจสอบเครื่องปั๊มน้ำ Booster pump ชั้นล่าง</p>
                    <p className="text-slate-500">2. เช็คตู้ควบคุมไฟฟ้าของปั๊มน้ำและระบบลูกลอยแทงค์เก็บน้ำ</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* --- TAB: SETTINGS & SHEETS --- */}
        {activeTab === 'settings' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
              <h3 className="text-base font-bold text-slate-800 pb-2 border-b border-slate-100"><i className="fa-solid fa-gears text-indigo-500 mr-2"></i>ตั้งค่า Google Sheet Sync</h3>
              
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Google Sheets Web App URL</label>
                  <input 
                    type="text" 
                    value={googleSheetUrl}
                    onChange={(e) => {
                      setGoogleSheetUrl(e.target.value);
                      localStorage.setItem('setting_sheet_url_react', e.target.value);
                    }}
                    placeholder="https://script.google.com/macros/s/.../exec" 
                    className="w-full border border-slate-200 rounded-lg p-2 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <div className="flex gap-2">
                  <button onClick={testSyncConnection} disabled={isTestingSync} className="flex-grow bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded-lg text-xs transition duration-200">
                    {isTestingSync ? 'กำลังเชื่อมต่อ...' : 'บันทึกและเชื่อมต่อทดสอบ'}
                  </button>
                </div>

                {syncTestMessage && (
                  <div className={`p-3 rounded-lg text-xs font-medium ${syncTestMessage.success ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
                    {syncTestMessage.text}
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm lg:col-span-2 space-y-4 text-xs text-slate-600">
              <h3 className="text-base font-bold text-indigo-900 border-b border-slate-100 pb-2"><i className="fa-brands fa-google-drive text-emerald-600 mr-2"></i>คู่มือการเปิดใช้งานคลาวด์และ Google Sheets</h3>
              <p className="font-semibold text-slate-800">ทำตามขั้นตอนอย่างง่ายเพื่อนำเอาข้อมูลบันทึกเก็บไว้แบบเรียลไทม์:</p>
              <ol className="list-decimal pl-4 space-y-2">
                <li>เปิด <a href="https://sheets.google.com" target="_blank" className="text-indigo-600 font-bold underline">Google Sheets</a> และตั้งชื่อแผ่นงานแผ่นแรกว่า <code className="bg-slate-100 px-1 py-0.5 rounded text-indigo-600">Data</code></li>
                <li>ไปที่เมนู <strong className="text-slate-800">ส่วนขยาย (Extensions)</strong> &gt; <strong class="text-slate-800">Apps Script</strong></li>
                <li>นำเอาโค้ดในกล่องข้างล่างนี้ คัดลอกและไปวางทับแถบโค้ดในโปรเจกต์ของคลาวด์ชีตคุณ</li>
                <li>กดปุ่ม <strong className="text-slate-800">Deploy (การทำให้ใช้งานได้)</strong> &gt; <strong className="text-slate-800">New Deployment</strong></li>
                <li>เลือกประเภทเว็บแอปและกำหนดให้ <strong className="text-indigo-600 font-bold">"ทุกคน (Anyone)"</strong> เข้าใช้งานได้ กดตกลงสิทธิ์แล้วเซฟและคัดลอก URL มาแปะด้านซ้าย</li>
              </ol>

              <div className="mt-4">
                <span className="block font-bold text-slate-700 mb-1">โค้ดส่วนของ Apps Script (สำหรับวางใน Google Sheets):</span>
                <textarea 
                  readOnly 
                  onClick={(e) => e.target.select()}
                  value={`function doPost(e) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Data");
  if (!sheet) {
    sheet = SpreadsheetApp.getActiveSpreadsheet().insertSheet("Data");
    sheet.appendRow(["เวลาบันทึก", "เลขห้อง/ชื่อห้อง", "ผู้เช่า", "ประเภทงาน", "รายละเอียดค่าน้ำไฟ", "ผู้ทำรายการ", "ยอดเงินรวม"]);
  }
  try {
    var data = JSON.parse(e.postData.contents);
    sheet.appendRow([
      new Date(),
      data.roomId || "",
      data.tenantName || "",
      data.actionType || "",
      data.details || "",
      data.operator || "",
      data.totalAmount || 0
    ]);
    return ContentService.createTextOutput(JSON.stringify({"status": "success"}))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({"status": "error", "message": err.toString()}))
      .setMimeType(ContentService.MimeType.JSON);
  }
}`}
                  className="w-full h-32 bg-slate-800 text-slate-200 p-2.5 rounded-lg text-[10px] font-mono select-all focus:outline-none"
                />
              </div>
            </div>
          </div>
        )}
      </main>

      {/* --- MODAL: EDIT ROOM DETAILS (รวมแก้ไขชื่อ/เลขห้อง) --- */}
      {isRoomModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-800">
                ปรับแต่งข้อมูลห้องพัก: <span className="text-indigo-600 font-extrabold">{editingRoomOriginalId}</span>
              </h3>
              <button onClick={() => setIsRoomModalOpen(false)} className="text-slate-400 hover:text-slate-600"><i className="fa-solid fa-xmark text-lg"></i></button>
            </div>

            <div className="space-y-3.5 text-xs">
              {}
              <div className="p-3 bg-indigo-50/50 rounded-xl border border-indigo-100 space-y-1">
                <label className="block font-bold text-indigo-900"><i className="fa-solid fa-arrow-down-1-9 mr-1"></i>เลขที่ห้องพัก / ชื่อห้อง (แก้ไขเลขห้องที่นี่)</label>
                <input 
                  type="text" 
                  value={modalRoomId} 
                  onChange={(e) => setModalRoomId(e.target.value)}
                  placeholder="เช่น 101, 101-VIP, ห้องริมนํ้า" 
                  className="w-full border border-indigo-200 rounded-lg p-2 font-bold text-indigo-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white"
                />
                <p className="text-[10px] text-slate-500"><i className="fa-solid fa-circle-info mr-1 text-indigo-500"></i>เปลี่ยนเลขห้องเพื่อจัดเรียง ออกบิล หรือบันทึกคลาวด์ได้ทันที</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-500 font-semibold mb-1">สถานะห้องพัก</label>
                  <select 
                    value={modalStatus} 
                    onChange={(e) => setModalStatus(e.target.value)} 
                    className="w-full border border-slate-200 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="ว่าง">ว่าง (พร้อมเช่า)</option>
                    <option value="ไม่ว่าง">ไม่ว่าง (มีผู้เช่าสัญญาเช่า)</option>
                    <option value="จองแล้ว">จองแล้ว (วางมัดจำจอง)</option>
                    <option value="ชำรุด">ชำรุด (ปิดบำรุงรักษา)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-500 font-semibold mb-1">ค่าเช่ารายเดือน (บาท)</label>
                  <input type="number" value={modalRent} onChange={(e) => setModalRent(e.target.value)} className="w-full border border-slate-200 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500" />
                </div>
              </div>

              {(modalStatus === 'ไม่ว่าง' || modalStatus === 'จองแล้ว') && (
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-3">
                  <span className="font-bold text-indigo-900 block border-b border-indigo-100 pb-1">รายละเอียดและสัญญาผู้พักอาศัย</span>
                  <div>
                    <label className="block text-slate-500 mb-0.5">ชื่อ-นามสกุล ผู้เช่า</label>
                    <input type="text" value={modalTenantName} onChange={(e) => setModalTenantName(e.target.value)} placeholder="ระบุชื่อผู้เช่า..." className="w-full border border-slate-200 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500" />
                  </div>
                  <div>
                    <label className="block text-slate-500 mb-0.5">เบอร์โทรศัพท์ติดต่อ</label>
                    <input type="text" value={modalTenantPhone} onChange={(e) => setModalTenantPhone(e.target.value)} placeholder="ระบุเบอร์โทร..." className="w-full border border-slate-200 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500" />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-slate-500 mb-0.5">วันเริ่มต้นสัญญาเช่า</label>
                      <input type="date" value={modalContractStart} onChange={(e) => setModalContractStart(e.target.value)} className="w-full border border-slate-200 rounded-lg p-2" />
                    </div>
                    <div>
                      <label className="block text-slate-500 mb-0.5">วันสิ้นสุดสัญญาเช่า</label>
                      <input type="date" value={modalContractEnd} onChange={(e) => setModalContractEnd(e.target.value)} className="w-full border border-slate-200 rounded-lg p-2" />
                    </div>
                  </div>
                </div>
              )}

              <div className="p-4 bg-amber-50/40 rounded-xl border border-amber-100 space-y-2">
                <span className="font-bold text-amber-800 block border-b border-amber-100 pb-1">บันทึกเลขอ้างอิงมิเตอร์เริ่มต้น/ล่าสุด</span>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-500 mb-0.5">มิเตอร์ไฟฟ้า</label>
                    <input type="number" value={modalElectricMeter} onChange={(e) => setModalElectricMeter(e.target.value)} className="w-full border border-slate-200 rounded-lg p-2" />
                  </div>
                  <div>
                    <label className="block text-slate-500 mb-0.5">มิเตอร์น้ำประปา</label>
                    <input type="number" value={modalWaterMeter} onChange={(e) => setModalWaterMeter(e.target.value)} className="w-full border border-slate-200 rounded-lg p-2" />
                  </div>
                </div>
              </div>

              <button onClick={saveRoomDetails} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 rounded-xl transition">
                <i className="fa-solid fa-cloud-arrow-up mr-1"></i> บันทึกข้อมูลห้องพัก
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL: CHANGE OPERATOR --- */}
      {isUserModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 space-y-4 text-xs">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-800"><i className="fa-solid fa-user-pen text-indigo-500 mr-2"></i>ระบุชื่อผู้ดำเนินการบันทึกข้อมูล</h3>
              <button onClick={() => setIsUserModalOpen(false)} className="text-slate-400 hover:text-slate-600"><i className="fa-solid fa-xmark text-lg"></i></button>
            </div>
            <div className="space-y-3">
              <p className="text-slate-500 leading-relaxed">ชื่อของคุณจะปรากฏบนใบแจ้งหนี้ ประวัติการแก้ไข และระบบคลาวด์ทุกครั้งเพื่อใช้ในการตรวจสอบความถูกต้องย้อนหลังครับ</p>
              <input 
                type="text" 
                value={tempOperatorName} 
                onChange={(e) => setTempOperatorName(e.target.value)}
                placeholder="ระบุชื่อจริงหรือแอดมินดูแล" 
                className="w-full border border-slate-200 rounded-lg p-2 text-sm font-semibold focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
              <button onClick={saveOperatorName} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 rounded-lg transition">
                บันทึกชื่อผู้ใช้
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-indigo-950 text-indigo-200 py-6 border-t border-indigo-900 mt-12 text-center text-xs">
        <p>© 2026 Smart Apartment OS. โครงสร้างรองรับสำหรับใช้งานบน Vercel และ Google Drive</p>
      </footer>
    </div>
  );
}