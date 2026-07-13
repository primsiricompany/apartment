import React, { useState, useEffect } from 'react';
import { 
  Home, 
  Users, 
  FileText, 
  Settings, 
  TrendingUp, 
  DollarSign, 
  CheckCircle, 
  XCircle, 
  Edit3, 
  Trash2, 
  Plus, 
  Eye, 
  Save, 
  Database, 
  Zap, 
  Droplet, 
  Printer, 
  Search,
  Check,
  AlertCircle,
  Wrench,
  AlertTriangle,
  MessageSquare,
  Sparkles
} from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [rooms, setRooms] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Recorder configuration
  const [recorderName, setRecorderName] = useState('ผู้ดูแลระบบ');

  // Issues and Maintenance States
  const [issues, setIssues] = useState([]);
  const [isAddingIssue, setIsAddingIssue] = useState(false);
  const [newIssueData, setNewIssueData] = useState({
    title: '',
    category: 'ไฟฟ้า', // ไฟฟ้า, ประปา, โครงสร้าง, ความสะอาด, อื่นๆ
    roomNumber: 'ส่วนกลาง', // ส่วนกลาง หรือระบุหมายเลขห้อง
    location: '',
    description: '',
    urgency: 'ปกติ', // ปกติ, ด่วน, ด่วนที่สุด
    status: 'รอดำเนินการ' // รอดำเนินการ, กำลังตรวจสอบ, กำลังซ่อม, เสร็จสิ้น
  });
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [issueNotes, setIssueNotes] = useState('');
  const [issueStatusUpdate, setIssueStatusUpdate] = useState('รอดำเนินการ');

  // Settings for Google Sheets
  const [sheetUrl, setSheetUrl] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('disconnected'); // disconnected, connected, error
  const [apiLogs, setApiLogs] = useState([]);

  // States for Room Add/Delete
  const [isAddingRoom, setIsAddingRoom] = useState(false);
  const [newRoomData, setNewRoomData] = useState({
    number: '',
    floor: 1,
    rentPrice: 3500,
    status: 'ว่าง'
  });
  const [roomToDelete, setRoomToDelete] = useState(null);

  // Form states for editing room / utilities
  const [isEditingRoom, setIsEditingRoom] = useState(false);
  const [editFormData, setEditFormData] = useState({
    id: '',
    tenantName: '',
    phone: '',
    rentPrice: 3500,
    prevWater: 0,
    currWater: 0,
    prevElectricity: 0,
    currElectricity: 0,
    status: 'ว่าง',
    renovationNotes: '',
    expectedFinishDate: ''
  });

  const [waterUnitCost, setWaterUnitCost] = useState(18);
  const [elecUnitCost, setElecUnitCost] = useState(7);
  const [centralFee, setCentralFee] = useState(100);

  // --- ✨ Gemini API State & Integration ---
  const [isAiAnalyzing, setIsAiAnalyzing] = useState(false);
  const [aiAnalysisResult, setAiAnalysisResult] = useState('');
  const [isAiDrafting, setIsAiDrafting] = useState(false);
  const [aiDraftTone, setAiDraftTone] = useState('สุภาพ'); // สุภาพ, เป็นกันเอง, เร่งรัด
  const [aiDraftedText, setAiDraftedText] = useState('');
  const [isAiAdvising, setIsAiAdvising] = useState(false);
  const [aiAdviceResult, setAiAdviceResult] = useState({}); // { [issueId]: advice }

  // Exponential Backoff API Wrapper
  const callGeminiAPI = async (prompt, systemPrompt = "") => {
    const apiKey = ""; // Runtime automatically injects the key if empty
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`;
    
    let delay = 1000;
    for (let attempt = 0; attempt < 5; attempt++) {
      try {
        const payload = {
          contents: [{ parts: [{ text: prompt }] }]
        };
        if (systemPrompt) {
          payload.systemInstruction = { parts: [{ text: systemPrompt }] };
        }
        
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        });

        if (!response.ok) {
          throw new Error(`API returned status ${response.status}`);
        }

        const data = await response.json();
        const textResult = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (textResult) {
          return textResult;
        } else {
          throw new Error("Empty response payload from Gemini");
        }
      } catch (error) {
        if (attempt === 4) {
          throw error;
        }
        await new Promise(resolve => setTimeout(resolve, delay));
        delay *= 2;
      }
    }
  };

  // 1. ✨ AI Dormitory Analysis
  const handleAiDormAnalysis = async () => {
    setIsAiAnalyzing(true);
    addLog("กำลังเรียกใช้งาน ✨ AI วิเคราะห์ข้อมูลหอพัก...", "info");
    
    const overviewData = {
      totalRooms: rooms.length,
      rented: countStatus('มีผู้เช่า'),
      available: countStatus('ว่าง'),
      reserved: countStatus('จองแล้ว'),
      underMaintenance: countStatus('ปรับปรุง'),
      estimatedRevenue: totalMonthlyIncome,
      pendingIssues: issues.filter(i => i.status !== 'เสร็จสิ้น').length,
      issuesList: issues.filter(i => i.status !== 'เสร็จสิ้น').map(i => ({
        title: i.title,
        room: i.roomNumber,
        urgency: i.urgency
      }))
    };

    const systemPrompt = "คุณคือผู้เชี่ยวชาญด้านการบริหารจัดการหอพักและอสังหาริมทรัพย์ระดับมืออาชีพ จงวิเคราะห์ข้อมูลหอพักที่ได้รับและเสนอแนะแนวทางปฏิบัติอย่างเป็นรูปธรรม";
    const userPrompt = `กรุณาวิเคราะห์สถิติและข้อมูลหอพักในขณะนี้ และจัดทำรายงานสรุปสั้นๆ (ไม่เกิน 300 คำ) เป็นภาษาไทย โดยระบุหัวข้อดังนี้:
    1) สรุปจุดเด่นและสถานะการเงินปัจจุบัน
    2) การประเมินปัญหางานแจ้งซ่อมที่ค้างคา
    3) คำแนะนำและกลยุทธ์เชิงรุกสำหรับผู้ดูแลเพื่อเพิ่มรายรับและลดปัญหา
    
    นี่คือข้อมูลหอพักปัจจุบัน:
    ${JSON.stringify(overviewData, null, 2)}`;

    try {
      const result = await callGeminiAPI(userPrompt, systemPrompt);
      setAiAnalysisResult(result);
      addLog("✨ AI วิเคราะห์ข้อมูลหอพักและให้ข้อเสนอแนะสำเร็จ!", "success");
    } catch (error) {
      console.error(error);
      addLog(`ไม่สามารถเรียกใช้ AI วิเคราะห์หอพักได้: ${error.message}`, "error");
      setAiAnalysisResult("เกิดข้อผิดพลาดในการวิเคราะห์ข้อมูล กรุณาลองใหม่อีกครั้งในภายหลัง");
    } finally {
      setIsAiAnalyzing(false);
    }
  };

  // 2. ✨ AI Smart Invoice Text Drafting
  const handleAiDraftNotification = async () => {
    if (!selectedRoom) return;
    setIsAiDrafting(true);
    addLog(`กำลังร่างข้อความแจ้งเตือนสำหรับห้อง ${selectedRoom.number} ด้วย ✨ AI...`, "info");

    const bill = calculateRoomBill(selectedRoom);
    const roomInfo = {
      roomNumber: selectedRoom.number,
      tenantName: selectedRoom.tenantName,
      rentPrice: bill.rent,
      waterUnits: bill.waterUnits,
      waterCost: bill.waterCost,
      elecUnits: bill.elecUnits,
      elecCost: bill.elecCost,
      centralFee: bill.centralFee,
      totalAmount: bill.total,
      recorderName: recorderName
    };

    const systemPrompt = "คุณคือเลขานุการ AI ของหอพัก คอยเขียนจดหมายและร่างข้อความแจ้งหนี้ค่าเช่าที่สุภาพ ชัดเจน และสอดคล้องกับโทนที่เลือก";
    const userPrompt = `กรุณาร่างข้อความสั้นๆ สำหรับส่งทางแอปพลิเคชันแชท (เช่น Line หรือ Messenger) เพื่อส่งแจ้งหนี้ค่าเช่าประจำเดือนให้กับผู้เช่า โดยใช้โทนน้ำเสียงแบบ "${aiDraftTone}" 
    ระบุค่าเช่าและค่าใช้จ่ายต่างๆ อย่างละเอียด รวมทั้งวิธีการติดต่อกลับหรือช่องทางการรับเงิน (สมมติว่าเป็นบัญชีธนาคารหอพัก)
    
    ข้อมูลผู้เช่าและยอดเงิน:
    ${JSON.stringify(roomInfo, null, 2)}`;

    try {
      const result = await callGeminiAPI(userPrompt, systemPrompt);
      setAiDraftedText(result);
      addLog("✨ AI ร่างข้อความแจ้งเตือนค่าเช่าสำเร็จ!", "success");
    } catch (error) {
      console.error(error);
      addLog(`ไม่สามารถร่างข้อความด้วย AI ได้: ${error.message}`, "error");
      setAiDraftedText("เกิดข้อผิดพลาดในการร่างข้อความ กรุณาลองใหม่อีกครั้ง");
    } finally {
      setIsAiDrafting(false);
    }
  };

  // 3. ✨ AI Maintenance Fix Recommendations
  const handleAiMaintenanceAdvice = async (issue) => {
    setIsAiAdvising(true);
    addLog(`กำลังวิเคราะห์ความเสียหายเพื่อหาทางแก้ไขสำหรับ "${issue.title}" ด้วย ✨ AI...`, "info");

    const systemPrompt = "คุณคือช่างเทคนิคอาวุโสประจำหอพักและวิศวกรผู้เชี่ยวชาญการซ่อมบำรุงอาคาร คอยให้คำปรึกษาแนวทางการซ่อมแซมอย่างรวดเร็ว ปลอดภัย และประหยัดค่าใช้จ่าย";
    const userPrompt = `กรุณาวิเคราะห์ปัญหาแจ้งซ่อมนี้ และสรุปแนวทางการทำงานโดยสังเขป:
    - สาเหตุที่น่าจะเป็นไปได้มากที่สุด
    - ขั้นตอนการแก้ไขเบื้องต้นสำหรับผู้ดูแลหอพัก (เพื่อความปลอดภัยหรือระงับเหตุ)
    - เครื่องมือหรือประเภทช่างเทคนิคที่เหมาะสมเพื่อเข้ามาดำเนินการ
    - ประมาณการค่าอะไหล่/ค่าใช้จ่ายคร่าวๆ (บาท)
    
    ข้อมูลปัญหา:
    ประเภท: ${issue.category}
    หัวข้อ: ${issue.title}
    สถานที่: ${issue.location}
    ระดับความเร่งด่วน: ${issue.urgency}
    คำอธิบาย: ${issue.description}`;

    try {
      const result = await callGeminiAPI(userPrompt, systemPrompt);
      setAiAdviceResult(prev => ({
        ...prev,
        [issue.id]: result
      }));
      addLog(`✨ AI วิเคราะห์ทางเลือกการแก้ไขของปัญหา "${issue.title}" สำเร็จ!`, "success");
    } catch (error) {
      console.error(error);
      addLog(`ไม่สามารถดึงข้อคิดเห็นทางเทคนิคจาก AI ได้: ${error.message}`, "error");
    } finally {
      setIsAiAdvising(false);
    }
  };

  useEffect(() => {
    // Load recorder name
    const savedRecorder = localStorage.getItem('dorm_recorder_name');
    if (savedRecorder) {
      setRecorderName(savedRecorder);
    }

    // Load Issues
    const savedIssues = localStorage.getItem('dorm_issues_data');
    if (savedIssues) {
      setIssues(JSON.parse(savedIssues));
    } else {
      // Mock initial issues for common areas
      const initialIssues = [
        {
          id: 'iss-1',
          title: 'หลอดไฟทางเดินชั้น 2 ดับ',
          category: 'ไฟฟ้า',
          location: 'หน้าห้อง 203',
          description: 'หลอดไฟกระพริบตลอดเวลาแล้วตอนนี้ดับไป รบกวนเปลี่ยนหลอดใหม่ด้วยค่ะ',
          urgency: 'ปกติ',
          status: 'รอดำเนินการ',
          reportedBy: 'ผู้เช่าห้อง 203',
          reportedAt: '10/07/2026 09:30',
          lastUpdatedBy: 'ระบบเริ่มต้น',
          notes: ''
        },
        {
          id: 'iss-2',
          title: 'เครื่องซักผ้าหยอดเหรียญน้ำรั่ว',
          category: 'ประปา',
          location: 'พื้นที่ซักล้าง ชั้น 1',
          description: 'เครื่องซักผ้าเครื่องที่ 2 มีน้ำซึมออกจากใต้เครื่องนองเต็มพื้นตอนใช้งาน',
          urgency: 'ด่วน',
          status: 'กำลังซ่อม',
          reportedBy: 'ผู้เช่าห้อง 104',
          reportedAt: '09/07/2026 14:15',
          lastUpdatedBy: 'ช่างบำรุง',
          notes: 'ช่างสั่งซื้อท่อน้ำทิ้งอันใหม่มาเปลี่ยนแล้ว กำลังรออะไหล่'
        }
      ];
      setIssues(initialIssues);
      localStorage.setItem('dorm_issues_data', JSON.stringify(initialIssues));
    }

    const savedRooms = localStorage.getItem('dorm_rooms_data');
    if (savedRooms) {
      setRooms(JSON.parse(savedRooms));
    } else {
      // Create initial 20 rooms (Floors 1-4, 5 rooms per floor)
      const initialRooms = Array.from({ length: 20 }, (_, i) => {
        const roomNumber = 101 + Math.floor(i / 5) * 100 + (i % 5);
        const hasTenant = i % 3 !== 0; 
        return {
          id: roomNumber.toString(),
          number: roomNumber.toString(),
          floor: Math.floor(i / 5) + 1,
          status: hasTenant ? 'มีผู้เช่า' : (i === 12 ? 'ปรับปรุง' : (i === 15 ? 'จองแล้ว' : 'ว่าง')),
          tenantName: hasTenant ? `ผู้เช่าห้อง ${roomNumber}` : '',
          phone: hasTenant ? `081-234-56${i.toString().padStart(2, '0')}` : '',
          rentPrice: 3500 + (Math.floor(i / 5) * 200),
          prevWater: hasTenant ? 120 : 0,
          currWater: hasTenant ? 135 : 0,
          prevElectricity: hasTenant ? 450 : 0,
          currElectricity: hasTenant ? 580 : 0,
          renovationNotes: i === 12 ? 'เปลี่ยนแอร์เครื่องใหม่ และทำสีผนังฝั่งระเบียงใหม่' : '',
          expectedFinishDate: i === 12 ? '2026-07-25' : '',
          lastUpdated: new Date().toLocaleDateString('th-TH') + ' ' + new Date().toLocaleTimeString('th-TH'),
          lastUpdatedBy: 'ระบบเริ่มต้น'
        };
      });
      setRooms(initialRooms);
      localStorage.setItem('dorm_rooms_data', JSON.stringify(initialRooms));
    }

    const savedSheetUrl = localStorage.getItem('dorm_sheet_url');
    if (savedSheetUrl) {
      setSheetUrl(savedSheetUrl);
      setConnectionStatus('connected');
    }
  }, []);

  const saveRoomsData = (updatedRooms) => {
    setRooms(updatedRooms);
    localStorage.setItem('dorm_rooms_data', JSON.stringify(updatedRooms));
  };

  const saveIssuesData = (updatedIssues) => {
    setIssues(updatedIssues);
    localStorage.setItem('dorm_issues_data', JSON.stringify(updatedIssues));
  };

  const handleRecorderChange = (name) => {
    setRecorderName(name);
    localStorage.setItem('dorm_recorder_name', name);
  };

  const addLog = (message, type = 'info') => {
    const newLog = {
      time: new Date().toLocaleTimeString('th-TH'),
      message,
      type
    };
    setApiLogs(prev => [newLog, ...prev].slice(0, 20));
  };

  const syncToGoogleSheets = async (action, data) => {
    if (!sheetUrl) {
      addLog('ไม่ได้ตั้งค่า Google Sheet URL ข้อมูลจะถูกบันทึกแค่ในเบราว์เซอร์นี้เท่านั้น', 'warning');
      return false;
    }

    setIsConnecting(true);
    addLog(`กำลังส่งข้อมูลแบบ '${action}' ไปยัง Google Sheets...`, 'info');

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);

      await fetch(sheetUrl, {
        method: 'POST',
        mode: 'no-cors',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: action,
          timestamp: new Date().toISOString(),
          data: data,
          recorder: recorderName || 'ไม่ได้ระบุ'
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      addLog(`ส่งข้อมูลสำเร็จไปยัง Google Sheet แล้ว`, 'success');
      setConnectionStatus('connected');
      setIsConnecting(false);
      return true;
    } catch (error) {
      console.error("Google Sheet API Error:", error);
      addLog(`ไม่สามารถเชื่อมต่อ Google Sheet ได้: ${error.message}`, 'error');
      setIsConnecting(false);
      return false;
    }
  };

  const handleAddIssue = async (e) => {
    e.preventDefault();
    const newIssue = {
      id: 'iss-' + Date.now(),
      title: newIssueData.title,
      category: newIssueData.category,
      roomNumber: newIssueData.roomNumber,
      location: newIssueData.roomNumber === 'ส่วนกลาง' ? newIssueData.location : `ห้อง ${newIssueData.roomNumber} (${newIssueData.location || 'ในห้องพัก'})`,
      description: newIssueData.description,
      urgency: newIssueData.urgency,
      status: 'รอดำเนินการ',
      reportedBy: recorderName || 'ผู้ดูแลระบบ',
      reportedAt: new Date().toLocaleDateString('th-TH') + ' ' + new Date().toLocaleTimeString('th-TH'),
      lastUpdatedBy: recorderName || 'ผู้ดูแลระบบ',
      notes: ''
    };

    const updatedIssues = [newIssue, ...issues];
    saveIssuesData(updatedIssues);
    setIsAddingIssue(false);
    setNewIssueData({
      title: '',
      category: 'ไฟฟ้า',
      roomNumber: 'ส่วนกลาง',
      location: '',
      description: '',
      urgency: 'ปกติ',
      status: 'รอดำเนินการ'
    });
    addLog(`แจ้งปัญหาสำเร็จ: "${newIssue.title}" เรียบร้อยแล้ว`, 'success');
    await syncToGoogleSheets('add_issue', newIssue);
  };

  const handleOpenIssueDetail = (issue) => {
    setSelectedIssue(issue);
    setIssueStatusUpdate(issue.status);
    setIssueNotes(issue.notes || '');
  };

  const handleUpdateIssueStatus = async (e) => {
    e.preventDefault();
    if (!selectedIssue) return;

    const updatedIssues = issues.map(iss => {
      if (iss.id === selectedIssue.id) {
        return {
          ...iss,
          status: issueStatusUpdate,
          notes: issueNotes,
          lastUpdatedBy: recorderName || 'ผู้ดูแลระบบ',
          lastUpdated: new Date().toLocaleDateString('th-TH') + ' ' + new Date().toLocaleTimeString('th-TH')
        };
      }
      return iss;
    });

    saveIssuesData(updatedIssues);
    const updatedIssueData = updatedIssues.find(i => i.id === selectedIssue.id);
    setSelectedIssue(null);
    addLog(`อัปเดตปัญหาแจ้งซ่อม "${updatedIssueData.title}" สำเร็จ`, 'success');
    await syncToGoogleSheets('update_issue', updatedIssueData);
  };

  const handleDeleteIssue = async (issueId) => {
    const updatedIssues = issues.filter(iss => iss.id !== issueId);
    saveIssuesData(updatedIssues);
    addLog(`ลบรายการแจ้งซ่อมออกจากระบบเรียบร้อย`, 'info');
    await syncToGoogleSheets('delete_issue', { id: issueId });
  };

  const handleAddRoom = async (e) => {
    e.preventDefault();
    
    if (rooms.some(r => r.number === newRoomData.number)) {
      addLog(`ไม่สามารถเพิ่มห้องได้: หมายเลขห้อง ${newRoomData.number} ซ้ำในระบบ`, 'error');
      return;
    }

    const newRoom = {
      id: newRoomData.number,
      number: newRoomData.number,
      floor: Number(newRoomData.floor),
      status: newRoomData.status,
      tenantName: '',
      phone: '',
      rentPrice: Number(newRoomData.rentPrice),
      prevWater: 0,
      currWater: 0,
      prevElectricity: 0,
      currElectricity: 0,
      lastUpdated: new Date().toLocaleDateString('th-TH') + ' ' + new Date().toLocaleTimeString('th-TH'),
      lastUpdatedBy: recorderName || 'ไม่ได้ระบุ'
    };

    const updatedRooms = [...rooms, newRoom].sort((a, b) => Number(a.number) - Number(b.number));
    saveRoomsData(updatedRooms);
    setIsAddingRoom(false);
    setNewRoomData({ number: '', floor: 1, rentPrice: 3500, status: 'ว่าง' });
    addLog(`เพิ่มห้องพักหมายเลข ${newRoom.number} เรียบร้อยแล้ว (โดย: ${recorderName || 'ไม่ได้ระบุ'})`, 'success');
    
    await syncToGoogleSheets('add_room', newRoom);
  };

  const handleDeleteRoom = async (roomId) => {
    const room = rooms.find(r => r.id === roomId);
    if (!room) return;

    const updatedRooms = rooms.filter(r => r.id !== roomId);
    saveRoomsData(updatedRooms);
    setRoomToDelete(null);
    addLog(`ลบห้องพักหมายเลข ${room.number} ออกจากระบบเรียบร้อยแล้ว (โดย: ${recorderName || 'ไม่ได้ระบุ'})`, 'success');
    
    await syncToGoogleSheets('delete_room', { id: roomId, number: room.number });
  };

  const handleOpenEdit = (room) => {
    setSelectedRoom(room);
    setEditFormData({
      id: room.id,
      tenantName: room.tenantName || '',
      phone: room.phone || '',
      rentPrice: room.rentPrice || 3500,
      prevWater: room.prevWater || 0,
      currWater: room.currWater || 0,
      prevElectricity: room.prevElectricity || 0,
      currElectricity: room.currElectricity || 0,
      status: room.status,
      renovationNotes: room.renovationNotes || '',
      expectedFinishDate: room.expectedFinishDate || ''
    });
    setIsEditingRoom(true);
  };

  const handleSaveRoom = async (e) => {
    e.preventDefault();
    
    const updatedRooms = rooms.map(r => {
      if (r.id === editFormData.id) {
        return {
          ...r,
          status: editFormData.status,
          tenantName: editFormData.status === 'ว่าง' ? '' : editFormData.tenantName,
          phone: editFormData.status === 'ว่าง' ? '' : editFormData.phone,
          rentPrice: Number(editFormData.rentPrice),
          prevWater: Number(editFormData.prevWater),
          currWater: Number(editFormData.currWater),
          prevElectricity: Number(editFormData.prevElectricity),
          currElectricity: Number(editFormData.currElectricity),
          renovationNotes: editFormData.status === 'ปรับปรุง' ? editFormData.renovationNotes : '',
          expectedFinishDate: editFormData.status === 'ปรับปรุง' ? editFormData.expectedFinishDate : '',
          lastUpdated: new Date().toLocaleDateString('th-TH') + ' ' + new Date().toLocaleTimeString('th-TH'),
          lastUpdatedBy: recorderName || 'ไม่ได้ระบุ'
        };
      }
      return r;
    });

    saveRoomsData(updatedRooms);
    setIsEditingRoom(false);
    setSelectedRoom(null);

    const updatedRoomData = updatedRooms.find(r => r.id === editFormData.id);
    addLog(`บันทึกการแก้ไขห้อง ${editFormData.id} เรียบร้อยแล้ว (โดย: ${recorderName || 'ไม่ได้ระบุ'})`, 'success');
    await syncToGoogleSheets('update_room', updatedRoomData);
  };

  const handleSaveSettings = (e) => {
    e.preventDefault();
    if (sheetUrl) {
      localStorage.setItem('dorm_sheet_url', sheetUrl);
      setConnectionStatus('connected');
      addLog('บันทึกที่อยู่ Google Sheets Web App สำเร็จ!', 'success');
    } else {
      localStorage.removeItem('dorm_sheet_url');
      setConnectionStatus('disconnected');
      addLog('ลบการเชื่อมโยง Google Sheets เรียบร้อย', 'info');
    }
  };

  const handleTestConnection = async () => {
    if (!sheetUrl) {
      addLog('กรุณากรอก URL ของ Google Sheets Web App ก่อนทดสอบ', 'error');
      return;
    }
    setIsConnecting(true);
    addLog('กำลังทดสอบการเชื่อมต่อ...', 'info');
    try {
      await syncToGoogleSheets('test_connection', { message: 'Hello from Dorm Manager' });
    } catch (e) {
      setConnectionStatus('error');
    }
  };

  const countStatus = (status) => rooms.filter(r => r.status === status).length;
  
  const calculateRoomBill = (room) => {
    const waterUnits = Math.max(0, room.currWater - room.prevWater);
    const elecUnits = Math.max(0, room.currElectricity - room.prevElectricity);
    
    const waterCost = waterUnits * waterUnitCost;
    const elecCost = elecUnits * elecUnitCost;
    const rent = room.rentPrice || 0;
    const total = rent + waterCost + elecCost + centralFee;

    return {
      waterUnits,
      waterCost,
      elecUnits,
      elecCost,
      rent,
      centralFee,
      total
    };
  };

  const totalMonthlyIncome = rooms
    .filter(r => r.status === 'มีผู้เช่า')
    .reduce((acc, room) => acc + calculateRoomBill(room).total, 0);

  const filteredRooms = rooms.filter(room => 
    room.number.includes(searchTerm) || 
    (room.tenantName && room.tenantName.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-800">
      
      {/* --- Header --- */}
      <header className="bg-indigo-900 text-white shadow-md px-6 py-4 flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-700 rounded-lg">
            <Home className="h-6 w-6 text-indigo-200" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-wide">DormManager v1.4</h1>
            <p className="text-xs text-indigo-200">ระบบจัดการหอพัก บันทึกชื่อผู้ใช้งาน & แจ้งซ่อม & ✨ AI อัจฉริยะ & Google Sheets Sync</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto justify-end">
          {/* Active Recorder Display & Input */}
          <div className="flex items-center gap-2 bg-indigo-950/60 px-3.5 py-1.5 rounded-xl border border-indigo-800 w-full sm:w-auto">
            <Users className="h-4 w-4 text-indigo-300 shrink-0" />
            <span className="text-xs text-indigo-200 whitespace-nowrap">ผู้บันทึกข้อมูลปัจจุบัน:</span>
            <input 
              type="text" 
              value={recorderName} 
              onChange={(e) => handleRecorderChange(e.target.value)}
              placeholder="ระบุชื่อของคุณ..."
              className="bg-transparent text-xs font-semibold text-white border-b border-indigo-700 focus:border-indigo-400 focus:outline-none w-32 py-0"
              title="ชื่อนี้จะถูกแนบไปกับทุกรายการแก้ไขและข้อมูลที่ถูกส่งไปยัง Google Sheets"
            />
          </div>

          <div className="flex items-center gap-3">
            {connectionStatus === 'connected' ? (
              <span className="inline-flex items-center gap-1.5 py-1 px-3 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                เชื่อมต่อ Google Sheet แล้ว
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 py-1 px-3 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-500 border border-amber-500/20">
                <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                บันทึกในเครื่อง (Local Only)
              </span>
            )}
            
            <div className="text-xs text-indigo-300 bg-indigo-950 px-3 py-1.5 rounded-lg border border-indigo-800">
              จำนวนทั้งหมด: <strong>{rooms.length} ห้อง</strong>
            </div>
          </div>
        </div>
      </header>

      {/* --- Main Structure --- */}
      <div className="flex-1 flex flex-col md:flex-row">
        
        {/* --- Side Navigation --- */}
        <nav className="w-full md:w-64 bg-white border-r border-slate-200 p-4 flex md:flex-col gap-2 overflow-x-auto md:overflow-x-visible">
          <button 
            onClick={() => setActiveTab('dashboard')}
            className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-medium transition-colors ${activeTab === 'dashboard' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50'}`}
          >
            <TrendingUp className="h-5 w-5" />
            <span>ภาพรวม (Dashboard)</span>
          </button>
          
          <button 
            onClick={() => setActiveTab('rooms')}
            className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-medium transition-colors ${activeTab === 'rooms' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50'}`}
          >
            <Home className="h-5 w-5" />
            <span>จัดการห้องพัก ({rooms.length} ห้อง)</span>
          </button>

          <button 
            onClick={() => setActiveTab('billing')}
            className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-medium transition-colors ${activeTab === 'billing' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50'}`}
          >
            <FileText className="h-5 w-5" />
            <span>คำนวณบิลค่าเช่า</span>
          </button>

          <button 
            onClick={() => setActiveTab('issues')}
            className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-medium transition-colors ${activeTab === 'issues' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50'}`}
          >
            <Wrench className="h-5 w-5" />
            <div className="flex items-center justify-between w-full">
              <span>แจ้งซ่อม/ส่วนกลาง</span>
              {issues.filter(i => i.status !== 'เสร็จสิ้น').length > 0 && (
                <span className="bg-rose-500 text-white text-[10px] px-2 py-0.5 rounded-full font-bold">
                  {issues.filter(i => i.status !== 'เสร็จสิ้น').length}
                </span>
              )}
            </div>
          </button>

          <button 
            onClick={() => setActiveTab('settings')}
            className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-medium transition-colors ${activeTab === 'settings' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50'}`}
          >
            <Settings className="h-5 w-5" />
            <span>ตั้งค่า & Google Sheets</span>
          </button>
        </nav>

        {/* --- Workspaces --- */}
        <main className="flex-1 p-6 overflow-y-auto max-w-7xl mx-auto w-full">
          
          {/* 1. DASHBOARD TAB */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              
              {/* Stat Cards Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
                  <div>
                    <p className="text-xs text-slate-500 font-medium">มีผู้เช่าแล้ว</p>
                    <h3 className="text-2xl font-bold text-slate-800 mt-1">{countStatus('มีผู้เช่า')} / {rooms.length}</h3>
                  </div>
                  <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600">
                    <CheckCircle className="h-6 w-6" />
                  </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
                  <div>
                    <p className="text-xs text-slate-500 font-medium">ห้องว่างพร้อมเช่า</p>
                    <h3 className="text-2xl font-bold text-slate-800 mt-1">{countStatus('ว่าง')} ห้อง</h3>
                  </div>
                  <div className="p-3 bg-blue-50 rounded-xl text-blue-600">
                    <Home className="h-6 w-6" />
                  </div>
                </div>

                <div 
                  onClick={() => setActiveTab('issues')}
                  className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between cursor-pointer hover:shadow-md transition-all"
                >
                  <div>
                    <p className="text-xs text-slate-500 font-medium">งานแจ้งซ่อมค้างอยู่</p>
                    <h3 className="text-2xl font-bold text-slate-800 mt-1">
                      {issues.filter(i => i.status !== 'เสร็จสิ้น').length} เคส
                    </h3>
                  </div>
                  <div className="p-3 bg-rose-50 rounded-xl text-rose-600">
                    <AlertTriangle className="h-6 w-6" />
                  </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
                  <div>
                    <p className="text-xs text-slate-500 font-medium">ประเมินรายรับเดือนนี้</p>
                    <h3 className="text-2xl font-bold text-slate-800 mt-1">
                      ฿{totalMonthlyIncome.toLocaleString('th-TH')}
                    </h3>
                  </div>
                  <div className="p-3 bg-indigo-50 rounded-xl text-indigo-600">
                    <DollarSign className="h-6 w-6" />
                  </div>
                </div>
              </div>

              {/* ✨ Gemini AI Dorm Analysis Section */}
              <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-6 rounded-2xl border border-indigo-150 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                  <div>
                    <h3 className="font-extrabold text-indigo-900 text-lg flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-indigo-600 animate-pulse" /> ✨ ผู้ช่วย AI สรุปวิเคราะห์และแนะนำแผนธุรกิจหอพัก
                    </h3>
                    <p className="text-xs text-indigo-700 font-medium">
                      ส่งข้อมูลสถานะการจอง, รายรับ และงานซ่อมทั้งหมดให้ AI ช่วยคำนวณและประมวลผลคำแนะนำเชิงกลยุทธ์
                    </p>
                  </div>
                  <button
                    onClick={handleAiDormAnalysis}
                    disabled={isAiAnalyzing}
                    className="shrink-0 flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 px-5 rounded-xl text-xs transition-colors shadow-sm disabled:opacity-50"
                  >
                    {isAiAnalyzing ? (
                      <>
                        <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                        กำลังวิเคราะห์...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4" />
                        ✨ วิเคราะห์หอพักด้วย AI
                      </>
                    )}
                  </button>
                </div>

                {aiAnalysisResult && (
                  <div className="bg-white p-5 rounded-xl border border-indigo-100 text-slate-700 text-sm whitespace-pre-wrap leading-relaxed shadow-inner">
                    <div className="flex items-center gap-1.5 font-bold text-indigo-800 mb-2 border-b pb-2">
                      <Sparkles className="h-4 w-4" /> ผลการวิเคราะห์และข้อเสนอแนะเชิงลึกจาก AI
                    </div>
                    {aiAnalysisResult}
                  </div>
                )}
              </div>

              {/* Quick Utility Rates Panel */}
              <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                <h3 className="font-bold text-slate-800 text-lg mb-4 flex items-center gap-2">
                  <Settings className="h-5 w-5 text-indigo-500" /> อัตราค่าบริการพื้นฐาน
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex items-center gap-3">
                    <Zap className="h-8 w-8 text-amber-500" />
                    <div>
                      <p className="text-xs text-slate-500">ค่าไฟต่อหน่วย</p>
                      <input 
                        type="number" 
                        value={elecUnitCost} 
                        onChange={(e) => setElecUnitCost(Number(e.target.value))}
                        className="w-16 font-bold bg-transparent text-slate-800 border-b border-indigo-300 focus:outline-none"
                      /> <span className="text-xs text-slate-500">บาท</span>
                    </div>
                  </div>

                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex items-center gap-3">
                    <Droplet className="h-8 w-8 text-blue-500" />
                    <div>
                      <p className="text-xs text-slate-500">ค่าน้ำต่อหน่วย</p>
                      <input 
                        type="number" 
                        value={waterUnitCost} 
                        onChange={(e) => setWaterUnitCost(Number(e.target.value))}
                        className="w-16 font-bold bg-transparent text-slate-800 border-b border-indigo-300 focus:outline-none"
                      /> <span className="text-xs text-slate-500">บาท</span>
                    </div>
                  </div>

                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex items-center gap-3">
                    <DollarSign className="h-8 w-8 text-indigo-500" />
                    <div>
                      <p className="text-xs text-slate-500">ค่าส่วนกลาง / ขยะ</p>
                      <input 
                        type="number" 
                        value={centralFee} 
                        onChange={(e) => setCentralFee(Number(e.target.value))}
                        className="w-16 font-bold bg-transparent text-slate-800 border-b border-indigo-300 focus:outline-none"
                      /> <span className="text-xs text-slate-500">บาท</span>
                    </div>
                  </div>
                </div>
              </div>

              {rooms.filter(r => r.status === 'ปรับปรุง').length > 0 && (
                <div className="bg-amber-50/50 p-6 rounded-2xl border border-amber-150 shadow-sm space-y-3">
                  <h3 className="font-bold text-amber-800 text-base flex items-center gap-2">
                    <Wrench className="h-5 w-5 text-amber-600" /> ห้องพักที่อยู่ระหว่างการปรับปรุง / บำรุงรักษา ({rooms.filter(r => r.status === 'ปรับปรุง').length} ห้อง)
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {rooms.filter(r => r.status === 'ปรับปรุง').map(room => (
                      <div key={room.id} className="bg-white p-4 rounded-xl border border-amber-100 shadow-xs flex justify-between items-start gap-4">
                        <div className="space-y-1">
                          <span className="font-bold text-slate-800">ห้อง {room.number}</span>
                          <p className="text-xs text-slate-600 font-medium">รายละเอียด: {room.renovationNotes || <span className="text-slate-400 italic">ไม่มีข้อมูลการปรับปรุง</span>}</p>
                          {room.expectedFinishDate && (
                            <p className="text-[10px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md inline-block font-bold">
                              คาดว่าจะเสร็จสิ้น: {new Date(room.expectedFinishDate).toLocaleDateString('th-TH')}
                            </p>
                          )}
                        </div>
                        <button
                          onClick={() => handleOpenEdit(room)}
                          className="text-xs text-indigo-600 hover:text-indigo-800 font-bold shrink-0"
                        >
                          แก้ไขสถานะ
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Quick Room Overview Grid */}
              <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="font-bold text-slate-800 text-lg">ผังสถานะห้องพักจริง ({rooms.length} ห้อง)</h3>
                  <button 
                    onClick={() => setActiveTab('rooms')}
                    className="text-indigo-600 hover:text-indigo-800 text-sm font-semibold flex items-center gap-1"
                  >
                    จัดการทั้งหมด <Eye className="h-4 w-4" />
                  </button>
                </div>
                
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-4">
                  {rooms.map((room) => {
                    let statusColor = "bg-slate-50 border-slate-200 text-slate-700";
                    let badgeColor = "bg-slate-200 text-slate-700";
                    if (room.status === 'มีผู้เช่า') {
                      statusColor = "bg-emerald-50 border-emerald-200 text-emerald-800";
                      badgeColor = "bg-emerald-500 text-white";
                    } else if (room.status === 'จองแล้ว') {
                      statusColor = "bg-indigo-50 border-indigo-200 text-indigo-800";
                      badgeColor = "bg-indigo-500 text-white";
                    } else if (room.status === 'ปรับปรุง') {
                      statusColor = "bg-amber-50 border-amber-200 text-amber-800";
                      badgeColor = "bg-amber-500 text-white";
                    }

                    return (
                      <div 
                        key={room.id}
                        onClick={() => handleOpenEdit(room)}
                        className={`p-4 rounded-xl border-2 cursor-pointer transition-all hover:shadow-md hover:scale-[1.02] flex flex-col justify-between ${statusColor}`}
                      >
                        <div className="flex justify-between items-start">
                          <span className="text-lg font-bold">ห้อง {room.number}</span>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${badgeColor}`}>
                            {room.status}
                          </span>
                        </div>
                        <div className="mt-4 pt-2 border-t border-dashed border-slate-200/50">
                          <p className="text-xs truncate font-medium text-slate-700">
                            {room.tenantName || 'ว่างไม่มีผู้เช่า'}
                          </p>
                          <p className="text-[10px] text-slate-500 mt-0.5">
                            ชั้น {room.floor} | ฿{room.rentPrice}
                          </p>
                          {room.lastUpdatedBy && (
                            <p className="text-[9px] text-indigo-600/80 mt-1 truncate" title={`ผู้บันทึก: ${room.lastUpdatedBy}`}>
                              ผู้บันทึก: {room.lastUpdatedBy}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>
          )}

          {/* 2. ROOMS TAB */}
          {activeTab === 'rooms' && (
            <div className="space-y-6">
              
              {/* Header Actions */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                <div className="relative w-full sm:w-72">
                  <Search className="absolute left-3.5 top-3 h-4.5 w-4.5 text-slate-400" />
                  <input 
                    type="text" 
                    placeholder="ค้นหาเลขห้อง หรือชื่อผู้เช่า..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="flex gap-2 w-full sm:w-auto justify-end">
                  <button 
                    onClick={() => setIsAddingRoom(true)}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold flex items-center gap-1.5 transition-colors"
                  >
                    <Plus className="h-4.5 w-4.5" />
                    เพิ่มห้องพัก
                  </button>
                  <button 
                    onClick={() => {
                      localStorage.removeItem('dorm_rooms_data');
                      const initialRooms = Array.from({ length: 20 }, (_, i) => {
                        const roomNumber = 101 + Math.floor(i / 5) * 100 + (i % 5);
                        const hasTenant = i % 3 !== 0; 
                        return {
                          id: roomNumber.toString(),
                          number: roomNumber.toString(),
                          floor: Math.floor(i / 5) + 1,
                          status: hasTenant ? 'มีผู้เช่า' : (i === 12 ? 'ปรับปรุง' : (i === 15 ? 'จองแล้ว' : 'ว่าง')),
                          tenantName: hasTenant ? `ผู้เช่าห้อง ${roomNumber}` : '',
                          phone: hasTenant ? `081-234-56${i.toString().padStart(2, '0')}` : '',
                          rentPrice: 3500 + (Math.floor(i / 5) * 200),
                          prevWater: hasTenant ? 120 : 0,
                          currWater: hasTenant ? 135 : 0,
                          prevElectricity: hasTenant ? 450 : 0,
                          currElectricity: hasTenant ? 580 : 0,
                          lastUpdated: new Date().toLocaleDateString('th-TH') + ' ' + new Date().toLocaleTimeString('th-TH'),
                          lastUpdatedBy: 'ระบบเริ่มต้น'
                        };
                      });
                      saveRoomsData(initialRooms);
                      addLog('รีเซ็ตข้อมูลห้องพักกลับเป็นค่าเริ่มต้น 20 ห้องเรียบร้อยแล้ว', 'info');
                    }}
                    className="px-4 py-2 text-slate-600 hover:bg-slate-50 rounded-xl text-sm border border-slate-200 font-medium"
                  >
                    รีเซ็ตข้อมูลเดิม
                  </button>
                </div>
              </div>

              {/* Rooms Data Table */}
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 text-slate-500 text-xs font-semibold uppercase tracking-wider border-b border-slate-100">
                        <th className="py-4 px-6">เลขห้อง / ชั้น / ผู้บันทึก</th>
                        <th className="py-4 px-6">สถานะ</th>
                        <th className="py-4 px-6">ผู้เช่า / เบอร์โทร</th>
                        <th className="py-4 px-6">ค่าเช่าหลัก</th>
                        <th className="py-4 px-6 text-indigo-600">น้ำ (เก่า {`->`} ใหม่)</th>
                        <th className="py-4 px-6 text-amber-600">ไฟ (เก่า {`->`} ใหม่)</th>
                        <th className="py-4 px-6 text-center">จัดการ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-sm">
                      {filteredRooms.map((room) => {
                        let statusColor = "bg-slate-100 text-slate-700";
                        if (room.status === 'มีผู้เช่า') statusColor = "bg-emerald-100 text-emerald-800";
                        if (room.status === 'จองแล้ว') statusColor = "bg-indigo-100 text-indigo-800";
                        if (room.status === 'ปรับปรุง') statusColor = "bg-amber-100 text-amber-800";

                        return (
                          <tr key={room.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="py-4 px-6">
                              <span className="font-bold text-slate-800 text-base">ห้อง {room.number}</span>
                              <div className="text-xs text-slate-400 font-medium">ชั้น {room.floor}</div>
                              {room.lastUpdatedBy && (
                                <div className="text-[10px] text-indigo-600 mt-1 font-medium bg-indigo-50/70 inline-block px-1.5 py-0.5 rounded" title={`แก้ไขเมื่อ: ${room.lastUpdated}`}>
                                  จดโดย: {room.lastUpdatedBy}
                                </div>
                              )}
                            </td>
                            <td className="py-4 px-6">
                              <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold ${statusColor}`}>
                                {room.status}
                              </span>
                            </td>
                            <td className="py-4 px-6">
                              {room.tenantName ? (
                                <div>
                                  <div className="font-medium text-slate-800">{room.tenantName}</div>
                                  <div className="text-xs text-slate-400">{room.phone}</div>
                                </div>
                              ) : (
                                <span className="text-slate-400 italic">ไม่มีข้อมูล</span>
                              )}
                            </td>
                            <td className="py-4 px-6 font-semibold">
                              ฿{room.rentPrice.toLocaleString('th-TH')}
                            </td>
                            <td className="py-4 px-6">
                              <div className="flex items-center gap-1.5 text-xs">
                                <span className="bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded font-mono">{room.prevWater}</span>
                                <span className="text-slate-400">→</span>
                                <span className="bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded font-bold font-mono">{room.currWater}</span>
                              </div>
                              <span className="text-[10px] text-slate-400 font-medium">หน่วยรวม: {Math.max(0, room.currWater - room.prevWater)}</span>
                            </td>
                            <td className="py-4 px-6">
                              <div className="flex items-center gap-1.5 text-xs">
                                <span className="bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded font-mono">{room.prevElectricity}</span>
                                <span className="text-slate-400">→</span>
                                <span className="bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded font-bold font-mono">{room.currElectricity}</span>
                              </div>
                              <span className="text-[10px] text-slate-400 font-medium">หน่วยรวม: {Math.max(0, room.currElectricity - room.prevElectricity)}</span>
                            </td>
                            <td className="py-4 px-6 text-center">
                              <div className="flex items-center justify-center gap-2">
                                <button 
                                  onClick={() => handleOpenEdit(room)}
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 rounded-lg text-slate-600 transition-colors"
                                >
                                  <Edit3 className="h-4 w-4" /> บันทึกจดมิเตอร์/แก้ไข
                                </button>
                                <button 
                                  onClick={() => setRoomToDelete(room)}
                                  className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg transition-colors"
                                  title="ลบห้องพัก"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}

          {/* 3. BILLING TAB */}
          {activeTab === 'billing' && (
            <div className="space-y-6">
              
              <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                <h3 className="font-bold text-slate-800 text-lg mb-2">หน้าออกบิลค่าเช่า</h3>
                <p className="text-sm text-slate-500 mb-6">เลือกห้องที่มีสถานะ "มีผู้เช่า" เพื่อดูใบแจ้งหนี้ ค่าน้ำ ค่าไฟ และสร้างบิลแจ้งหนี้ด้วย AI</p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  
                  {/* List of active rooms */}
                  <div className="md:col-span-1 border-r border-slate-200 pr-0 md:pr-6 space-y-2 max-h-[500px] overflow-y-auto">
                    <label className="text-xs font-semibold uppercase text-slate-400 tracking-wider">เลือกห้องพักที่มีผู้เช่า ({countStatus('มีผู้เช่า')} ห้อง)</label>
                    {rooms.filter(r => r.status === 'มีผู้เช่า').length === 0 ? (
                      <div className="p-4 bg-slate-50 text-center text-slate-500 rounded-xl text-sm">
                        ไม่มีห้องที่มีผู้เช่าในขณะนี้
                      </div>
                    ) : (
                      rooms.filter(r => r.status === 'มีผู้เช่า').map(room => (
                        <button
                          key={room.id}
                          onClick={() => {
                            setSelectedRoom(room);
                            setAiDraftedText(''); // Reset AI Draft when room changes
                          }}
                          className={`w-full text-left p-4 rounded-xl border transition-all flex justify-between items-center ${selectedRoom?.id === room.id ? 'bg-indigo-50 border-indigo-300 ring-2 ring-indigo-200' : 'bg-white border-slate-200 hover:bg-slate-50'}`}
                        >
                          <div>
                            <span className="font-bold text-base text-slate-800">ห้อง {room.number}</span>
                            <p className="text-xs text-slate-500 mt-1">{room.tenantName}</p>
                          </div>
                          <div className="text-right">
                            <span className="text-xs font-bold text-indigo-600">
                              ฿{calculateRoomBill(room).total.toLocaleString('th-TH')}
                            </span>
                            <p className="text-[10px] text-slate-400">คลิกออกบิล</p>
                          </div>
                        </button>
                      ))
                    )}
                  </div>

                  {/* Invoice Preview & AI Drafter */}
                  <div className="md:col-span-2 space-y-6">
                    {selectedRoom && selectedRoom.status === 'มีผู้เช่า' ? (
                      <>
                        {/* AI Renter Notification Writer Block */}
                        <div className="bg-gradient-to-r from-purple-50 to-indigo-50 p-5 rounded-2xl border border-indigo-150 space-y-3">
                          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                            <div>
                              <h4 className="font-bold text-indigo-900 text-sm flex items-center gap-1.5">
                                <Sparkles className="h-4.5 w-4.5 text-indigo-600" /> ✨ ร่างข้อความแจ้งเตือนค่าเช่าด้วย AI
                              </h4>
                              <p className="text-[11px] text-indigo-700">แต่งข้อความอัตโนมัติเพื่อส่งทาง Line / SMS หาผู้เช่าได้ในคลิกเดียว</p>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              <select
                                value={aiDraftTone}
                                onChange={(e) => setAiDraftTone(e.target.value)}
                                className="text-xs bg-white border border-indigo-200 rounded-lg p-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-400"
                              >
                                <option value="สุภาพ">โทนสุภาพ/เป็นทางการ</option>
                                <option value="เป็นกันเอง">โทนเป็นกันเอง/น่ารัก</option>
                                <option value="เร่งรัด">โทนแจ้งเตือน/เร่งรัด (เมื่อจ่ายช้า)</option>
                              </select>
                              <button
                                onClick={handleAiDraftNotification}
                                disabled={isAiDrafting}
                                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-1.5 px-3.5 rounded-lg text-xs disabled:opacity-50 transition-colors shrink-0"
                              >
                                {isAiDrafting ? "กำลังร่าง..." : "✨ ร่างข้อความ"}
                              </button>
                            </div>
                          </div>

                          {aiDraftedText && (
                            <div className="space-y-2">
                              <textarea
                                readOnly
                                value={aiDraftedText}
                                rows="5"
                                className="w-full p-3 bg-white border border-indigo-100 rounded-xl text-xs text-slate-700 focus:outline-none font-sans"
                              />
                              <div className="flex justify-end">
                                <button
                                  onClick={() => {
                                    document.execCommand('copy');
                                    // Use copy action trick
                                    const el = document.createElement('textarea');
                                    el.value = aiDraftedText;
                                    document.body.appendChild(el);
                                    el.select();
                                    document.execCommand('copy');
                                    document.body.removeChild(el);
                                    addLog(`คัดลอกข้อความแจ้งเตือนของห้อง ${selectedRoom.number} ไปยัง Clipboard แล้ว`, "success");
                                  }}
                                  className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                                >
                                  คัดลอกข้อความแจ้งเตือน 📋
                                </button>
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
                          
                          {/* Printable Area ID */}
                          <div id="invoice-print-area" className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 max-w-lg mx-auto">
                            
                            {/* Invoice Header */}
                            <div className="text-center pb-4 border-b border-slate-200">
                              <h4 className="text-lg font-bold text-slate-800">ใบแจ้งหนี้ / ใบเสร็จรับเงิน</h4>
                              <p className="text-xs text-slate-500">ระบบหอพักแสนสุข DormManager</p>
                              <p className="text-[10px] text-slate-400 mt-1">วันที่ออกบิล: {new Date().toLocaleDateString('th-TH')}</p>
                            </div>

                            {/* Invoice Meta */}
                            <div className="grid grid-cols-2 gap-4 py-4 text-xs border-b border-slate-100">
                              <div>
                                <span className="text-slate-400">เลขห้อง:</span>
                                <p className="font-bold text-slate-800 text-sm">ห้อง {selectedRoom.number}</p>
                              </div>
                              <div>
                                <span className="text-slate-400">ผู้เช่า:</span>
                                <p className="font-bold text-slate-800 text-sm">{selectedRoom.tenantName}</p>
                              </div>
                            </div>

                            {/* Invoice Table Items */}
                            <div className="py-4 space-y-3 text-xs border-b border-slate-100">
                              <div className="flex justify-between font-medium">
                                <span>รายการ</span>
                                <span>จำนวนเงิน</span>
                              </div>

                              <div className="flex justify-between text-slate-600 pl-2">
                                <span>1. ค่าเช่าห้องพักหลัก</span>
                                <span className="font-semibold text-slate-800">฿{calculateRoomBill(selectedRoom).rent.toLocaleString('th-TH')}</span>
                              </div>

                              <div className="flex justify-between text-slate-600 pl-2">
                                <div>
                                  <span>2. ค่าน้ำประปา ({calculateRoomBill(selectedRoom).waterUnits} หน่วย)</span>
                                  <p className="text-[10px] text-slate-400">มิเตอร์: {selectedRoom.prevWater} ถึง {selectedRoom.currWater} (หน่วยละ ฿{waterUnitCost})</p>
                                </div>
                                <span className="font-semibold text-slate-800">฿{calculateRoomBill(selectedRoom).waterCost.toLocaleString('th-TH')}</span>
                              </div>

                              <div className="flex justify-between text-slate-600 pl-2">
                                <div>
                                  <span>3. ค่าไฟฟ้า ({calculateRoomBill(selectedRoom).elecUnits} หน่วย)</span>
                                  <p className="text-[10px] text-slate-400">มิเตอร์: {selectedRoom.prevElectricity} ถึง {selectedRoom.currElectricity} (หน่วยละ ฿{elecUnitCost})</p>
                                </div>
                                <span className="font-semibold text-slate-800">฿{calculateRoomBill(selectedRoom).elecCost.toLocaleString('th-TH')}</span>
                              </div>

                              <div className="flex justify-between text-slate-600 pl-2">
                                <span>4. ค่าส่วนกลางและสิ่งอำนวยความสะดวก</span>
                                <span className="font-semibold text-slate-800">฿{calculateRoomBill(selectedRoom).centralFee.toLocaleString('th-TH')}</span>
                              </div>
                            </div>

                            {/* Invoice Total */}
                            <div className="pt-4 flex justify-between items-center">
                              <span className="text-sm font-bold text-slate-800">ยอดเงินรวมที่ต้องชำระ:</span>
                              <span className="text-xl font-extrabold text-indigo-600">
                                ฿{calculateRoomBill(selectedRoom).total.toLocaleString('th-TH')}
                              </span>
                            </div>

                            {/* Signatures */}
                            <div className="mt-8 pt-8 border-t border-dashed border-slate-200 grid grid-cols-2 text-center text-[10px] text-slate-400">
                              <div>
                                <p className="mb-4">...................................................</p>
                                <p>ผู้จัดการหอพัก / ผู้รับเงิน</p>
                                <p className="text-[9px] text-indigo-600/70 mt-1">เจ้าหน้าที่: {recorderName}</p>
                              </div>
                              <div>
                                <p className="mb-4">...................................................</p>
                                <p>ผู้รับใบแจ้งหนี้ / ผู้จ่ายเงิน</p>
                              </div>
                            </div>

                          </div>

                          {/* Invoice Actions */}
                          <div className="mt-4 flex gap-3 justify-center">
                            <button 
                              onClick={() => window.print()}
                              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-6 rounded-xl shadow-sm text-sm transition-colors"
                            >
                              <Printer className="h-4 w-4" /> สั่งพิมพ์ใบแจ้งหนี้ (Print/PDF)
                            </button>
                          </div>

                        </div>
                      </>
                    ) : (
                      <div className="h-full min-h-[300px] flex flex-col justify-center items-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-slate-400 p-8">
                        <FileText className="h-12 w-12 text-slate-300 mb-2" />
                        <p className="font-medium text-slate-500">ยังไม่ได้เลือกห้องเพื่อออกบิล</p>
                        <p className="text-xs text-slate-400 mt-1">กรุณาเลือกห้องที่มีรายชื่อผู้เช่าจากแถบด้านซ้าย</p>
                      </div>
                    )}
                  </div>

                </div>
              </div>

            </div>
          )}

          {/* 4. COMMON AREA ISSUES TAB */}
          {activeTab === 'issues' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                <div>
                  <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                    <Wrench className="h-5 w-5 text-indigo-600" /> แจ้งปัญหาพื้นที่ส่วนกลาง & ซ่อมบำรุง
                  </h3>
                  <p className="text-sm text-slate-500 mt-1">
                    ระบบบันทึกและจัดการปัญหาชำรุดเสียหายในห้องเช่าและพื้นที่ส่วนกลางของหอพัก
                  </p>
                </div>
                <button 
                  onClick={() => setIsAddingIssue(true)}
                  className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold flex items-center gap-1.5 transition-colors self-end sm:self-auto"
                >
                  <Plus className="h-4 w-4" /> แจ้งปัญหาส่วนกลาง
                </button>
              </div>

              {/* Status Filters */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-xs flex flex-col justify-between">
                  <span className="text-xs text-slate-400 font-semibold uppercase">รอดำเนินการ</span>
                  <span className="text-2xl font-bold text-rose-500 mt-1">
                    {issues.filter(i => i.status === 'รอดำเนินการ').length}
                  </span>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-xs flex flex-col justify-between">
                  <span className="text-xs text-slate-400 font-semibold uppercase">กำลังตรวจสอบ</span>
                  <span className="text-2xl font-bold text-amber-500 mt-1">
                    {issues.filter(i => i.status === 'กำลังตรวจสอบ').length}
                  </span>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-xs flex flex-col justify-between">
                  <span className="text-xs text-slate-400 font-semibold uppercase">กำลังซ่อม</span>
                  <span className="text-2xl font-bold text-blue-500 mt-1">
                    {issues.filter(i => i.status === 'กำลังซ่อม').length}
                  </span>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-xs flex flex-col justify-between">
                  <span className="text-xs text-slate-400 font-semibold uppercase">เสร็จสิ้นแล้ว</span>
                  <span className="text-2xl font-bold text-emerald-500 mt-1">
                    {issues.filter(i => i.status === 'เสร็จสิ้น').length}
                  </span>
                </div>
              </div>

              {/* Issues Grid List */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {issues.length === 0 ? (
                  <div className="col-span-full bg-white p-12 rounded-2xl text-center border border-slate-100 text-slate-400">
                    <CheckCircle className="h-12 w-12 text-slate-300 mx-auto mb-2" />
                    <p className="font-medium text-slate-500">ไม่มีประวัติแจ้งปัญหาใดๆ ในขณะนี้</p>
                    <p className="text-xs text-slate-400 mt-1">พื้นที่ส่วนกลางของคุณได้รับการดูแลอย่างสมบูรณ์</p>
                  </div>
                ) : (
                  issues.map(iss => {
                    let urgencyColor = "bg-slate-100 text-slate-700";
                    if (iss.urgency === 'ด่วน') urgencyColor = "bg-amber-100 text-amber-800";
                    if (iss.urgency === 'ด่วนที่สุด') urgencyColor = "bg-rose-100 text-rose-800";

                    let statusBadge = "bg-slate-100 text-slate-600";
                    if (iss.status === 'รอดำเนินการ') statusBadge = "bg-rose-50 text-rose-700 border border-rose-200";
                    if (iss.status === 'กำลังตรวจสอบ') statusBadge = "bg-amber-50 text-amber-700 border border-amber-200";
                    if (iss.status === 'กำลังซ่อม') statusBadge = "bg-blue-50 text-blue-700 border border-blue-200";
                    if (iss.status === 'เสร็จสิ้น') statusBadge = "bg-emerald-50 text-emerald-700 border border-emerald-200";

                    return (
                      <div key={iss.id} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-all">
                        <div className="space-y-3">
                          <div className="flex justify-between items-start gap-2">
                            <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${urgencyColor}`}>
                              {iss.urgency}
                            </span>
                            <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${statusBadge}`}>
                              {iss.status}
                            </span>
                          </div>

                          <div>
                            <h4 className="font-bold text-slate-800 text-base">{iss.title}</h4>
                            <div className="flex items-center gap-1 text-xs text-slate-500 font-medium mt-1">
                              <span className="bg-slate-100 px-2 py-0.5 rounded-md text-slate-600">{iss.category}</span>
                              <span>•</span>
                              <span>สถานที่: <strong>{iss.location}</strong></span>
                            </div>
                          </div>

                          <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100 whitespace-pre-line leading-relaxed">
                            {iss.description}
                          </p>

                          {/* ✨ AI Maintenance Advisor Box */}
                          <div className="bg-gradient-to-r from-violet-50 to-indigo-50 p-3 rounded-xl border border-indigo-100 space-y-2 mt-2">
                            <div className="flex justify-between items-center">
                              <span className="text-xs font-bold text-indigo-900 flex items-center gap-1">
                                <Sparkles className="h-3.5 w-3.5 text-indigo-600" /> ✨ ความเห็นด้านเทคนิคและวิธีซ่อมบำรุงด้วย AI
                              </span>
                              {!aiAdviceResult[iss.id] && (
                                <button
                                  onClick={() => handleAiMaintenanceAdvice(iss)}
                                  disabled={isAiAdvising}
                                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-1 px-2.5 rounded-md text-[10px] transition-colors disabled:opacity-50"
                                >
                                  {isAiAdvising ? "กำลังวิเคราะห์..." : "วิเคราะห์ปัญหา"}
                                </button>
                              )}
                            </div>
                            
                            {aiAdviceResult[iss.id] ? (
                              <p className="text-[11px] text-slate-700 bg-white p-2 rounded-lg border border-indigo-50 font-sans leading-relaxed whitespace-pre-wrap">
                                {aiAdviceResult[iss.id]}
                              </p>
                            ) : (
                              <p className="text-[10px] text-indigo-500 italic">กดปุ่มด้านบนเพื่อให้ AI ช่วยวิเคราะห์อะไหล่, วิธีการแก้ไข และช่างเทคนิคที่ต้องใช้</p>
                            )}
                          </div>

                          {iss.notes && (
                            <div className="text-xs text-slate-600 bg-emerald-50/50 border border-emerald-100 p-2.5 rounded-xl">
                              <span className="font-bold text-emerald-800 flex items-center gap-1">
                                <MessageSquare className="h-3.5 w-3.5" /> บันทึกการแก้ไข:
                              </span>
                              <p className="mt-0.5 italic">{iss.notes}</p>
                            </div>
                          )}
                        </div>

                        <div className="mt-4 pt-3 border-t border-dashed border-slate-100 flex justify-between items-center text-[11px] text-slate-400">
                          <div>
                            <p>ผู้แจ้ง: <strong>{iss.reportedBy}</strong></p>
                            <p className="text-[10px] text-slate-400">เมื่อ: {iss.reportedAt}</p>
                          </div>
                          
                          <div className="flex items-center gap-1.5">
                            <button 
                              onClick={() => handleOpenIssueDetail(iss)}
                              className="px-3 py-1.5 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 rounded-lg text-slate-600 font-semibold transition-colors flex items-center gap-1"
                            >
                              <Edit3 className="h-3.5 w-3.5" /> อัปเดตสถานะ
                            </button>
                            <button 
                              onClick={() => handleDeleteIssue(iss.id)}
                              className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg transition-colors"
                              title="ลบเคส"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* 5. SETTINGS TAB */}
          {activeTab === 'settings' && (
            <div className="space-y-6">
              
              {/* Google Sheets Connection Block */}
              <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                <h3 className="font-bold text-slate-800 text-lg mb-4 flex items-center gap-2">
                  <Database className="h-5 w-5 text-indigo-500" /> ตั้งค่าการเชื่อมต่อ Google Sheets & Vercel
                </h3>
                
                <form onSubmit={handleSaveSettings} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-2 uppercase">Google Sheets Apps Script Web App URL</label>
                    <div className="flex flex-col sm:flex-row gap-3">
                      <input 
                        type="url" 
                        value={sheetUrl}
                        onChange={(e) => setSheetUrl(e.target.value)}
                        placeholder="https://script.google.com/macros/s/.../exec"
                        className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-indigo-500 font-mono"
                      />
                      <button 
                        type="submit"
                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 px-6 rounded-xl text-sm transition-colors flex items-center gap-2 justify-center"
                      >
                        <Save className="h-4 w-4" /> บันทึกที่อยู่ URL
                      </button>
                    </div>
                    <p className="text-xs text-slate-400 mt-1.5">
                      * ข้อมูลในระบบทั้งหมดจะเซฟที่ LocalStorage บนเว็บนี้อยู่เสมอ แม้จะไม่เชื่อมต่อ Google Sheets ก็ตาม
                    </p>
                  </div>
                </form>

                <div className="mt-6 pt-6 border-t border-slate-100 flex flex-wrap gap-3">
                  <button 
                    onClick={handleTestConnection}
                    disabled={isConnecting}
                    className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 font-semibold py-2 px-4 rounded-xl text-sm transition-colors flex items-center gap-2"
                  >
                    {isConnecting ? (
                      <span className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></span>
                    ) : (
                      <Check className="h-4 w-4" />
                    )}
                    ทดสอบส่งสัญญาณเชื่อมต่อ
                  </button>
                </div>
              </div>

              {/* Developer Logs Console */}
              <div className="bg-slate-900 text-slate-300 p-6 rounded-2xl shadow-inner font-mono text-xs">
                <div className="flex justify-between items-center mb-4 border-b border-slate-800 pb-3">
                  <span className="font-bold text-slate-400 flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> API & Event Console Logs
                  </span>
                  <button 
                    onClick={() => setApiLogs([])}
                    className="text-[10px] text-slate-500 hover:text-slate-300 underline"
                  >
                    ล้างประวัติ
                  </button>
                </div>
                
                <div className="space-y-1.5 max-h-[180px] overflow-y-auto">
                  {apiLogs.length === 0 ? (
                    <p className="text-slate-500 italic">ไม่มีกิจกรรมใดๆ เกิดขึ้นในขณะนี้</p>
                  ) : (
                    apiLogs.map((log, index) => (
                      <div key={index} className="flex gap-2">
                        <span className="text-slate-500">[{log.time}]</span>
                        <span className={`
                          ${log.type === 'error' ? 'text-rose-400 font-bold' : ''}
                          ${log.type === 'success' ? 'text-emerald-400' : ''}
                          ${log.type === 'warning' ? 'text-amber-400' : ''}
                          ${log.type === 'info' ? 'text-sky-400' : ''}
                        `}>
                          {log.message}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Deployment & Setup Guide */}
              <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
                <h4 className="font-bold text-slate-800 text-base">คู่มือการเชื่อมต่อ Google Sheets & Vercel</h4>
                
                <div className="space-y-3 text-sm text-slate-600">
                  <div className="flex items-start gap-3">
                    <span className="flex items-center justify-center bg-indigo-50 text-indigo-600 font-bold w-6 h-6 rounded-full text-xs shrink-0 mt-0.5">1</span>
                    <div>
                      <strong className="text-slate-800">สร้าง Google Sheet:</strong>
                      <p className="text-xs text-slate-500 mt-0.5">สร้าง Google Sheet ใหม่ แล้วไปที่เมนู <strong className="text-slate-700">ส่วนขยาย (Extensions) {`->`} Apps Script</strong></p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <span className="flex items-center justify-center bg-indigo-50 text-indigo-600 font-bold w-6 h-6 rounded-full text-xs shrink-0 mt-0.5">2</span>
                    <div>
                      <strong className="text-slate-800">ใส่โค้ด Google Apps Script:</strong>
                      <p className="text-xs text-slate-500 mt-0.5">คัดลอกโค้ดด้านล่างนี้ไปวางในหน้า Apps Script (เพื่อรองรับการบันทึกคอลัมน์ "ผู้บันทึก/ผู้ทำรายการ" ด้วย):</p>
                      <pre className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-[11px] font-mono mt-2 overflow-x-auto whitespace-pre">
{`function doPost(e) {
  var requestData = JSON.parse(e.postData.contents);
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  
  if (requestData.action === 'test_connection') {
    return ContentService.createTextOutput("Connection Success!");
  }
  
  if (requestData.action === 'update_room') {
    var data = requestData.data;
    var recorder = requestData.recorder || 'ไม่ระบุ';
    sheet.appendRow([
      new Date(),
      data.number,
      data.status,
      data.tenantName,
      data.phone,
      data.rentPrice,
      data.currWater,
      data.currElectricity,
      data.renovationNotes || '',
      data.expectedFinishDate || '',
      recorder
    ]);
    return ContentService.createTextOutput("Room updated by " + recorder);
  }

  if (requestData.action === 'add_issue' || requestData.action === 'update_issue') {
    var data = requestData.data;
    var recorder = requestData.recorder || 'ไม่ระบุ';
    var issueSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Issues") || sheet;
    issueSheet.appendRow([
      new Date(),
      "แจ้งซ่อม",
      data.title,
      data.category,
      data.roomNumber || 'ส่วนกลาง',
      data.location,
      data.urgency,
      data.status,
      data.notes,
      recorder
    ]);
    return ContentService.createTextOutput("Issue sync completed by " + recorder);
  }
}`}
                      </pre>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <span className="flex items-center justify-center bg-indigo-50 text-indigo-600 font-bold w-6 h-6 rounded-full text-xs shrink-0 mt-0.5">3</span>
                    <div>
                      <strong className="text-slate-800">ทำการ Deploy ใน Apps Script:</strong>
                      <p className="text-xs text-slate-500 mt-0.5">กดปุ่ม <strong className="text-slate-700">การใช้งานได้จริง (Deploy) {`->`} การใช้งานรายการใหม่ (New Deployment)</strong> เลือกประเภทเป็น <strong className="text-slate-700">เว็บแอป (Web App)</strong> ตั้งค่า "ผู้มีสิทธิ์เข้าถึง" ให้เป็น <strong className="text-slate-700">ทุกคน (Anyone)</strong> จากนั้นคัดลอก Web App URL มากรอกด้านบนนี้</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <span className="flex items-center justify-center bg-indigo-50 text-indigo-600 font-bold w-6 h-6 rounded-full text-xs shrink-0 mt-0.5">4</span>
                    <div>
                      <strong className="text-slate-800">การ Deploy ขึ้น Vercel:</strong>
                      <p className="text-xs text-slate-500 mt-0.5">อัปโหลดแอปพลิเคชัน Single-file นี้ขึ้น GitHub จากนั้นกดเชื่อมต่อโปรเจ็กต์บนหน้าแดชบอร์ด Vercel แพลตฟอร์มจะ Deploy เป็นเว็บไซต์ใช้งานได้ทันที ภายใน 1 นาที!</p>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          )}

        </main>
      </div>

      {/* --- MODAL DIALOG: EDIT ROOM DETAILS / ENTER UTILITIES --- */}
      {isEditingRoom && editFormData && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex justify-center items-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden border border-slate-100 transform transition-all">
            
            {/* Modal Header */}
            <div className="bg-indigo-900 text-white p-6 flex justify-between items-center">
              <div>
                <h3 className="text-lg font-bold">บันทึกข้อมูลมิเตอร์ & จัดการห้อง {editFormData.id}</h3>
                <p className="text-xs text-indigo-200">แก้ไขข้อมูลสถานะ, ผู้เช่า และมิเตอร์น้ำไฟรายเดือน</p>
              </div>
              <button 
                onClick={() => { setIsEditingRoom(false); setSelectedRoom(null); }}
                className="p-1.5 hover:bg-indigo-800 rounded-lg text-indigo-200 transition-colors"
              >
                <XCircle className="h-6 w-6" />
              </button>
            </div>

            {/* Modal Body / Form */}
            <form onSubmit={handleSaveRoom} className="p-6 space-y-4">
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">สถานะห้องพัก</label>
                  <select 
                    value={editFormData.status}
                    onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value })}
                    className="w-full p-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:border-indigo-500"
                  >
                    <option value="ว่าง">ว่างพร้อมเช่า</option>
                    <option value="มีผู้เช่า">มีผู้เช่า</option>
                    <option value="จองแล้ว">จองแล้ว</option>
                    <option value="ปรับปรุง">ปรับปรุง / ชำรุด</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">ค่าเช่าหลัก (บาท)</label>
                  <input 
                    type="number" 
                    value={editFormData.rentPrice}
                    onChange={(e) => setEditFormData({ ...editFormData, rentPrice: Number(e.target.value) })}
                    className="w-full p-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:border-indigo-500"
                    required
                  />
                </div>
              </div>

              {editFormData.status === 'มีผู้เช่า' && (
                <div className="grid grid-cols-2 gap-4 bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                  <div className="col-span-2 text-xs font-bold text-slate-500 uppercase tracking-wide">ข้อมูลผู้เช่า</div>
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">ชื่อผู้เช่า</label>
                    <input 
                      type="text" 
                      value={editFormData.tenantName}
                      onChange={(e) => setEditFormData({ ...editFormData, tenantName: e.target.value })}
                      placeholder="สมชาย แสนสุข"
                      className="w-full p-2 bg-white rounded-lg border border-slate-200 text-sm focus:outline-none focus:border-indigo-500"
                      required={editFormData.status === 'มีผู้เช่า'}
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">เบอร์โทรศัพท์</label>
                    <input 
                      type="text" 
                      value={editFormData.phone}
                      onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                      placeholder="081-xxxxxxx"
                      className="w-full p-2 bg-white rounded-lg border border-slate-200 text-sm focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>
              )}

              {editFormData.status === 'ปรับปรุง' && (
                <div className="grid grid-cols-1 gap-4 bg-amber-50 p-3.5 rounded-xl border border-amber-200">
                  <div className="text-xs font-bold text-amber-800 uppercase tracking-wide flex items-center gap-1">
                    <Wrench className="h-4 w-4" /> รายละเอียดการปรับปรุง/ซ่อมบำรุงห้องพัก
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">รายละเอียดการปรับปรุง (เช่น ทาสีใหม่, เปลี่ยนแอร์, ซ่อมห้องน้ำ)</label>
                    <textarea
                      rows="2"
                      value={editFormData.renovationNotes}
                      onChange={(e) => setEditFormData({ ...editFormData, renovationNotes: e.target.value })}
                      placeholder="ระบุสิ่งที่ต้องการปรับปรุง..."
                      className="w-full p-2 bg-white rounded-lg border border-slate-200 text-sm focus:outline-none focus:border-amber-500"
                    ></textarea>
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">คาดว่าจะเสร็จสิ้นวันที่</label>
                    <input
                      type="date"
                      value={editFormData.expectedFinishDate}
                      onChange={(e) => setEditFormData({ ...editFormData, expectedFinishDate: e.target.value })}
                      className="w-full p-2 bg-white rounded-lg border border-slate-200 text-sm focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>
              )}

              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2">
                <div className="flex justify-between items-center text-xs font-bold text-slate-600 uppercase tracking-wide">
                  <span className="flex items-center gap-1"><AlertTriangle className="h-4 w-4 text-slate-500" /> ประวัติการแจ้งซ่อมของห้องนี้</span>
                  <button
                    type="button"
                    onClick={() => {
                      setNewIssueData({
                        title: `แจ้งซ่อม ห้อง ${editFormData.id}`,
                        category: 'ไฟฟ้า',
                        roomNumber: editFormData.id,
                        location: 'ระบุตำแหน่งภายในห้อง...',
                        description: '',
                        urgency: 'ปกติ',
                        status: 'รอดำเนินการ'
                      });
                      setIsEditingRoom(false);
                      setIsAddingIssue(true);
                    }}
                    className="text-xs text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-0.5"
                  >
                    <Plus className="h-3 w-3" /> แจ้งซ่อมห้องนี้
                  </button>
                </div>
                
                <div className="max-h-[120px] overflow-y-auto space-y-1.5 pr-1">
                  {issues.filter(i => i.roomNumber === editFormData.id).length === 0 ? (
                    <p className="text-[11px] text-slate-400 italic py-1 text-center">ไม่มีรายการแจ้งซ่อมของห้องนี้</p>
                  ) : (
                    issues.filter(i => i.roomNumber === editFormData.id).map(iss => (
                      <div key={iss.id} className="text-xs p-2 bg-white rounded-lg border border-slate-100 flex justify-between items-start">
                        <div>
                          <p className="font-semibold text-slate-700">{iss.title}</p>
                          <p className="text-[10px] text-slate-400">สถานะ: <span className="font-medium text-slate-600">{iss.status}</span> ({iss.reportedAt})</p>
                        </div>
                        <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${
                          iss.status === 'เสร็จสิ้น' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {iss.status}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Utility Meters */}
              <div className="space-y-3">
                <div className="text-xs font-bold text-slate-500 uppercase tracking-wide">การบันทึกจดมิเตอร์ ค่าน้ำ/ค่าไฟ</div>
                
                {/* Water Meter */}
                <div className="grid grid-cols-2 gap-4 bg-blue-50/50 p-3.5 rounded-xl border border-blue-100">
                  <div className="col-span-2 flex justify-between items-center text-xs font-semibold text-blue-800">
                    <span className="flex items-center gap-1"><Droplet className="h-4 w-4" /> ระบบน้ำประปา</span>
                    <span>อัตรา ฿{waterUnitCost}/หน่วย</span>
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">เลขจดครั้งก่อน</label>
                    <input 
                      type="number" 
                      value={editFormData.prevWater}
                      onChange={(e) => setEditFormData({ ...editFormData, prevWater: Number(e.target.value) })}
                      className="w-full p-2 bg-white rounded-lg border border-slate-200 text-sm focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">เลขจดครั้งใหม่</label>
                    <input 
                      type="number" 
                      value={editFormData.currWater}
                      onChange={(e) => setEditFormData({ ...editFormData, currWater: Number(e.target.value) })}
                      className="w-full p-2 bg-white rounded-lg border border-slate-200 text-sm focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div className="col-span-2 text-right text-xs text-blue-600 font-semibold">
                    ใช้ไป {Math.max(0, editFormData.currWater - editFormData.prevWater)} หน่วย (คิดเงินประมาณ ฿{Math.max(0, editFormData.currWater - editFormData.prevWater) * waterUnitCost})
                  </div>
                </div>

                {/* Elec Meter */}
                <div className="grid grid-cols-2 gap-4 bg-amber-50/50 p-3.5 rounded-xl border border-amber-100">
                  <div className="col-span-2 flex justify-between items-center text-xs font-semibold text-amber-800">
                    <span className="flex items-center gap-1"><Zap className="h-4 w-4" /> ระบบไฟฟ้า</span>
                    <span>อัตรา ฿{elecUnitCost}/หน่วย</span>
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">เลขจดครั้งก่อน</label>
                    <input 
                      type="number" 
                      value={editFormData.prevElectricity}
                      onChange={(e) => setEditFormData({ ...editFormData, prevElectricity: Number(e.target.value) })}
                      className="w-full p-2 bg-white rounded-lg border border-slate-200 text-sm focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">เลขจดครั้งใหม่</label>
                    <input 
                      type="number" 
                      value={editFormData.currElectricity}
                      onChange={(e) => setEditFormData({ ...editFormData, currElectricity: Number(e.target.value) })}
                      className="w-full p-2 bg-white rounded-lg border border-slate-200 text-sm focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <div className="col-span-2 text-right text-xs text-amber-600 font-semibold">
                    ใช้ไป {Math.max(0, editFormData.currElectricity - editFormData.prevElectricity)} หน่วย (คิดเงินประมาณ ฿{Math.max(0, editFormData.currElectricity - editFormData.prevElectricity) * elecUnitCost})
                  </div>
                </div>
              </div>

              {/* Recorder Information Indicator */}
              <div className="text-xs text-indigo-600 bg-indigo-50 p-2 rounded-lg border border-indigo-100 font-medium">
                ทำการบันทึกรายการโดยผู้บันทึกปัจจุบัน: <strong className="text-indigo-800">{recorderName || 'ไม่ระบุชื่อ'}</strong>
              </div>

              {/* Modal Actions */}
              <div className="pt-4 border-t border-slate-100 flex gap-2 justify-end">
                <button 
                  type="button"
                  onClick={() => { setIsEditingRoom(false); setSelectedRoom(null); }}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-sm font-semibold transition-colors"
                >
                  ยกเลิก
                </button>
                <button 
                  type="submit"
                  className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold transition-colors flex items-center gap-2"
                >
                  <Save className="h-4 w-4" /> บันทึกข้อมูลและซิงค์
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* --- MODAL DIALOG: ADD NEW ROOM --- */}
      {isAddingRoom && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex justify-center items-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-slate-100 transform transition-all">
            {/* Modal Header */}
            <div className="bg-indigo-900 text-white p-6 flex justify-between items-center">
              <div>
                <h3 className="text-lg font-bold">เพิ่มห้องพักใหม่</h3>
                <p className="text-xs text-indigo-200">กรอกข้อมูลเพื่อเปิดห้องพักใหม่ในระบบ</p>
              </div>
              <button 
                onClick={() => setIsAddingRoom(false)}
                className="p-1.5 hover:bg-indigo-800 rounded-lg text-indigo-200 transition-colors"
              >
                <XCircle className="h-6 w-6" />
              </button>
            </div>

            {/* Modal Body / Form */}
            <form onSubmit={handleAddRoom} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">หมายเลขห้อง</label>
                <input 
                  type="text" 
                  value={newRoomData.number}
                  onChange={(e) => setNewRoomData({ ...newRoomData, number: e.target.value })}
                  placeholder="เช่น 106, 206"
                  className="w-full p-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:border-indigo-500 font-mono"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">ชั้นที่</label>
                  <input 
                    type="number" 
                    value={newRoomData.floor}
                    onChange={(e) => setNewRoomData({ ...newRoomData, floor: Number(e.target.value) })}
                    min="1"
                    className="w-full p-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:border-indigo-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">ค่าเช่าหลัก (บาท)</label>
                  <input 
                    type="number" 
                    value={newRoomData.rentPrice}
                    onChange={(e) => setNewRoomData({ ...newRoomData, rentPrice: Number(e.target.value) })}
                    min="0"
                    className="w-full p-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:border-indigo-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">สถานะเริ่มต้น</label>
                <select 
                  value={newRoomData.status}
                  onChange={(e) => setNewRoomData({ ...newRoomData, status: e.target.value })}
                  className="w-full p-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:border-indigo-500"
                >
                  <option value="ว่าง">ว่างพร้อมเช่า</option>
                  <option value="จองแล้ว">จองแล้ว</option>
                  <option value="ปรับปรุง">ปรับปรุง / ชำรุด</option>
                </select>
              </div>

              {/* Recorder Information Indicator */}
              <div className="text-xs text-indigo-600 bg-indigo-50 p-2 rounded-lg border border-indigo-100 font-medium">
                ดำเนินการเพิ่มโดยผู้บันทึกปัจจุบัน: <strong className="text-indigo-800">{recorderName || 'ไม่ระบุชื่อ'}</strong>
              </div>

              {/* Modal Actions */}
              <div className="pt-4 border-t border-slate-100 flex gap-2 justify-end">
                <button 
                  type="button"
                  onClick={() => setIsAddingRoom(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-sm font-semibold transition-colors"
                >
                  ยกเลิก
                </button>
                <button 
                  type="submit"
                  className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold transition-colors flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" /> ยืนยันเพิ่มห้อง
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL DIALOG: DELETE CONFIRMATION --- */}
      {roomToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex justify-center items-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden border border-slate-100 transform transition-all">
            <div className="p-6 text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
                <Trash2 className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-800">ยืนยันการลบห้องพัก?</h3>
                <p className="text-xs text-slate-500 mt-1">
                  คุณกำลังจะลบ <strong className="text-slate-700">ห้อง {roomToDelete.number}</strong> ออกจากระบบ ข้อมูลผู้เช่า บิล และมิเตอร์ของห้องนี้จะสูญหายอย่างถาวร
                </p>
                {roomToDelete.status === 'มีผู้เช่า' && (
                  <p className="text-xs text-rose-500 font-bold mt-2 bg-rose-50 p-2 rounded border border-rose-100">
                    คำเตือน: ห้องนี้ยังมีผู้เช่าอยู่ ({roomToDelete.tenantName})
                  </p>
                )}
                <div className="text-xs text-indigo-600 bg-indigo-50 p-1.5 rounded border border-indigo-100 mt-2 font-medium">
                  ดำเนินการลบโดย: <strong className="text-indigo-800">{recorderName}</strong>
                </div>
              </div>
              <div className="flex gap-2 justify-center">
                <button 
                  type="button"
                  onClick={() => setRoomToDelete(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-sm font-semibold transition-colors flex-1"
                >
                  ยกเลิก
                </button>
                <button 
                  type="button"
                  onClick={() => handleDeleteRoom(roomToDelete.id)}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-sm font-semibold transition-colors flex-1"
                >
                  ยืนยันลบห้อง
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL DIALOG: ADD NEW ISSUE --- */}
      {isAddingIssue && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex justify-center items-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-slate-100 transform transition-all">
            <div className="bg-indigo-900 text-white p-6 flex justify-between items-center">
              <div>
                <h3 className="text-lg font-bold">แจ้งปัญหา/ความชำรุด</h3>
                <p className="text-xs text-indigo-200">กรอกข้อมูลปัญหาส่วนกลางและพื้นที่ต่าง ๆ ในหอพัก</p>
              </div>
              <button 
                onClick={() => setIsAddingIssue(false)}
                className="p-1.5 hover:bg-indigo-800 rounded-lg text-indigo-200 transition-colors"
              >
                <XCircle className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleAddIssue} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">หัวข้อปัญหา / อาการที่พบ</label>
                <input 
                  type="text" 
                  value={newIssueData.title}
                  onChange={(e) => setNewIssueData({ ...newIssueData, title: e.target.value })}
                  placeholder="เช่น ประตูด้านหน้าตึกปิดไม่สนิท, ท่อน้ำล้น"
                  className="w-full p-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">หมวดหมู่</label>
                  <select 
                    value={newIssueData.category}
                    onChange={(e) => setNewIssueData({ ...newIssueData, category: e.target.value })}
                    className="w-full p-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:border-indigo-500"
                  >
                    <option value="ไฟฟ้า">ไฟฟ้า / แสงสว่าง</option>
                    <option value="ประปา">ประปา / น้ำรั่ว</option>
                    <option value="โครงสร้าง">โครงสร้าง / ตัวอาคาร</option>
                    <option value="ความสะอาด">ความสะอาด / ขยะ</option>
                    <option value="อื่นๆ">อื่นๆ</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">ระดับความเร่งด่วน</label>
                  <select 
                    value={newIssueData.urgency}
                    onChange={(e) => setNewIssueData({ ...newIssueData, urgency: e.target.value })}
                    className="w-full p-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:border-indigo-500"
                  >
                    <option value="ปกติ">ปกติ</option>
                    <option value="ด่วน">ด่วน</option>
                    <option value="ด่วนที่สุด">ด่วนที่สุด 🚨</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">สถานที่แจ้งซ่อม</label>
                  <select 
                    value={newIssueData.roomNumber}
                    onChange={(e) => setNewIssueData({ ...newIssueData, roomNumber: e.target.value })}
                    className="w-full p-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:border-indigo-500 font-semibold"
                  >
                    <option value="ส่วนกลาง">🏢 พื้นที่ส่วนกลาง</option>
                    {rooms.map(r => (
                      <option key={r.id} value={r.number}>🚪 ห้อง {r.number}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">
                    {newIssueData.roomNumber === 'ส่วนกลาง' ? 'ระบุตำแหน่งส่วนกลาง' : 'ระบุตำแหน่งในห้อง'}
                  </label>
                  <input 
                    type="text" 
                    value={newIssueData.location}
                    onChange={(e) => setNewIssueData({ ...newIssueData, location: e.target.value })}
                    placeholder={newIssueData.roomNumber === 'ส่วนกลาง' ? "เช่น หน้าลิฟต์ชั้น 3, ลานจอดรถ" : "เช่น ซิงค์ล้างจาน, ในห้องน้ำ"}
                    className="w-full p-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:border-indigo-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">รายละเอียดความเสียหายเพิ่มเติม</label>
                <textarea 
                  rows="3"
                  value={newIssueData.description}
                  onChange={(e) => setNewIssueData({ ...newIssueData, description: e.target.value })}
                  placeholder="ระบุรายละเอียด เช่น ไฟสั่นตลอดเวลาและเพิ่งดับลงเมื่อคืน หรือมีอาการน้ำซึมออกมากระทบการเดินผ่าน"
                  className="w-full p-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:border-indigo-500"
                  required
                ></textarea>
              </div>

              <div className="text-xs text-indigo-600 bg-indigo-50 p-2.5 rounded-lg border border-indigo-100 font-medium">
                ลงบันทึกในชื่อผู้รายงาน: <strong className="text-indigo-800">{recorderName || 'ไม่ระบุชื่อ'}</strong>
              </div>

              <div className="pt-4 border-t border-slate-100 flex gap-2 justify-end">
                <button 
                  type="button"
                  onClick={() => setIsAddingIssue(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-sm font-semibold transition-colors"
                >
                  ยกเลิก
                </button>
                <button 
                  type="submit"
                  className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold transition-colors flex items-center gap-2"
                >
                  <Save className="h-4 w-4" /> ส่งบันทึกรายงาน
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL DIALOG: UPDATE ISSUE STATUS & NOTES --- */}
      {selectedIssue && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex justify-center items-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-slate-100 transform transition-all">
            <div className="bg-indigo-900 text-white p-6 flex justify-between items-center">
              <div>
                <h3 className="text-lg font-bold">อัปเดตสถานะงานซ่อม</h3>
                <p className="text-xs text-indigo-200">ปรับปรุงความคืบหน้าของปัญหาการแจ้งซ่อม</p>
              </div>
              <button 
                onClick={() => setSelectedIssue(null)}
                className="p-1.5 hover:bg-indigo-800 rounded-lg text-indigo-200 transition-colors"
              >
                <XCircle className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleUpdateIssueStatus} className="p-6 space-y-4">
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs space-y-1">
                <p className="font-bold text-slate-700">{selectedIssue.title}</p>
                <p className="text-slate-500">สถานที่: {selectedIssue.location}</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">เปลี่ยนสถานะงาน</label>
                <select 
                  value={issueStatusUpdate}
                  onChange={(e) => setIssueStatusUpdate(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:border-indigo-500 font-semibold"
                >
                  <option value="รอดำเนินการ">🔴 รอดำเนินการ</option>
                  <option value="กำลังตรวจสอบ">🟡 กำลังตรวจสอบ</option>
                  <option value="กำลังซ่อม">🔵 กำลังซ่อม</option>
                  <option value="เสร็จสิ้น">🟢 เสร็จสิ้น</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">บันทึกข้อความความคืบหน้า / รายละเอียดจากช่าง</label>
                <textarea 
                  rows="3"
                  value={issueNotes}
                  onChange={(e) => setIssueNotes(e.target.value)}
                  placeholder="เช่น ช่างแจ้งเปลี่ยนหลอดไฟ LED ขนาด 18W เรียบร้อย หรือ ช่างจะเข้ามาในวันพรุ่งนี้เวลา 10 โมง"
                  className="w-full p-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:border-indigo-500"
                ></textarea>
              </div>

              <div className="text-xs text-indigo-600 bg-indigo-50 p-2 rounded-lg border border-indigo-100 font-medium">
                ผู้ทำการปรับปรุงสถานะล่าสุด: <strong className="text-indigo-800">{recorderName || 'ไม่ระบุชื่อ'}</strong>
              </div>

              <div className="pt-4 border-t border-slate-100 flex gap-2 justify-end">
                <button 
                  type="button"
                  onClick={() => setSelectedIssue(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-sm font-semibold transition-colors"
                >
                  ยกเลิก
                </button>
                <button 
                  type="submit"
                  className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold transition-colors flex items-center gap-2"
                >
                  <Save className="h-4 w-4" /> บันทึกการอัปเดต
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- Footer --- */}
      <footer className="bg-slate-900 text-slate-400 py-6 px-6 text-center text-xs border-t border-slate-800 space-y-1">
        <p>© 2026 DormManager - ระบบอำนวยความสะดวกสำหรับผู้จัดการหอพัก</p>
        <p className="text-slate-600">ออกแบบมาเพื่อรองรับ 20 ห้อง พร้อมระบบซิงค์ข้อมูลลง Google Sheets และรองรับการ Deploy ลง Vercel แบบสแตนด์อโลน</p>
      </footer>

    </div>
  );
}