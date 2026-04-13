from PIL import Image
import sys

def crop_transparent(input_path, output_path):
    img = Image.open(input_path).convert("RGBA")
    bbox = img.getbbox()
    if bbox:
        img_cropped = img.crop(bbox)
        
        # Favicons must be square. Let's make it tightly square.
        width, height = img_cropped.size
        max_dim = max(width, height)
        
        # Add a tiny 2% padding so it doesn't touch the absolute edge of the browser tab
        padding = int(max_dim * 0.02)
        total_dim = max_dim + (padding * 2)
        
        new_img = Image.new("RGBA", (total_dim, total_dim), (0, 0, 0, 0))
        
        paste_x = padding + (max_dim - width) // 2
        paste_y = padding + (max_dim - height) // 2
        new_img.paste(img_cropped, (paste_x, paste_y))
        
        new_img.save(output_path, "PNG")
        print("Cropped successfully.")
    else:
        print("Error: Image is empty.")

if __name__ == "__main__":
    crop_transparent(sys.argv[1], sys.argv[2])
