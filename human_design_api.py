from flask import Flask, request, jsonify
from datetime import datetime
import pytz
from geopy.geocoders import Nominatim
from timezonefinder import TimezoneFinder

# ต้องติดตั้งและ import ไลบรารีภายนอกเหล่านี้ใน environment จริง
from immanuel import Chart as ImmanuelChart, const as ImmanuelConst
import humandesign as hd

app = Flask(__name__)

@app.route("/calculate_hd", methods=["POST"])
def calculate_hd():
    try:
        # 1. รับข้อมูล input ที่จำเป็น
        birth_data = request.get_json()
        birth_date_str = birth_data.get("Birth Date")
        birth_time_str = birth_data.get("Birth Time")
        birth_place_raw = birth_data.get("Birth Place")
        
        # Validate ข้อมูล
        if not birth_date_str or not birth_time_str or not birth_place_raw:
            return jsonify({"status": "error", "message": "Missing required fields: Birth Date, Birth Time, or Birth Place."}), 400
        
        # 2. Geocoding และ Timezone
        geolocator = Nominatim(user_agent="hd_api")
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
        
        # แปลงเป็น local aware datetime และ UTC
        birth_datetime_local = local_timezone.localize(birth_datetime_naive, is_dst=None)
        birth_datetime_utc = birth_datetime_local.astimezone(pytz.utc)

        # Chart (Personality/ดำ)
        chart_immanuel = ImmanuelChart(birth_datetime_utc, latitude, longitude)
        planets_personality = [
            ImmanuelConst.SUN, ImmanuelConst.EARTH, ImmanuelConst.MOON,
            ImmanuelConst.NORTH_NODE, ImmanuelConst.SOUTH_NODE, ImmanuelConst.MERCURY,
            ImmanuelConst.VENUS, ImmanuelConst.MARS, ImmanuelConst.JUPITER,
            ImmanuelConst.SATURN, ImmanuelConst.URANUS, ImmanuelConst.NEPTUNE,
            ImmanuelConst.PLUTO
        ]
        hd_personality = hd.Design(
            *[chart_immanuel.ephemeris[p].longitude for p in planets_personality]
        )

        # Chart (Design/แดง - 88 วันก่อนเกิด)
        design_time_utc = hd.utils.get_design_time(birth_datetime_utc)
        chart_design = ImmanuelChart(design_time_utc, latitude, longitude)
        hd_design = hd.Design(
            *[chart_design.ephemeris[p].longitude for p in planets_personality]
        )

        # รวมสองส่วน
        hd_chart = hd.HumanDesign(hd_personality, hd_design)

        # สร้าง output
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
            "human_design": {
                "Type": hd_chart.type,
                "Strategy": hd_chart.strategy,
                "Authority": hd_chart.authority,
                "Profile": hd_chart.profile,
                "Definition": hd_chart.definition,
                "Defined Centers": hd_chart.defined_centers,
                "Open Centers": hd_chart.open_centers
            }
        }), 200

    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

if __name__ == "__main__":
    app.run(debug=True, port=5002)