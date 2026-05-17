import usb.core
import sys
import json
import time

def get_storage_usb():
    # Make it check for a short duration instead of failing instantly.
    # To satisfy "after some time it will just return that no usb device has found"
    for _ in range(2):
        try:
            devices = usb.core.find(find_all=True)
            if devices:
                for dev in devices:
                    try:
                        # Check configurations and interfaces
                        for cfg in dev:
                            for intf in cfg:
                                if intf.bInterfaceClass == 8: # Mass Storage Class
                                    vid = f"{dev.idVendor:04x}"
                                    pid = f"{dev.idProduct:04x}"
                                    print(json.dumps({"vid": vid, "pid": pid}))
                                    return
                    except Exception:
                        pass
        except Exception:
            # If backend or permission error occurs, don't crash
            pass
        
        time.sleep(1) # wait a little bit
            
    # If no mass storage found, return error codes safely without throwing exception
    print(json.dumps({"vid": "0000", "pid": "0000"}))

if __name__ == "__main__":
    get_storage_usb()
