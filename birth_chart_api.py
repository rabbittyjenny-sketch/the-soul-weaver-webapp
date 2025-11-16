from flask import Flask, request, jsonify
from datetime import datetime
import pytz
from geopy.geocoders import Nominatim
from timezonefinder import TimezoneFinder

# ใช้ไลบรารีโหราศาสตร์
from immanuel import Chart as ImmanuelChart, const as ImmanuelConst

app = Flask(__name__)

@app.route("/calculate_birth_chart", methods=["POST"])
def calculate_birth_chart():
    try:
        birth_data = request.get_json()
        birth_date_str = birth_data.get("Birth Date")
        birth_time_str = birth_data.get("Birth Time")
        birth_place_raw = birth_data.get("Birth Place")
        
        # ตรวจสอบข้อมูล
        if not birth_date_str or not birth_time_str or not birth_place_raw:
            return jsonify({"status": "error", "message": "Missing required fields."}), 400
        
        # หาตำแหน่งและ timezone
        geolocator = Nominatim(user_agent="birth_chart_api")
        tf = TimezoneFinder()
        location = geolocator.geocode(birth_place_raw)
        if location is None:
            return jsonify({"status": "error", "message": f"Birth place '{birth_place_raw}' not found."}), 400
        
        latitude = location.latitude
        longitude = location.longitude
        timezone_name = tf.timezone_at(lng=longitude, lat=latitude)
        if timezone_name is None:
            return jsonify({"status": "error", "message": f"Timezone not found for '{birth_place_raw}'."}), 400
        
        local_timezone = pytz.timezone(timezone_name)
        try:
            birth_datetime_naive = datetime.strptime(f"{birth_date_str} {birth_time_str}", '%Y-%m-%d %H:%M')
        except Exception:
            return jsonify({"status": "error", "message": "Invalid Birth Date or Birth Time format. Use YYYY-MM-DD and HH:MM."}), 400
        
        # แปลงเป็นเวลาท้องถิ่นและ UTC
        birth_datetime_local = local_timezone.localize(birth_datetime_naive, is_dst=None)
        birth_datetime_utc = birth_datetime_local.astimezone(pytz.utc)

        chart = ImmanuelChart(birth_datetime_utc, latitude, longitude)
        planets = [
            "SUN", "MOON", "MERCURY", "VENUS", "MARS",
            "JUPITER", "SATURN", "URANUS", "NEPTUNE", "PLUTO"
        ]
        chart_data = {}
        for planet in planets:
            planet_const = getattr(ImmanuelConst, planet)
            p_info = chart.ephemeris[planet_const]
            chart_data[planet] = {
                "longitude": p_info.longitude,
                "sign": p_info.get_sign_name(),
                "degree": p_info.get_degree_in_sign()
            }
        return jsonify({
            "status": "success",
            "inputs": {
                "Birth Date": birth_date_str,
                "Birth Time": birth_time_str,
                "Birth Place": birth_place_raw,
                "Resolved Address": location.address,
                "Latitude": latitude,
                "Longitude": longitude,
                "Timezone Name": timezone_name,
            },
            "birth_chart": chart_data
        })
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

if __name__ == "__main__":
    app.run(debug=True, port=5003)