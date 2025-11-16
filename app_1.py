import json
from flask import Flask, request, jsonify
from datetime import datetime
from PyJHora import * # Import all functions from PyJHora

# --- เพิ่ม Library สำหรับการคำนวณสถานที่และเขตเวลา ---
from geopy.geocoders import Nominatim
from timezonefinder import TimezoneFinder
import pytz
# --------------------------------------------------

app = Flask(__name__)

# --- ลบ CITY_DATA ที่จำกัดแค่ 3 เมืองทิ้งไป ---
# CITY_DATA = { ... } (ลบส่วนนี้ทั้งหมด)
# -----------------------------------------

@app.route("/calculate_vedic", methods=["POST"])
def calculate_vedic():
    try:
        birth_data = request.get_json()

        # 1. ดึงข้อมูลดิบ
        name = birth_data.get("Full Name", "N/A")
        email = birth_data.get("Email Address", "N/A")
        birth_date_str = birth_data.get("Birth Date")
        birth_time_str = birth_data.get("Birth Time")
        birth_place_raw = birth_data.get("Birth Place")

        if not all([birth_date_str, birth_time_str, birth_place_raw]):
            return jsonify({"status": "error", "message": "Missing required fields: Birth Date, Birth Time, or Birth Place."}), 400

        # --- 2. การคำนวณ Geocoding และ Timezone (ส่วนที่แก้ไข) ---
        geolocator = Nominatim(user_agent="the_soul_weaver_app")
        tf = TimezoneFinder()

        # ค้นหาสถานที่เกิด
        location = geolocator.geocode(birth_place_raw)
        if not location:
            return jsonify({"status": "error", "message": f"Birth place '{birth_place_raw}' not found."}), 400

        latitude = location.latitude
        longitude = location.longitude

        # ค้นหาชื่อไทม์โซน (เช่น 'Asia/Bangkok')
        timezone_name = tf.timezone_at(lng=longitude, lat=latitude)
        if not timezone_name:
            return jsonify({"status": "error", "message": f"Could not determine timezone for {birth_place_raw}."}), 400

        # --- 3. การจัดการเวลาและเขตเวลา (ส่วนที่แก้ไข) ---
        
        # แปลงสตริงวันที่และเวลาเป็น datetime object แบบ "naive"
        birth_datetime_naive_str = f"{birth_date_str} {birth_time_str}"
        birth_datetime_naive = datetime.strptime(birth_datetime_naive_str, '%Y-%m-%d %H:%M')

        # กำหนดเขตเวลาที่ถูกต้อง
        local_timezone = pytz.timezone(timezone_name)
        
        # ทำให้ datetime object "aware" (รู้เขตเวลา)
        birth_datetime_local = local_timezone.localize(birth_datetime_naive, is_dst=None) 

        # คำนวณค่า UTC offset (เช่น +7.0 สำหรับกรุงเทพฯ)
        utc_offset_timedelta = birth_datetime_local.utcoffset()
        timezone_offset = utc_offset_timedelta.total_seconds() / 3600.0 # แปลงเป็นชั่วโมง

        # --- 4. การคำนวณทางโหราศาสตร์ (ใช้ข้อมูลที่ถูกต้องแล้ว) ---
        set_ayanamsa(LAHIRI)

        # สร้าง Chart โดยใช้ *เวลาท้องถิ่น* และ *offset ที่ถูกต้อง*
        chart = Chart(birth_datetime_local.year, birth_datetime_local.month, birth_datetime_local.day,
                      birth_datetime_local.hour, birth_datetime_local.minute, 0, # Seconds
                      timezone_offset, latitude, longitude)

        # --- 5. ดึงผลลัพธ์ ---
        planets = chart.get_planets()

        moon_sign = planets[MOON].get_sign_name()
        tithi = chart.get_tithi_name()
        saturn_sign = planets[SATURN].get_sign_name()
        rahu_sign = planets[RAHU].get_sign_name()
        ketu_sign = planets[KETU].get_sign_name()

        kala_sarpa_yoga = "Not Checked" # Placeholder

        result = {
            "status": "success",
            "Full Name": name,
            "Email Address": email,
            "Birth Date": birth_date_str,
            "Birth Time": birth_time_str,
            "Birth Place": birth_place_raw,
            "Vedic Astrology": {
                "Moon Sign": moon_sign,
                "Tithi": tithi,
                "Saturn Sign": saturn_sign,
                "Rahu Sign": rahu_sign,
                "Ketu Sign": ketu_sign,
                "Kala Sarpa Yoga": kala_sarpa_yoga,
                "Ayanamsha": "Lahiri",
                "Ephemeris": "PyJHora (Swiss Ephemeris equivalent)"
            },
            # เพิ่มส่วนนี้เพื่อการตรวจสอบความถูกต้อง
            "Calculation Inputs": {
                "Resolved Place": location.address,
                "Latitude": latitude,
                "Longitude": longitude,
                "Timezone Name": timezone_name,
                "UTC Offset (Hours)": timezone_offset
            },
            # ลบ Accuracy Note เก่าทิ้ง และแทนที่ด้วยอันใหม่
            "Accuracy Note": "Location and timezone are dynamically calculated for accuracy."
        }
        return jsonify(result)

    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

if __name__ == "__main__":
    app.run(debug=True, host='0.0.0.0', port=5000)