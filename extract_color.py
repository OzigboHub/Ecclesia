
from PIL import Image
from collections import Counter
import sys

def get_dominant_color(image_path):
    try:
        img = Image.open(image_path)
        img = img.resize((50, 50))  # Resize for speed
        pixels = list(img.getdata())
        # Filter out transparent pixels if any
        if len(pixels[0]) == 4:
            pixels = [p for p in pixels if p[3] > 128]
            pixels = [(p[0], p[1], p[2]) for p in pixels]
            
        # Count colors
        counts = Counter(pixels)
        # Get most common
        most_common = counts.most_common(10)
        
        # We want a color that is likely the "brand" color, not white/black/grey if possible.
        # Simple heuristic: ignore very unsaturated or very bright/dark colors if there are others.
        
        candidates = []
        for color, count in most_common:
            r, g, b = color
            # Skip white-ish
            if r > 240 and g > 240 and b > 240: continue
            # Skip black-ish
            if r < 15 and g < 15 and b < 15: continue
            candidates.append(color)
            
        if not candidates:
            return most_common[0][0]
            
        return candidates[0]

    except Exception as e:
        print(f"Error: {e}")
        return None

if __name__ == "__main__":
    image_path = sys.argv[1]
    color = get_dominant_color(image_path)
    if color:
        print(f"#{color[0]:02x}{color[1]:02x}{color[2]:02x}")
    else:
        print("Could not extract color")
