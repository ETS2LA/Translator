from webpage_utils import ColorTitleBar, CheckIfWindowStillOpen, get_screen_dimensions, check_valid_window_position, get_theme, window_position, html
from multiprocessing import JoinableQueue
import multiprocessing  
import variables
import logging
import webview
import time
import os

if os.name == 'nt':
    import win32gui

DEBUG_MODE = False
window_witdth, window_height = 1300, 800

queue:JoinableQueue = JoinableQueue()

webview.settings = {
    'ALLOW_DOWNLOADS': False,
    'ALLOW_FILE_URLS': True,
    'OPEN_EXTERNAL_LINKS_IN_BROWSER': True,
    'OPEN_DEVTOOLS_IN_DEBUG': True
}

def fullscreen_window():
    queue.put({"type": "fullscreen"})
    queue.join() # Wait for the queue to be processed
    value = queue.get()
    queue.task_done()
    return value

def minimize_window():
    queue.put({"type": "minimize"})
    queue.join() # Wait for the queue to be processed
    value = queue.get()
    queue.task_done()
    return value

def start_webpage(queue: JoinableQueue):
    global webview_window
    
    def load_website(window:webview.Window):
        time.sleep(3)
        window.load_url('http://localhost:' + str(variables.FRONTEND_PORT))
        while True:
            time.sleep(0.01)
            try:
                data = queue.get_nowait()
                    
                if data["type"] == "minimize":
                    window.minimize()
                    queue.task_done()
                    queue.put(True)

                if data["type"] == "fullscreen":
                    window.fullscreen = True
                    queue.task_done()
                    queue.put(True)
                    
            except:
                pass
    
    screen_dimensions = get_screen_dimensions()
    window_x = (screen_dimensions[2] - window_witdth) // 2
    window_y = (screen_dimensions[3] - window_height) // 2
    window_x, window_y = check_valid_window_position(window_x, window_y)

    window = webview.create_window(
        f'ETS2LA Translation Dashboard - ETS2LA Team © 2024', 
        html=html, 
        x = window_x,
        y = window_y,
        width=window_witdth, 
        height=window_height,
        background_color=get_theme(),
        resizable=True, 
        zoomable=True,
        confirm_close=False, 
        text_select=True,
        frameless=True, 
        easy_drag=False
    )
    
    webview_window = window
    
    webview.start(
        load_website, 
        window,
        private_mode=False, # Save cookies, local storage and cache
        debug=DEBUG_MODE, # Show developer tools
        storage_path=f"{variables.ROOT_DIR}cache"
    )

def run():
    p = multiprocessing.Process(target=start_webpage, args=(queue, ), daemon=True)
    p.start()
    if os.name == 'nt':
        ColorTitleBar()
        print(f"Webpage URL: http://localhost:{variables.FRONTEND_PORT}")