from flask import Flask, request, jsonify

app = Flask(__name__)

# พจนานุกรม Pythagorean สำหรับภาษาอังกฤษ
pythagorean_values = {
    'a': 1, 'j': 1, 's': 1,
    'b': 2, 'k': 2, 't': 2,
    'c': 3, 'l': 3, 'u': 3,
    'd': 4, 'm': 4, 'v': 4,
    'e': 5, 'n': 5, 'w': 5,
    'f': 6, 'o': 6, 'x': 6,
    'g': 7, 'p': 7, 'y': 7,
    'h': 8, 'q': 8, 'z': 8,
    'i': 9, 'r': 9
}

numerology_meanings = {
    1: {
        "label": "The Leader",
        "meaning": "Represents independence, leadership, and pioneering spirit. You are driven to be number one, but must watch out for selfishness."
    },
    2: {
        "label": "The Peacemaker",
        "meaning": "Represents cooperation, diplomacy, and sensitivity. You thrive on harmony and partnership, but can be indecisive."
    },
    3: {
        "label": "The Communicator",
        "meaning": "Represents self-expression, creativity, and social energy. You are optimistic and inspiring, but can be scattered."
    },
    4: {
        "label": "The Builder",
        "meaning": "Represents stability, hard work, and practicality. You are the foundation of any project, but must avoid being too rigid."
    },
    5: {
        "label": "The Adventurer",
        "meaning": "Represents freedom, versatility, and change. You love excitement and new experiences, but must learn focus."
    },
    6: {
        "label": "The Nurturer",
        "meaning": "Represents responsibility, compassion, and family. You are a natural caretaker, but must avoid self-righteousness."
    },
    7: {
        "label": "The Seeker",
        "meaning": "Represents analysis, spirituality, and intellect. You are a deep thinker, but can become isolated or withdrawn."
    },
    8: {
        "label": "The Powerhouse",
        "meaning": "Represents ambition, authority, and material success. You are a strong manager, but must balance the material and spiritual."
    },
    9: {
        "label": "The Humanitarian",
        "meaning": "Represents compassion, completion, and global awareness. You are a 'big picture' thinker, but can be overly idealistic."
    },
    11: {
        "label": "The Master Intuitive",
        "meaning": "A Master Number. Represents high intuition, spiritual insight, and illumination. You have a powerful connection to the subconscious."
    },
    22: {
        "label": "The Master Builder",
        "meaning": "A Master Number. Represents the ability to turn grand dreams into practical reality. You are a 'spiritual CEO'."
    },
    33: {
        "label": "The Master Teacher",
        "meaning": "A Master Number. Represents healing, compassion, and raising consciousness. You are here to serve and uplift others."
    }
}

def reduce_number(num):
    # ลดทอนเลขจนเป็นเลขเดียว หรือ Master Number (11, 22, 33)
    while num > 9 and num not in (11, 22, 33):
        num = sum(int(x) for x in str(num))
    return num

def numerology_analysis(name):
    name = name.lower()
    destiny_number = 0
    soul_urge_number = 0
    personality_number = 0

    for char in name:
        value = pythagorean_values.get(char)
        if value:
            destiny_number += value
            if char in "aeiou":
                soul_urge_number += value
            else:
                personality_number += value

    result = {}
    # คืนทั้งตัวเลขและความหมาย
    for key, number in [
        ("destiny_number", destiny_number),
        ("soul_urge_number", soul_urge_number),
        ("personality_number", personality_number)
    ]:
        n = reduce_number(number)
        result[key] = {
            "number": n,
            "label": numerology_meanings.get(n, {}).get("label", "N/A"),
            "meaning": numerology_meanings.get(n, {}).get("meaning", "N/A")
        }
    return result

@app.route("/calculate_numerology", methods=["POST"])
def calculate_numerology():
    data = request.get_json()
    name = data.get("name", "")
    if not name or not any(c.isalpha() for c in name):
        return jsonify({"status": "error", "message": "Please enter a valid English name"}), 400

    result = numerology_analysis(name)
    return jsonify({
        "status": "success",
        "input": name,
        "result": result
    })

if __name__ == "__main__":
    app.run(debug=True, port=5004)