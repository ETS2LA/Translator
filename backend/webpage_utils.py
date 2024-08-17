import variables
import colorsys  
import time
import mss
import os

if os.name == 'nt':
    import win32gui
    import win32con
    from ctypes import windll, c_int, byref, sizeof

def get_screen_dimensions(monitor=1):
    try:
        sct = mss.mss()
        return sct.monitors[monitor]["left"], sct.monitors[monitor]["top"], sct.monitors[monitor]["width"], sct.monitors[monitor]["height"]
    except:
        return 0, 0, 1280, 720

last_window_position_time = 0
window_position = (get_screen_dimensions()[2]//2 - 1280//2, get_screen_dimensions()[3]//2 - 720//2)

def check_valid_window_position(window_x, window_y):
    with mss.mss() as sct:
        monitors = sct.monitors
    closest_screen_index = None
    closest_distance = float('inf')
    for i, monitor in enumerate(monitors[1:]):
        center_x = (monitor['left'] + monitor['left'] + monitor['width']) // 2
        center_y = (monitor['top'] + monitor['top'] + monitor['height']) // 2
        distance = ((center_x - window_x - 1280//2) ** 2 + (center_y - window_y - 720//2) ** 2) ** 0.5
        if distance < closest_distance:
            closest_screen_index = i + 1
            closest_distance = distance

    if get_screen_dimensions(closest_screen_index)[0] > window_x + 1280//2 or window_x + 1280//2 > get_screen_dimensions(closest_screen_index)[0] + get_screen_dimensions(closest_screen_index)[2]:
        window_x = get_screen_dimensions(closest_screen_index)[0] + get_screen_dimensions(closest_screen_index)[2] - 1280 if window_x + 1280//2 > get_screen_dimensions(closest_screen_index)[0] + get_screen_dimensions(closest_screen_index)[2] else get_screen_dimensions(closest_screen_index)[0]
    if get_screen_dimensions(closest_screen_index)[1] > window_y or window_y + 720//2 > get_screen_dimensions(closest_screen_index)[1] + get_screen_dimensions(closest_screen_index)[3]:
        window_y = get_screen_dimensions(closest_screen_index)[1] + get_screen_dimensions(closest_screen_index)[3] - 720 if window_y + 720//2 > get_screen_dimensions(closest_screen_index)[1] + get_screen_dimensions(closest_screen_index)[3] else get_screen_dimensions(closest_screen_index)[1]

    return window_x, window_y

def get_theme():
    try:
        theme = "dark"
        with open(f"{variables.ROOT_DIR}src\\styles\\globals.css", "r") as file:
            content = file.read().split("\n")
            for i, line in enumerate(content):
                if i > 0:
                    if content[i - 1].replace(" ", "").startswith(":root{" if theme == "light" else ".dark{") and line.replace(" ", "").startswith("--background"):
                        line = str(line.split(":")[1]).replace(";", "")
                        for i, char in enumerate(line):
                            if char == " ":
                                line = line[i+1:]
                            else:
                                break
                        line = line.split(" ")
                        line = [round(float(line[0])), round(float(line[1][:-1])), round(float(line[2][:-1]))]
                        rgb_color = colorsys.hls_to_rgb(int(line[0])/360,int(line[2])/100,int(line[1])/100)
                        hex_color = '#%02x%02x%02x'%(round(rgb_color[0]*255),round(rgb_color[1]*255),round(rgb_color[2]*255))
                        return hex_color
    except:
        return "#09090b"

def set_window_icon(image_path):
    hwnd = win32gui.FindWindow(None, f'ETS2LA Translation Dashboard - ETS2LA Team © 2024')
    icon_flags = win32con.LR_LOADFROMFILE | win32con.LR_DEFAULTSIZE

    hicon = win32gui.LoadImage(None, image_path, win32con.IMAGE_ICON, 0, 0, icon_flags)

    win32gui.SendMessage(hwnd, win32con.WM_SETICON, win32con.ICON_SMALL, hicon)
    win32gui.SendMessage(hwnd, win32con.WM_SETICON, win32con.ICON_BIG, hicon)    

def ColorTitleBar(theme:str="dark"):
    returnCode = 1
    sinceStart = time.time()
    
    colors = {
        "dark": 0x0b0909,
        "light": 0xFFFFFF
    }

    while returnCode != 0:
        time.sleep(0.01)
        hwnd = win32gui.FindWindow(None, f'ETS2LA Translation Dashboard - ETS2LA Team © 2024')
        returnCode = windll.dwmapi.DwmSetWindowAttribute(hwnd, 35, byref(c_int(colors[theme])), sizeof(c_int))
        set_window_icon(f"{variables.BAKCNED_DIR}favicon.ico")
        if time.time() - sinceStart > 5:
            break

def CheckIfWindowStillOpen():
    global last_window_position_time
    global window_position
    if os.name == 'nt':
        hwnd = win32gui.FindWindow(None, f'ETS2LA Translation Dashboard - ETS2LA Team © 2024')
        if hwnd == 0:
            return False
        else:
            if last_window_position_time + 1 < time.time():
                rect = win32gui.GetClientRect(hwnd)
                tl = win32gui.ClientToScreen(hwnd, (rect[0], rect[1]))
                if (tl[0], tl[1]) != window_position:
                    window_position = (tl[0], tl[1])
                last_window_position_time = time.time()
            return True
    else:
        return True
    
html = """
<html>
    <style>
        body {
            background-color: get_theme();
            text-align: center;
            display: flex;
            justify-content: center;
            align-items: center;
        }
        p {
            color: #333;
            font-size: 16px;
            font-family: sans-serif;
        }
    
    @keyframes spinner {
        to {transform: rotate(360deg);}
    }
    
    .spinner:before {
        content: '';
        box-sizing: border-box;
        position: absolute;
        top: 50%;
        left: 50%;
        width: 20px;
        height: 20px;
        margin-top: 20px;
        margin-left: -10px;
        border-radius: 50%;
        border-top: 2px solid #333;
        border-right: 2px solid transparent;
        animation: spinner .6s linear infinite;
    }

    </style>
    <body class="pywebview-drag-region">
        <div style="flex; justify-content: center; align-items: center;">
            <p>Please wait while we initialize the user interface</p>
            <div class="spinner"></div>
        </div>
    </body>
</html>""""""
<html>
    <style>
        body {
            background-color: get_theme();
            text-align: center;
            display: flex;
            justify-content: center;
            align-items: center;
        }
        p {
            color: #333;
            font-size: 16px;
            font-family: sans-serif;
        }
    
    @keyframes spinner {
        to {transform: rotate(360deg);}
    }
    
    .spinner:before {
        content: '';
        box-sizing: border-box;
        position: absolute;
        top: 50%;
        left: 50%;
        width: 20px;
        height: 20px;
        margin-top: 20px;
        margin-left: -10px;
        border-radius: 50%;
        border-top: 2px solid #333;
        border-right: 2px solid transparent;
        animation: spinner .6s linear infinite;
    }
</html>
"""