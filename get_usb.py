import usb.core
import sys
import json

def get_storage_usb():
    devices = usb.core.find(find_all=True)
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
            
    # If no mass storage found, return error codes
    print(json.dumps({"vid": "0000", "pid": "0000"}))

if __name__ == "__main__":
    get_storage_usb()
