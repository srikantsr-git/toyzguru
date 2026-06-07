import os
import json
import urllib.request
import sys

try:
    sys.stdout.reconfigure(encoding='utf-8')
except Exception:
    pass

def fetch_and_save():
    api_url = "https://toyzguru.in/?rest_route=/wc/store/v1/products"
    products_dir = os.path.dirname(os.path.abspath(__file__))
    
    print(f"Fetching products from: {api_url}")
    try:
        req = urllib.request.Request(
            api_url, 
            headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'}
        )
        with urllib.request.urlopen(req) as response:
            data = json.loads(response.read().decode('utf-8'))
    except Exception as e:
        print(f"Error fetching product data: {e}")
        return

    # Save raw json first
    json_path = os.path.join(products_dir, "products_raw.json")
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    print(f"Saved raw product data to {json_path}")

    # Process and download images
    processed_products = []
    for item in data:
        prod_id = item.get("id")
        name = item.get("name", "")
        # Clean name for filenames
        clean_name = "".join(c for c in name if c.isalnum() or c in (" ", "_", "-")).rstrip()
        clean_name = clean_name.replace(" ", "_").lower()
        
        print(f"\nProcessing: {name} (ID: {prod_id})")
        
        images_info = item.get("images", [])
        local_images = []
        
        for idx, img_data in enumerate(images_info):
            img_url = img_data.get("src")
            if not img_url:
                continue
            
            # Determine extension
            ext = ".png"
            if ".jpg" in img_url.lower() or ".jpeg" in img_url.lower():
                ext = ".jpg"
            elif ".webp" in img_url.lower():
                ext = ".webp"
                
            img_filename = f"{prod_id}_{clean_name}_{idx}{ext}"
            img_local_path = os.path.join(products_dir, img_filename)
            
            print(f"  Downloading image: {img_url} -> {img_filename}")
            try:
                img_req = urllib.request.Request(
                    img_url, 
                    headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'}
                )
                with urllib.request.urlopen(img_req) as img_resp:
                    with open(img_local_path, "wb") as img_file:
                        img_file.write(img_resp.read())
                local_images.append(f"products/{img_filename}")
            except Exception as img_err:
                print(f"  Failed to download image {img_url}: {img_err}")
                
        # Build the final product schema matching app.js structure
        # Extract specs
        specs = {}
        desc_html = item.get("description", "")
        # Attempt simple parsing of specs table from HTML if present
        if "<tbody>" in desc_html:
            try:
                tbody = desc_html.split("<tbody>")[1].split("</tbody>")[0]
                rows = tbody.split("<tr>")
                for r in rows:
                    if "<td>" in r:
                        cells = r.split("<td>")
                        if len(cells) >= 3:
                            # Strip tags
                            k = cells[1].split("</td>")[0]
                            k = "".join(c for c in k if c not in ("<", ">") and not k.startswith("/") )
                            # remove html tags inside key
                            import re
                            k = re.sub('<[^<]+?>', '', k).strip()
                            v = re.sub('<[^<]+?>', '', cells[2].split("</td>")[0]).strip()
                            if k and v:
                                specs[k] = v
            except Exception as spec_err:
                print(f"  Failed parsing specs table: {spec_err}")

        price_val = float(item.get("prices", {}).get("price", "0")) / 100.0
        reg_price_val = float(item.get("prices", {}).get("regular_price", "0")) / 100.0
        
        processed_prod = {
            "id": f"scraped-{prod_id}",
            "title": name,
            "category": "anime",  # Default category
            "price": price_val,
            "originalPrice": reg_price_val if reg_price_val > price_val else price_val,
            "image": local_images[0] if local_images else "",
            "allImages": local_images,
            "rating": 4.5,  # Default starter rating
            "reviewsCount": 10,
            "badge": "new" if item.get("on_sale") else "",
            "description": re.sub('<[^<]+?>', '', desc_html).strip()[:300], # Clean tag description
            "options": [],
            "specs": specs,
            "stock": 10 if item.get("is_in_stock") else 0
        }
        processed_products.append(processed_prod)

    # Save clean processed json
    processed_json_path = os.path.join(products_dir, "products.json")
    with open(processed_json_path, "w", encoding="utf-8") as f:
        json.dump(processed_products, f, indent=2, ensure_ascii=False)
    print(f"\nSaved processed product database to {processed_json_path}")
    print("Done!")

if __name__ == "__main__":
    fetch_and_save()
