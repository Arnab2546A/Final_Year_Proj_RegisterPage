import usb.core
import json
import time

# Common ESP32 / USB UART VID list
KNOWN_ESP_VIDS = {
    0x10C4,  # Silicon Labs CP210x
    0x1A86,  # CH340
    0x0403,  # FTDI
    0x303A,  # Espressif native USB
}

def get_storage_usb():
    for _ in range(2):
        try:
            devices = usb.core.find(find_all=True)
            if devices:
                for dev in devices:
                    try:
                        vid = dev.idVendor
                        pid = dev.idProduct
                        
                        # Check strictly if the device matches known ESP32 VIDs
                        if vid in KNOWN_ESP_VIDS:
                            vid_hex = f"{vid:04x}"
                            pid_hex = f"{pid:04x}"
                            print(json.dumps({"vid": vid_hex, "pid": pid_hex}))
                            return
                    except Exception:
                        pass
        except Exception:
            pass
        
        time.sleep(1)
            
    print(json.dumps({"vid": "0000", "pid": "0000"}))

if __name__ == "__main__":
    get_storage_usb()