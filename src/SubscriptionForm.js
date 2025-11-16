import React, { useState } from 'react';

// URL ปลายทางของ Google Apps Script (จากไฟล์ soul_navigator_form_4.html)
const GOOGLE_SHEET_WEB_APP_URL = "https://script.google.com/macros/s/AKfycbyXahH4r-r2NIluSTP8PCi0oydMUpJS4NH9wJVpJ2nueWjEyT_1gIwWlZyhutnE5-Tdzg/exec";

function SubscriptionForm({ onSubscriptionSuccess }) {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    birthDate: '',
    birthTime: '',
    birthPlace: '',
    referralCode: ''
  });
  const [hour, setHour] = useState('');
  const [minute, setMinute] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setIsError(false);

    const finalFormData = {
      ...formData,
      birthTime: `${hour}:${minute}`
    };

    try {
      await fetch(GOOGLE_SHEET_WEB_APP_URL, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams(finalFormData).toString(),
      });
      setIsLoading(false);
      if (onSubscriptionSuccess) {
        onSubscriptionSuccess(finalFormData.email);
      }
    } catch (error) {
      console.error("Onboarding Error:", error);
      setIsLoading(false);
      setIsError(true);
    }
  };

  const hourOptions = Array.from({length: 24}, (_, i) => (
    <option key={i} value={String(i).padStart(2, '0')}>
      {String(i).padStart(2, '0')}
    </option>
  ));
  const minuteOptions = Array.from({length: 60}, (_, i) => (
    <option key={i} value={String(i).padStart(2, '0')}>
      {String(i).padStart(2, '0')}
    </option>
  ));

  return (
    <form onSubmit={handleSubmit}>
      <h2>Subscript (เพื่อรับ 17 เครดิต)</h2>
      <p>กรุณากรอกข้อมูลเพื่อสร้าง "แผนที่จิตวิญญาณ" ของคุณ</p>

      <div>
        <label>ชื่อ-สกุล:</label>
        <input type="text" name="fullName" onChange={handleInputChange} required />
      </div>
      <div>
        <label>อีเมล:</label>
        <input type="email" name="email" onChange={handleInputChange} required />
      </div>
      <div>
        <label>วันเกิด:</label>
        <input type="date" name="birthDate" onChange={handleInputChange} required />
      </div>
      <div>
        <label>เวลาเกิด:</label>
        <select onChange={e => setHour(e.target.value)} required value={hour}>
          <option value="">ชั่วโมง</option>
          {hourOptions}
        </select>
        <select onChange={e => setMinute(e.target.value)} required value={minute}>
          <option value="">นาที</option>
          {minuteOptions}
        </select>
      </div>
      <div>
        <label>สถานที่เกิด:</label>
        <input type="text" name="birthPlace" onChange={handleInputChange} required />
      </div>
      <div>
        <label>โค้ดชวนเพื่อน (ถ้ามี):</label>
        <input type="text" name="referralCode" onChange={handleInputChange} />
      </div>
      
      <button type="submit" disabled={isLoading}>
        {isLoading ? 'กำลังสร้างแผนที่...' : 'ยืนยันและรับ 17 เครดิต'}
      </button>

      {isError && <p style={{color: 'red'}}>เกิดข้อผิดพลาด!</p>}
    </form>
  );
}

export default SubscriptionForm;