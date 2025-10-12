import React, { useState } from 'react';

// กำหนดช่วงราศี (เดือนเป็นเลข 1-12)
const zodiacPeriods = {
  Aries: { start: { month: 3, day: 21 }, end: { month: 4, day: 19 } },
  Taurus: { start: { month: 4, day: 20 }, end: { month: 5, day: 20 } },
  Gemini: { start: { month: 5, day: 21 }, end: { month: 6, day: 20 } },
  Cancer: { start: { month: 6, day: 21 }, end: { month: 7, day: 22 } },
  Leo: { start: { month: 7, day: 23 }, end: { month: 8, day: 22 } },
  Virgo: { start: { month: 8, day: 23 }, end: { month: 9, day: 22 } },
  Libra: { start: { month: 9, day: 23 }, end: { month: 10, day: 22 } },
  Scorpio: { start: { month: 10, day: 23 }, end: { month: 11, day: 21 } },
  Sagittarius: { start: { month: 11, day: 22 }, end: { month: 12, day: 21 } },
  Capricorn: { start: { month: 12, day: 22 }, end: { month: 1, day: 19 } },
  Aquarius: { start: { month: 1, day: 20 }, end: { month: 2, day: 18 } },
  Pisces: { start: { month: 2, day: 19 }, end: { month: 3, day: 20 } },
};

const monthNames = [
  '', 'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
  'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
];

export default function ZodiacBirthdayPicker({ zodiac, onSelect }) {
  const [selectedMonth, setSelectedMonth] = useState(null);
  const [selectedDay, setSelectedDay] = useState(null);
  const [selectedYear, setSelectedYear] = useState(2000);

  // สร้างตัวเลือกเดือนตามช่วงราศี
  const period = zodiacPeriods[zodiac];
  let availableMonths = [];
  if (period.start.month === period.end.month) {
    availableMonths = [period.start.month];
  } else if (period.start.month < period.end.month) {
    for (let m = period.start.month; m <= period.end.month; m++) availableMonths.push(m);
  } else {
    // สำหรับ Capricorn (ธ.ค. - ม.ค.)
    for (let m = period.start.month; m <= 12; m++) availableMonths.push(m);
    for (let m = 1; m <= period.end.month; m++) availableMonths.push(m);
  }

  // สร้างตัวเลือกวันตามเดือนที่เลือก
  let days = [];
  if (selectedMonth) {
    let startDay = 1;
    let endDay = new Date(selectedYear, selectedMonth, 0).getDate();
    if (selectedMonth === period.start.month) startDay = period.start.day;
    if (selectedMonth === period.end.month) endDay = period.end.day;
    for (let d = startDay; d <= endDay; d++) days.push(d);
  }

  return (
    <div>
      <div>
        <label>เลือกเดือนเกิด:</label>
        <select
          value={selectedMonth ?? ''}
          onChange={e => {
            setSelectedMonth(Number(e.target.value));
            setSelectedDay(null);
          }}
        >
          <option value="">-- เลือกเดือน --</option>
          {availableMonths.map(m => (
            <option key={m} value={m}>{monthNames[m]}</option>
          ))}
        </select>
      </div>
      {selectedMonth && (
        <div>
          <label>เลือกวันเกิด:</label>
          <select
            value={selectedDay ?? ''}
            onChange={e => setSelectedDay(Number(e.target.value))}
          >
            <option value="">-- เลือกวัน --</option>
            {days.map(d => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>
      )}
      <div>
        <label>ปีเกิด (ค.ศ.):</label>
        <input
          type="number"
          value={selectedYear}
          min={1900}
          max={new Date().getFullYear()}
          onChange={e => setSelectedYear(Number(e.target.value))}
        />
      </div>
      <button
        disabled={!selectedMonth || !selectedDay}
        onClick={() => {
          if (selectedMonth && selectedDay) {
            onSelect({ day: selectedDay, month: selectedMonth, year: selectedYear });
          }
        }}
      >
        ยืนยันวันเกิด
      </button>
      <div style={{ marginTop: 8, fontSize: 13, color: '#888' }}>
        *ช่วงวันเดือนเกิดจะถูกจำกัดตามราศีที่เลือก (ศาสตร์ตะวันตก)
      </div>
    </div>
  );
}
