from PIL import Image
import sys

def remove_background(input_path, output_path, threshold=40):
    img = Image.open(input_path).convert("RGBA")
    data = img.getdata()
    new_data = []
    
    for item in data:
        # Check if the pixel is near black (r, g, b < threshold)
        if item[0] < threshold and item[1] < threshold and item[2] < threshold:
            # Replace with transparent
            new_data.append((0, 0, 0, 0))
        else:
            new_data.append(item)
            
    img.putdata(new_data)
    img.save(output_path, "PNG")
    print(f"Saved to {output_path}")

if __name__ == "__main__":
    remove_background(sys.argv[1], sys.argv[2])
