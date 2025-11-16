import json
from flask import Flask, request, jsonify
from datetime import datetime
from PyJHora import * # Import all functions from PyJHora

from geopy.geocoders import Nominatim
from timezonefinder import TimezoneFinder
import pytz

app = Flask(__name__)

# Tithi & Nakshatra detailed interpretation
TITHI_REPORT = {
    "PRATIPADA": "You are a pioneer, creative, and enjoy new beginnings. Focus on initiating new projects.",
    "DWITIYA": "You seek balance, stability, and partnership. You are dependable and value foundations.",
    "TRITIYA": "You are active, powerful, and courageous. A good day for tasks requiring strength.",
    "CHATURTHI": "You may face obstacles but have the power to overcome them. Good for removing barriers.",
    "PANCHAMI": "You are prosperous, influential, and charismatic. A day for success and recognition.",
    "SHASHTHI": "You are artistic, loved by many, and enjoy challenges. Good for celebrations or conflicts.",
    "SAPTAMI": "You are cooperative, peaceful, and value friendship. A good day for travel and partnerships.",
    "ASHTAMI": "You are assertive, determined, and can be argumentative. Good for debates or overcoming opposition.",
    "NAVAMI": "You are energetic, sometimes chaotic, but full of dynamic force. A day of intense activity.",
    "DASHAMI": "You are virtuous, successful, and oriented toward good deeds. A day for positive outcomes.",
    "EKADASHI": "You are spiritual, intellectual, and pure. A day for fasting, meditation, and learning.",
    "DWADASHI": "You are fortunate, respected, and often involved in spiritual or public service.",
    "TRAYODASHI": "You are charming, victorious, and achieve your desires. A day for success in all endeavors.",
    "CHATURDASHI": "You are strong-willed, secretive, and powerful. A day for introspection or intense work.",
    "PURNIMA": "You are bright, prosperous, and complete. Full of energy and optimism. (Full Moon)",
    "AMAVASYA": "You are introspective, connected to your ancestors, and have a powerful intuition. (New Moon)"
}

NAKSHATRA_REPORT = {
    "ASHVINI": "The Initiator. You are fast, energetic, and a pioneer. You have a healing touch but can be impulsive.",
    "BHARANI": "The Bearer. You carry life's burdens and creative energy. You are strong-willed and explore extremes.",
    "KRITTIKA": "The Cutter. You are sharp, fiery, and purifying. You have leadership qualities and a critical eye.",
    "ROHINI": "The Star of Ascent. You are charming, artistic, and materialistic. You love comfort and beauty.",
    "MRIGASHIRA": "The Searching Star. You are curious, gentle, and always seeking. You are intelligent but restless.",
    "ARDRA": "The Teardrop. You represent intense transformation. You overcome storms and achieve clarity.",
    "PUNARVASU": "The Return of the Light. You are nurturing, philosophical, and find success after struggle.",
    "PUSHYA": "The Nurturer. You are the most auspicious star. You are caring, spiritual, and prosperous.",
    "ASHLESHA": "The Clinging Star. You are mystical, insightful, and possess hypnotic power. You are wise but can be possessive.",
    "MAGHA": "The Royal Star. You are connected to your ancestors. You are ambitious, noble, and a natural leader.",
    "PURVA PHALGUNI": "The Former Red One. You are relaxed, charming, and artistic. You enjoy life's pleasures.",
    "UTTARA PHALGUNI": "The Latter Red One. You are stable, kind, and value partnership and friendship.",
    "HASTA": "The Hand. You are skilled, witty, and clever. You can manifest your goals through your own efforts.",
    "CHITRA": "The Jewel. You are charismatic, creative, and love beautiful things. You are a dynamic creator.",
    "SWATI": "The Independent One. You are self-reliant, flexible, and ambitious. You value freedom and justice.",
    "VISHAKHA": "The Forked Branch. You are determined, ambitious, and achieve goals. You have a dual nature.",
    "ANURADHA": "The Star of Success. You are a natural leader who balances energy. You are devoted and good with people.",
    "JYESHTHA": "The Eldest. You are the chief star. You are wise, protective, and have a powerful, intense mind.",
    "MULA": "The Root. You get to the core of things. You are direct, philosophical, and seek truth.",
    "PURVA ASHADHA": "The Invincible Star. You are optimistic, popular, and enjoy challenges. You are a powerful motivator.",
    "UTTARA ASHADHA": "The Universal Star. You are a responsible leader with enduring success. You finish what you start.",
    "SHRAVANA": "The Star of Learning. You are a great listener and learner. You are connected to knowledge and sound.",
    "DHANISHTHA": "The Star of Symphony. You are wealthy, ambitious, and love music and rhythm.",
    "SHATABHISHA": "The Veiling Star. You are mystical, secretive, and a natural healer. You see beyond the veil.",
    "PURVA BHADRAPADA": "The Former Blessed Foot. You are passionate, intense, and transformative. You have a dual nature.",
    "UTTARA BHADRAPADA": "The Latter Blessed Foot. You are compassionate, wise, and stable. You bring blessings.",
    "REVATI": "The Wealthy. You are the final star. You are nurturing, protective of others, and spiritual."
}

