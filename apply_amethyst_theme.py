import os
import re

color_mappings = {
    # Dark Backgrounds (Deep Blues -> Deep Purples)
    r'#(071b2f|041926|071824|0a233a|091c30|091C30|071B2F|041926|071824|0A233A)': '#130927',
    r'#(143d5b|0f3d5f|102f4b|163f5f|143D5B|0F3D5F|102F4B|163F5F)': '#30134a',
    
    # Accent Colors (Teals/Cyans -> Neon Fuchsia/Pink)
    r'#(2edbce|52c7b8|41c5c0|0bbbad|2EDBCE|52C7B8|41C5C0|0BBBAD)': '#d946ef',
    r'#(0ca89f|1aa79d|3fc2b8|0CA89F|1AA79D|3FC2B8)': '#a21caf',
    
    # Text Colors on Glass (Dark Blues -> Dark Plums)
    r'#(102840|112a45|081d32|0f334b|0f354f|0d2c45|1b3b55|102840|112A45|081D32|0F334B|0F354F|0D2C45|1B3B55)': '#1c102b',
    r'#(5b7185|536d86|415b76|5b748a|6d8398|31455f|5B7185|536D86|415B76|5B748A|6D8398|31455F)': '#6d5b7a',

    # RGBA Auras
    r'rgba\(\s*46\s*,\s*219\s*,\s*206': 'rgba(217, 70, 239',
    r'rgba\(\s*82\s*,\s*199\s*,\s*184': 'rgba(217, 70, 239',
    r'rgba\(\s*63\s*,\s*194\s*,\s*184': 'rgba(217, 70, 239',
    
    # Admin Borders/Backgrounds slightly tinted with blue -> purple
    r'rgba\(\s*15\s*,\s*51\s*,\s*75': 'rgba(28, 16, 43',
    r'rgba\(\s*15\s*,\s*50\s*,\s*78': 'rgba(28, 16, 43',
    r'rgba\(\s*15\s*,\s*55\s*,\s*97': 'rgba(28, 16, 43',
    r'rgba\(\s*16\s*,\s*36\s*,\s*61': 'rgba(28, 16, 43',
    r'rgba\(\s*10\s*,\s*35\s*,\s*58': 'rgba(19, 9, 39',
    r'rgba\(\s*9\s*,\s*28\s*,\s*48': 'rgba(19, 9, 39',
}

css_files = [
    'style.css', 'Login.css', 'Register.css', 
    'Profile.css', 'Leaderboard.css', 'admin.css'
]

for filename in css_files:
    if os.path.exists(filename):
        with open(filename, 'r', encoding='utf-8') as f:
            content = f.read()
        
        original_content = content
        
        for pattern, replacement in color_mappings.items():
            content = re.sub(pattern, replacement, content)
            
        with open(filename, 'w', encoding='utf-8') as f:
            f.write(content)
            
        print(f"Updated {filename}")
    else:
        print(f"File not found: {filename}")

print("Theme update complete!")
