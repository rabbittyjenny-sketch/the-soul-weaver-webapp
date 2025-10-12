import React, { useState } from 'react';
import ZodiacBirthdayPicker from './ZodiacBirthdayPicker';

const APPSCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxg9HsZYr_GJEw9Hu89NjezsAVsRq7QJu_HfQbCQLYAENIHX7uGzJCEX17Ue8AQJm2WJA/exec';
const zodiacList = [
  'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
  'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'
];

// ฟังก์ชันสำหรับส่งข้อมูลไป Google Apps Script Web App (ต้องอยู่ก่อนการใช้งาน)
async function submitToGoogleSheet(formData) {
  try {
    await fetch(APPSCRIPT_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(formData),
    });
    alert('ส่งข้อมูลสำเร็จ!');
  } catch (error) {
    alert('เกิดข้อผิดพลาดในการส่งข้อมูล');
  }
}

export default function OnboardingWizard({ onComplete }) {
  // Step: 0=email, 1=zodiac, 2=birthday, 3=time/place, 4=summary
  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [consent, setConsent] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [zodiac, setZodiac] = useState(null);
  const [birthday, setBirthday] = useState(null);
  const [birthTime, setBirthTime] = useState('');
  const [birthPlace, setBirthPlace] = useState('');

  // ตรวจสอบอีเมลซ้ำจาก Google Sheets (Apps Script)
  const checkEmailExists = async (email) => {
    try {
      const res = await fetch(APPSCRIPT_URL + `?action=checkEmail&email=${encodeURIComponent(email)}`);
      if (!res.ok) return null;
      const data = await res.json();
      // data = { exists: boolean, userData: {...} }
      if (data.exists) return data.userData;
      return null;
    } catch {
      return null;
    }
  // (อย่าใส่ }; ตรงนี้)

  // ฟังก์ชันสำหรับส่งข้อมูลไป Google Apps Script Web App
  async function submitToGoogleSheet(formData) {
    try {
      await fetch(APPSCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      alert('ส่งข้อมูลสำเร็จ!');
    } catch (error) {
      alert('เกิดข้อผิดพลาดในการส่งข้อมูล');
    }
  }
  };

  // Step 0: Email + Consent
  if (step === 0) {
    return (
      <div>
        <h2>สมัครรับข่าวสารและเริ่มใช้งาน</h2>
        <div>
          <label htmlFor="userName">ชื่อของคุณ</label>
          <input
            id="userName"
            name="userName"
            type="text"
            placeholder="ชื่อของคุณ"
            value={name}
            onChange={e => setName(e.target.value)}
            required
            autoComplete="name"
          />
        </div>
        <div>
          <label htmlFor="userEmail">Your Email</label>
          <input
            id="userEmail"
            name="userEmail"
            type="email"
            placeholder="Your Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
        </div>
        <div>
          <label htmlFor="consentCheckbox">
            <input
              id="consentCheckbox"
              name="consentCheckbox"
              type="checkbox"
              checked={consent}
              onChange={e => setConsent(e.target.checked)}
              required
            />
            ยอมรับข้อกำหนดและนโยบายความเป็นส่วนตัว
          </label>
        </div>
        {emailError && <div style={{color:'red'}}>{emailError}</div>}
        <button
          disabled={!name || !email || !consent}
          onClick={async () => {
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
              setEmailError('กรุณากรอกอีเมลให้ถูกต้อง');
              return;
            }
            setEmailError('');
            const exists = await checkEmailExists(email);
            if (exists) {
              // ถ้าอีเมลซ้ำ ให้เติม field ที่ขาดให้ครบ
              const safeUserData = {
                name: exists.name || name,
                dob: exists.dob || exists.birthday || '',
                zodiac: exists.zodiac || '',
                birthTime: exists.birthTime || '',
                birthPlace: exists.birthPlace || '',
                email: exists.email || email,
                _repeat: true
              };
              console.log('[OnboardingWizard] Email exists, using userData:', safeUserData);
              onComplete(safeUserData);
              return;
            }
            setStep(1);
          }}
        >ถัดไป</button>
      </div>
    );
  }

  // Step 1: Zodiac
  if (step === 1) {
    return (
      <div>
        <h2>เลือกราศีเกิดของคุณ</h2>
        <div style={{display:'flex',flexWrap:'wrap',gap:8}}>
          {zodiacList.map(z => (
            <button
              key={z}
              style={{padding:12, border:zodiac===z?'2px solid #a0f':'1px solid #ccc', borderRadius:8}}
              onClick={() => { setZodiac(z); setStep(2); }}
            >{z}</button>
          ))}
        </div>
      </div>
    );
  }

  // Step 2: Birthday (day/month/year)
  if (step === 2 && zodiac) {
    return (
      <div>
        <h2>เลือกวัน/เดือน/ปีเกิด</h2>
        <ZodiacBirthdayPicker
          zodiac={zodiac}
          onSelect={date => { setBirthday(date); setStep(3); }}
        />
      </div>
    );
  }

  // Step 3: Time/place
  if (step === 3) {
    return (
      <div>
        <h2>กรอกเวลาและสถานที่เกิด</h2>
        <input
          type="text"
          placeholder="เวลาเกิด (เช่น 14:30)"
          value={birthTime}
          onChange={e => setBirthTime(e.target.value)}
          required
        />
        <input
          type="text"
          placeholder="สถานที่เกิด (เช่น จังหวัด/ประเทศ)"
          value={birthPlace}
          onChange={e => setBirthPlace(e.target.value)}
          required
        />
        <button
          disabled={!birthTime || !birthPlace}
          onClick={() => setStep(4)}
        >ถัดไป</button>
      </div>
    );
  }

  // Step 4: Summary & Submit
  if (step === 4) {
    return (
      <div>
        <h2>ยืนยันข้อมูล</h2>
  <div>ชื่อ: {name}</div>
  <div>อีเมล: {email}</div>
  <div>ราศี: {zodiac}</div>
  <div>วันเกิด: {birthday ? `${birthday.day}/${birthday.month}/${birthday.year}` : ''}</div>
  <div>เวลาเกิด: {birthTime}</div>
  <div>สถานที่เกิด: {birthPlace}</div>
        <button
          onClick={async () => {
            const userData = {
              name,
              dob: birthday ? `${birthday.year}-${String(birthday.month).padStart(2, '0')}-${String(birthday.day).padStart(2, '0')}` : '',
              zodiac,
              birthTime,
              birthPlace,
              email
            };
            // ตรวจสอบข้อมูลก่อนส่ง
            if (!userData.name || !userData.dob || !userData.zodiac || !userData.email) {
              alert('กรุณากรอกข้อมูลให้ครบถ้วน');
              return;
            }
            console.log('[OnboardingWizard] Submitting new userData:', userData);
            await submitToGoogleSheet(userData);
            onComplete(userData);
          }}
        >ส่งข้อมูล</button>
      </div>
    );
  }

  return null;
}

