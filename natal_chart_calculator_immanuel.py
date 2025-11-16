from flask import Flask, request, jsonify
from datetime import datetime
from immanuel import Chart, const
import json

# --- เพิ่ม Library สำหรับการคำนวณสถานที่และเขตเวลา ---
from geopy.geocoders import Nominatim
from timezonefinder import TimezoneFinder
import pytz
# --------------------------------------------------

app = Flask(__name__)

@app.route("/calculate_natal", methods=["POST"])
def calculate_natal():
    try:
        birth_data = request.get_json()

        # 1. ดึงข้อมูลดิบ (ปรับปรุงใหม่ให้สอดคล้องกัน)
        birth_date_str = birth_data.get("Birth Date")    # e.g., "1990-01-01"
        birth_time_str = birth_data.get("Birth Time")    # e.g., "10:30"
        birth_place_raw = birth_data.get("Birth Place") # e.g., "Bangkok, Thailand"

        if not all([birth_date_str, birth_time_str, birth_place_raw]):
            return jsonify({"status": "error", "message": "Missing required fields: Birth Date, Birth Time, or Birth Place."}), 400

        # --- 2. การคำนวณ Geocoding และ Timezone (ส่วนที่เพิ่มเข้ามา) ---
        geolocator = Nominatim(user_agent="the_soul_weaver_western_app")
        tf = TimezoneFinder()

        location = geolocator.geocode(birth_place_raw)
        if not location:
            return jsonify({"status": "error", "message": f"Birth place '{birth_place_raw}' not found."}), 400

        latitude = location.latitude
        longitude = location.longitude

        timezone_name = tf.timezone_at(lng=longitude, lat=latitude)
        if not timezone_name:
            return jsonify({"status": "error", "message": f"Could not determine timezone for {birth_place_raw}."}), 400

        # --- 3. การจัดการเวลาและเขตเวลา (ส่วนที่แก้ไข) ---
        
        birth_datetime_naive_str = f"{birth_date_str} {birth_time_str}"
        birth_datetime_naive = datetime.strptime(birth_datetime_naive_str, '%Y-%m-%d %H:%M')

        local_timezone = pytz.timezone(timezone_name)
        birth_datetime_local = local_timezone.localize(birth_datetime_naive, is_dst=None)
        
        # *** สำคัญ: Library immanuel คาดหวังเวลาเป็น UTC ***
        # เราจึงต้องแปลงเวลาท้องถิ่น (Local) ที่ถูกต้อง ให้เป็นเวลา UTC
        birth_datetime_utc = birth_datetime_local.astimezone(pytz.utc)

        # --- 4. การคำนวณทางโหราศาสตร์ (ใช้ข้อมูลที่ถูกต้องแล้ว) ---
        
        # ส่ง (เวลา UTC ที่ถูกต้อง, lat, lng) เข้าไปคำนวณ
        chart = Chart(birth_datetime_utc, latitude, longitude, house_system=const.PLACIDUS)

        # --- 5. ดึงผลลัพธ์ ---
        planets_data = []
        for planet in const.PLANETS:
            position = chart.get(planet)
            planets_data.append({
                "name": planet,
                "sign": position.sign.name,
                "sign_symbol": position.sign.symbol,
                "degree": position.degree,
                "house": position.house.id
            })

        houses_data = []
        for house_id in range(1, 13):
            cusp = chart.get_house_cusp(house_id)
            houses_data.append({
                "house": house_id,
                "sign": cusp.sign.name,
                "degree": cusp.degree
            })

        result = {
            "status": "success",
            "Birth Info": {
                "Birth Date": birth_date_str,
                "Birth Time": birth_time_str,
                "Birth Place": birth_place_raw
            },
            "Western Astrology": {
                "Planets": planets_data,
                "Houses": houses_data,
                "Ascendant": {
                    "sign": chart.ascendant.sign.name,
                    "degree": chart.ascendant.degree
                },
                "Midheaven (MC)": {
                    "sign": chart.mc.sign.name,
                    "degree": chart.mc.degree
                }
            },
            "Calculation Inputs": {
                "Resolved Place": location.address,
                "Latitude": latitude,
                "Longitude": longitude,
                "Timezone Name": timezone_name,
                "Calculated UTC Time": birth_datetime_utc.strftime('%Y-%m-%d %H:%M:%S %Z')
            },
            "Accuracy Note": "Location and timezone are dynamically calculated for accuracy."
        }
        
        # ใช้ default=str เพื่อจัดการกับ object ที่ json.dumps ไม่รู้จัก (ถ้ามี)
        return json.dumps(result, default=str, indent=4)

    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

if __name__ == "__main__":
    app.run(debug=True, host='0.0.0.0', port=5001) # เปลี่ยน port เป็น 5001 (หาก 5000 รัน Vedic API อยู่)