@app.route("/calculate_vedic", methods=["POST"])
def calculate_vedic():
    try:
        birth_data = request.get_json()
        birth_date_str = birth_data.get("Birth Date")
        birth_time_str = birth_data.get("Birth Time")
        birth_place_raw = birth_data.get("Birth Place")

        if not all([birth_date_str, birth_time_str, birth_place_raw]):
            return jsonify({"status": "error", "message": "Missing required fields: Birth Date, Birth Time, or Birth Place."}), 400

        geolocator = Nominatim(user_agent="vedic_api_app")
        tf = TimezoneFinder()
        location = geolocator.geocode(birth_place_raw)
        if not location:
            return jsonify({"status": "error", "message": f"Birth place '{birth_place_raw}' not found."}), 400

        latitude = location.latitude
        longitude = location.longitude
        timezone_name = tf.timezone_at(lng=longitude, lat=latitude)
        if not timezone_name:
            return jsonify({"status": "error", "message": f"Could not determine timezone for {birth_place_raw}."}), 400

        birth_datetime_naive_str = f"{birth_date_str} {birth_time_str}"
        birth_datetime_naive = datetime.strptime(birth_datetime_naive_str, '%Y-%m-%d %H:%M')
        local_timezone = pytz.timezone(timezone_name)
        birth_datetime_local = local_timezone.localize(birth_datetime_naive, is_dst=None) 
        utc_offset_timedelta = birth_datetime_local.utcoffset()
        timezone_offset = utc_offset_timedelta.total_seconds() / 3600.0 

        set_ayanamsa(LAHIRI)
        chart = Chart(birth_datetime_local.year, birth_datetime_local.month, birth_datetime_local.day,
                      birth_datetime_local.hour, birth_datetime_local.minute, 0, 
                      timezone_offset, latitude, longitude)

        planets = chart.get_planets()

        tithi_name = chart.get_tithi_name()
        moon_nakshatra_name = planets[MOON].get_nakshatra_name()
        moon_nakshatra_pada = planets[MOON].get_nakshatra_pada()
        moon_sign = planets[MOON].get_sign_name()
        saturn_sign = planets[SATURN].get_sign_name()

        report_content = {
            "Tithi Report": TITHI_REPORT.get(tithi_name, "No interpretation available for this Tithi."),
            "Nakshatra Report": NAKSHATRA_REPORT.get(moon_nakshatra_name, "No interpretation available for this Nakshatra.")
        }

        result = {
            "status": "success",
            "Birth Info": {
                "Birth Date": birth_date_str,
                "Birth Time": birth_time_str,
                "Birth Place": birth_place_raw
            },
            "VedicData": {
                "Tithi": tithi_name,
                "Nakshatra": moon_nakshatra_name,
                "Nakshatra Pada": moon_nakshatra_pada,
                "Moon Sign": moon_sign,
                "Saturn Sign": saturn_sign
            },
            "Report": report_content,
            "CalculationInputs": {
                "Resolved Place": location.address,
                "Latitude": latitude,
                "Longitude": longitude,
                "Timezone Name": timezone_name,
                "UTC Offset (Hours)": timezone_offset
            }
        }
        return jsonify(result)

    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

if __name__ == "__main__":
    app.run(debug=True, host='0.0.0.0', port=5000)
