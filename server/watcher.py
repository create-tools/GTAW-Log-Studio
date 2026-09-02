# -*- coding: utf-8 -*-
"""
FiveM CitizenFX.log Canlı İzleyici (Live Log Watcher)
GTA World FiveM Chatlog Parser & Manager
"""

import os
import sys
import time
import re
import argparse

# ANSI Terminal Renkleri
COLORS = {
    "ic": "\033[97m",       # Beyaz
    "me": "\033[95m",       # Açık Mor
    "do": "\033[94m",       # Mavi
    "radio": "\033[92m",    # Yeşil
    "phone": "\033[93m",    # Sarı
    "pm": "\033[33m",       # Turuncu/Altın
    "ooc": "\033[90m",      # Gri
    "admin": "\033[91m",    # Kırmızı
    "system": "\033[96m",   # Açık Mavi
    "reset": "\033[0m",     # Sıfırla
}

def find_default_fivem_log():
    local_app_data = os.environ.get("LOCALAPPDATA", "")
    if not local_app_data:
        return None
    
    potential_paths = [
        os.path.join(local_app_data, "CitizenFX", "CitizenFX.log"),
        os.path.join(local_app_data, "FiveM", "FiveM.app", "CitizenFX.log"),
    ]
    
    for path in potential_paths:
        if os.path.exists(path):
            return path
    return potential_paths[0]

def clean_and_colorize(line):
    line = line.strip()
    if not line:
        return None, None
    
    # CitizenFX öneklerini temizle
    line = re.sub(r"^\[\s*\d+\s*\]\s*\[[^\]]+\]\s*", "", line)
    line = re.sub(r"^\[script:[^\]]+\]\s*", "", line)
    line = re.sub(r"^\[chat\]\s*", "", line)
    
    # GTA renk kodlarını temizle
    line = re.sub(r"~[a-zA-Z]~", "", line)
    line = re.sub(r"\{[0-9a-fA-F]{6}\}", "", line)
    
    if not line:
        return None, None
    
    # Kanal tespiti
    if line.startswith("*") and "((" in line:
        return "do", f"{COLORS['do']}{line}{COLORS['reset']}"
    elif line.startswith("*") or line.startswith(">"):
        return "me", f"{COLORS['me']}{line}{COLORS['reset']}"
    elif line.startswith("((") and "PM" in line:
        return "pm", f"{COLORS['pm']}{line}{COLORS['reset']}"
    elif line.startswith("(("):
        return "ooc", f"{COLORS['ooc']}{line}{COLORS['reset']}"
    elif line.startswith("[R:") or line.startswith("[Telsiz") or line.startswith("[Radio"):
        return "radio", f"{COLORS['radio']}{line}{COLORS['reset']}"
    elif line.startswith("[SMS") or line.startswith("[Telefon") or line.startswith("[Arama"):
        return "phone", f"{COLORS['phone']}{line}{COLORS['reset']}"
    elif line.startswith("[ADM") or line.startswith("[Admin"):
        return "admin", f"{COLORS['admin']}{line}{COLORS['reset']}"
    elif line.startswith("[PAYCHECK") or line.startswith("[MAAŞ") or line.startswith("[ATM"):
        return "system", f"{COLORS['system']}{line}{COLORS['reset']}"
    else:
        return "ic", f"{COLORS['ic']}{line}{COLORS['reset']}"

def watch_log_file(file_path):
    print("=" * 60)
    print("🎮 GTA World FiveM Canlı Log İzleyici Başlatıldı")
    print(f"📁 İzlenen Dosya: {file_path}")
    print("=" * 60)
    
    if not os.path.exists(file_path):
        print(f"⚠️ Uyarı: '{file_path}' dosyası henüz mevcut değil. Oyun açıldığında izlenmeye başlanacak...")
    
    last_size = 0
    if os.path.exists(file_path):
        last_size = os.path.getsize(file_path)
    
    try:
        while True:
            if os.path.exists(file_path):
                current_size = os.path.getsize(file_path)
                if current_size < last_size:
                    last_size = 0 # Dosya sıfırlandı
                
                if current_size > last_size:
                    with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
                        f.seek(last_size)
                        new_content = f.read()
                        last_size = f.tell()
                        
                        for line in new_content.splitlines():
                            channel, formatted = clean_and_colorize(line)
                            if formatted:
                                print(formatted)
            time.sleep(0.5)
    except KeyboardInterrupt:
        print("\n🛑 Canlı takip sonlandırıldı.")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="GTAW FiveM Chatlog Live Watcher")
    parser.add_argument("--path", type=str, help="CitizenFX.log dosya yolu", default=None)
    args = parser.parse_args()
    
    target_path = args.path or find_default_fivem_log()
    watch_log_file(target_path)
