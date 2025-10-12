/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import * as React from 'react';
import { UserData } from './AstrologyAgent';
import './OnboardingScreen.css';

// ฟังก์ชันสำหรับส่งข้อมูลไป Google Apps Script Web App
async function submitToGoogleSheet(formData: any) {
  const url = 'https://script.google.com/macros/s/AKfycbzqWIf9d5KIeoFFwFTT54gFQ8gOOvlkKERChEzdRlMi6WS1Y1DMaQ4l_-qgcWCRzwex/exec';
  try {
    await fetch(url, {
      method: 'POST',
      mode: 'no-cors',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(formData),
    });
    // ถ้าใช้ mode: 'no-cors' จะไม่ได้ response กลับมา
    alert('ส่งข้อมูลสำเร็จ!');
  } catch (error) {
    alert('เกิดข้อผิดพลาดในการส่งข้อมูล');
  }
}

interface OnboardingScreenProps {
  onComplete: (userData: UserData) => void;
}

/**
 * The initial onboarding screen, rebuilt from scratch.
 * It collects the user's name, email, and date of birth, performs validation,
 * and passes the data to the parent component upon successful submission.
 */
export default function OnboardingScreen({ onComplete }: OnboardingScreenProps) {
  const [formData, setFormData] = React.useState<any>({
    name: '',
    email: '',
    dob: '',
    birthTime: '',
    birthPlace: ''
  });
  const [formErrors, setFormErrors] = React.useState<{ [key: string]: string }>({});
  // เพิ่ม state สำหรับ checkbox ยินยอม
  const [consentChecked, setConsentChecked] = React.useState(false);

  const validateForm = (): boolean => {
    const errors: { [key: string]: string } = {};
    const { email, name, dob, birthTime, birthPlace } = formData;

    // Name validation
    if (!name || name.trim() === '') {
      errors.name = 'Name is required.';
    }

    // Email validation
    if (!email) {
      errors.email = 'Email is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = 'Please enter a valid email address.';
    }

    // Date of Birth validation
    if (!dob) {
      errors.dob = 'Date of Birth is required.';
    } else {
      const birthDate = new Date(dob);
      const today = new Date();
      if (birthDate > today) {
        errors.dob = 'Date of Birth cannot be in the future.';
      }
    }

    // Birth Time validation
    if (!birthTime) {
      errors.birthTime = 'Birth Time is required.';
    }

    // Birth Place validation
    if (!birthPlace || birthPlace.trim() === '') {
      errors.birthPlace = 'Birth Place is required.';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      // ส่งข้อมูลไป Google Sheet
      submitToGoogleSheet(formData);
      console.log('[OnboardingScreen] Submit userData:', formData);
      onComplete(formData as UserData);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear the specific error when user starts typing
    if (formErrors[name]) {
      setFormErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  // ปุ่ม submit จะกดได้เมื่อข้อมูลครบและติ๊กยินยอม
  const isFormIncomplete = !formData.name || !formData.email || !formData.dob || !formData.birthTime || !formData.birthPlace || !consentChecked;

  return (
    <div className="onboarding-screen">
      <div className="onboarding-form-container">
        <h1 className="onboarding-title">Meet SENA, The Soul Weaver</h1>
        <p className="onboarding-subtitle">
          Enter your details to begin a personalized journey through the cosmos and
          uncover the story written in your stars.
        </p>
        <form onSubmit={handleSubmit} noValidate>
          <input
            type="text"
            name="name"
            placeholder="Your Name"
            value={formData.name}
            onChange={handleInputChange}
            required
            aria-invalid={!!formErrors.name}
            aria-describedby="name-error"
          />
          {formErrors.name && <div id="name-error" className="form-error-message">{formErrors.name}</div>}

          <input
            type="email"
            name="email"
            placeholder="Your Email Address"
            value={formData.email}
            onChange={handleInputChange}
            required
            aria-invalid={!!formErrors.email}
            aria-describedby="email-error"
          />
          {formErrors.email && <div id="email-error" className="form-error-message">{formErrors.email}</div>}

          <input
            type="date"
            name="dob"
            placeholder="Date of Birth"
            value={formData.dob}
            onChange={handleInputChange}
            required
            aria-invalid={!!formErrors.dob}
            aria-describedby="dob-error"
          />
          {formErrors.dob && <div id="dob-error" className="form-error-message">{formErrors.dob}</div>}

          <input
            type="text"
            name="birthTime"
            placeholder="Time of Birth (เช่น 14:30)"
            value={formData.birthTime}
            onChange={handleInputChange}
            required
            aria-invalid={!!formErrors.birthTime}
            aria-describedby="birthTime-error"
          />
          {formErrors.birthTime && <div id="birthTime-error" className="form-error-message">{formErrors.birthTime}</div>}

          <input
            type="text"
            name="birthPlace"
            placeholder="Place of Birth"
            value={formData.birthPlace}
            onChange={handleInputChange}
            required
            aria-invalid={!!formErrors.birthPlace}
            aria-describedby="birthPlace-error"
          />
          {formErrors.birthPlace && <div id="birthPlace-error" className="form-error-message">{formErrors.birthPlace}</div>}

          <button type="submit" disabled={isFormIncomplete}>
            ✧ BEGIN YOUR JOURNEY
          </button>
          <div style={{border: '1px solid #ddd', padding: 16, marginTop: 24, background: '#f8f8ff', color: '#222'}}>
            <label style={{display: 'flex', alignItems: 'flex-start', gap: 8}}>
              <input
                type="checkbox"
                checked={consentChecked}
                onChange={e => setConsentChecked(e.target.checked)}
                style={{marginTop: 4}}
                required
              />
              <span>
                ข้าพเจ้ายินยอมให้เก็บรวบรวม ใช้ และเปิดเผยข้อมูลส่วนบุคคล ประกอบด้วย ชื่อ อีเมล วัน เวลา และสถานที่เกิด เพื่อวัตถุประสงค์ในการวิเคราะห์ดวงชะตาและส่งผลการทำนายกลับทางอีเมล ตามนโยบายความเป็นส่วนตัวของเรา<br/>
                <span style={{fontSize: 12, color: '#888'}}>ข้อมูลของคุณจะถูกเก็บรักษาอย่างปลอดภัยและไม่แบ่งปันกับบุคคลที่สาม</span>
              </span>
            </label>
          </div>
  {/* จบฟอร์ม */}
        <div style={{marginTop: 24, fontSize: 14, color: '#888', textAlign: 'center'}}>
          ข้อมูลของคุณได้รับการปกป้องและใช้เฉพาะสำหรับการทำนายเท่านั้น
        </div>
        </form>
      </div>
    </div>
  );
}
