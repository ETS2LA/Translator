from fastapi.middleware.cors import CORSMiddleware
import variables
import window
from fastapi import FastAPI
from pydantic import BaseModel
import json
import requests
import socket
import threading
import uvicorn
import time
import sys
import os

RED = '\033[91m'
CLEAR = '\033[0m'

try:
    from pypresence import Presence, exceptions
    use_discord_rpc = True
except:
    print(f"{RED}Discord RPC is not installed. Install it with requirements.bat{CLEAR}")
    use_discord_rpc = False

class LanguageData(BaseModel):
    name: str
    name_en: str
    iso_code: str

class TranslationData(BaseModel):
    language_data: LanguageData
    key_data: list[str]
    translation_data: list[str]

class LanguageDataRequest(BaseModel):
    language : str

GITHUB_TRANSLATIONS_FOLDER = "Translations"
KEYS_JSON = f"{GITHUB_TRANSLATIONS_FOLDER}/keys.json"
COMMENTS_JSON = f"{GITHUB_TRANSLATIONS_FOLDER}/comments.json"
LOCAL_TRANSLATIONS_FOLDER = os.path.join(variables.RUN_DIR, "translations")
LAST_UPDATE_FILE = os.path.join(LOCAL_TRANSLATIONS_FOLDER, "last_update.txt")
EXCLUDED_TRANSLATION_FILES = [f"{GITHUB_TRANSLATIONS_FOLDER}/keys.json", 
                              f"{GITHUB_TRANSLATIONS_FOLDER}/comments.json"]
UPDATE_JSON = [True, 15, 2] # [enabled, cooldown, check_every_x_minutes]
RPC_UPDATE_INTERVAL = 5
last_rpc_update = 0

class RPCStats(): # Sorta kinda like useState because globals wont work right
    def __init__(self):
        self.current_language = None
        self.status = "Initializing"

    def UpdateLanguage(self, language):
        self.current_language = language
    
    def UpdateStatus(self, status):
        self.status = status

    def GetLanguage(self):
        return self.current_language

    def GetStatus(self):
        return self.status
    
rpc_stats = RPCStats()

def InitializeDiscordRPC():
    global RPC, rpc_start
    # Connect to Discord application
    app_id = "1274736801374015628"
    RPC = Presence(app_id)
    try:
        RPC.connect()
    except exceptions.DiscordNotFound:
        print("Discord is either not installed or not running. Presence will not be updated.")
    
    rpc_start = int(time.time())
    RPC.update(
        state="ETS2LA Translation | Initializing...",
        large_image="la",
        large_text="ETS2 Lane Assist Translation",
        buttons=[{"label": "ETS2LA Github", "url": "https://github.com/ETS2LA/Euro-Truck-Simulator-2-Lane-Assist"}],
        start=rpc_start
    )
    print("Discord Rich Presence has been started!")

def UpdateRPC(rpc_stats: RPCStats):
    global RPC, last_rpc_update, rpc_start
    last_status = None
    last_language = None
    while True:
        if time.time() - last_rpc_update >= RPC_UPDATE_INTERVAL:
            status = rpc_stats.GetStatus()
            current_language = rpc_stats.GetLanguage()
            if status != last_status or current_language != last_language:
                if status == "Translating":
                    print(f"Updating Discord Rich Presence... (Translating: {current_language})")
                else:
                    print(f"Updating Discord Rich Presence... ({status})")
            if status == "Initializing":
                RPC.update(
                    details="ETS2LA Translation | Initializing...",
                    large_image="la",
                    large_text="ETS2 Lane Assist Translation",
                    buttons=[{"label": "ETS2LA Github", "url": "https://github.com/ETS2LA/Euro-Truck-Simulator-2-Lane-Assist"}],
                )
            if status == "Translating":
                RPC.update(
                    details=f"ETS2LA Translation | Translating",
                    state=f"Language: {current_language}",
                    large_image="la",
                    large_text="ETS2 Lane Assist Translation",
                    buttons=[{"label": "ETS2LA Github", "url": "https://github.com/ETS2LA/Euro-Truck-Simulator-2-Lane-Assist"}],
                )
            elif status == "Menu":
                RPC.update(
                    details="ETS2LA Translation | Menu",
                    large_image="la",
                    large_text="ETS2 Lane Assist Translation",
                    buttons=[{"label": "ETS2LA Github", "url": "https://github.com/ETS2LA/Euro-Truck-Simulator-2-Lane-Assist"}],
                )
            last_status = status
            last_language = current_language
            last_rpc_update = time.time()

def GetGithubRawURL(file_path):
    return f"https://raw.githubusercontent.com/ETS2LA/Euro-Truck-Simulator-2-Lane-Assist/rewrite/{file_path}"
    
def GetWebData():
    sockets = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    sockets.connect(("8.8.8.8", 80))
    IP = sockets.getsockname()[0]
    sockets.close()

    frontend_url = f"http://{IP}:3000"
    webserver_url = f"http://{IP}:8000"
    return IP, frontend_url, webserver_url

app = FastAPI(title="ETS2LA Translation", 
    description="Webservers to handle connection between frontend and filesystem",
    version="0.0.1")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def UpdateLanguageJSON(force=False, custom_time=0):
    print("Attempting to update language JSON files...")
    used_raw_requests = 0
    if not os.path.exists(LOCAL_TRANSLATIONS_FOLDER):
        os.makedirs(LOCAL_TRANSLATIONS_FOLDER)
    if not os.path.exists(LAST_UPDATE_FILE):
        with open(LAST_UPDATE_FILE, "w") as f:
            f.close()
    else:
        try:
            with open(LAST_UPDATE_FILE, "r") as f:
                last_updated = float(f.read())
                if custom_time == 0:
                    cooldown_time = UPDATE_JSON[1] * 60
                else:
                    cooldown_time = custom_time * 60

                if last_updated and time.time() - last_updated < cooldown_time:
                    if not force:
                        print(f"Time since last update is less than {int(cooldown_time/60)} minutes. Skipping...")
                        return
                    print(f"Time since last update is less than {int(cooldown_time/60)} minutes. However, force is enabled. Continuing...")
        except:
            pass

    api_request = requests.get("https://api.github.com/repos/ETS2LA/Euro-Truck-Simulator-2-Lane-Assist/git/trees/rewrite?recursive=1")
    if api_request.status_code == 200:
        api_data = json.loads(api_request.text)
        for file in api_data["tree"]:
            file_path = "/".join(file["path"].split("/")[:-1])
            if file_path != GITHUB_TRANSLATIONS_FOLDER:
                continue
            if file["path"].endswith(".json") and file["path"] not in EXCLUDED_TRANSLATION_FILES:
                file_name = file["path"].split("/")[-1]
                json_raw_url = GetGithubRawURL(file["path"])
                json_data = requests.get(json_raw_url)
                used_raw_requests += 1
                if json_data.status_code == 200:
                    json_data = json.loads(json_data.text)
                    with open(os.path.join(LOCAL_TRANSLATIONS_FOLDER, f"{json_data['iso_code']}.json"), "w") as f:
                        json.dump(json_data, f, indent=4)
                        f.close()

        with open(LAST_UPDATE_FILE, "w") as f:
            f.write(str(time.time()))

    print(f"Used {used_raw_requests} raw requests to update language JSON files.")
    return

@app.get("/")
async def root():
    IP, _, webserver_url = GetWebData()
    rpc_stats.UpdateStatus("Menu")
    return {"status": "ok", "url": webserver_url, "ip": IP} 

@app.get("/get_languages")
async def get_languages():
    language_data = []
    json_data = {}
    if not os.path.exists(LAST_UPDATE_FILE):
        UpdateLanguageJSON()

    for file in os.listdir(LOCAL_TRANSLATIONS_FOLDER):
        if file.endswith(".json"):
            with open(os.path.join(LOCAL_TRANSLATIONS_FOLDER, file), "r") as f:
                json_data[file] = json.load(f)
    
    for key, file_name in json_data.items():
        if key == "en.json":
            continue
        language_data.append({"file_name": key, "name": file_name["name"], "name_en": file_name["name_en"], "iso_code": file_name["iso_code"]})

    return {"status": "ok", "data": language_data}

@app.post("/translation_data")
async def get_translation_data(data : LanguageDataRequest):
    language = data.language
    rpc_stats.UpdateStatus("Translating")
    rpc_stats.UpdateLanguage(language)
    
    if not os.path.exists(LAST_UPDATE_FILE):
        UpdateLanguageJSON()
    
    translation_json_data = {}
    for file in os.listdir(LOCAL_TRANSLATIONS_FOLDER):
        if file.endswith(".json"):
            with open(os.path.join(LOCAL_TRANSLATIONS_FOLDER, file), "r") as f:
                translation_json_data[file.replace(".json", "")] = json.load(f)

    translation_data = []
    comment_data = []
    key_data = []
    en_data = []

    lang_iso_code = None
    for key, file_name in translation_json_data.items():
        if file_name["name_en"] == language:
            lang_iso_code = key
            break
    if lang_iso_code == None:
        return {"status": "error", "traceback": f"Language {language} not found"}

    try:
        en_language_data = translation_json_data["en"]
    except KeyError:
        return {"status": "error", "traceback": "English language data not found"}

    keys_json_url = GetGithubRawURL(KEYS_JSON)
    comments_json_url = GetGithubRawURL(COMMENTS_JSON)
    keys_json_data = requests.get(keys_json_url)
    comments_json_data = requests.get(comments_json_url)
    language_data = translation_json_data[lang_iso_code]

    if keys_json_data.status_code == 200 and comments_json_data.status_code == 200:
        keys_json_data = json.loads(keys_json_data.text)
        comments_json_data = json.loads(comments_json_data.text)
        for key in keys_json_data:
            if key in language_data:
                translation_data.append(language_data[key])
            else:
                translation_data.append(None)
            if key in comments_json_data:
                comment_data.append(comments_json_data[key])
            else:
                comment_data.append(None)
            if key in en_language_data:
                en_data.append(en_language_data[key])
            else:
                en_data.append(None)
            key_data.append(key)   

        return {"status": "ok", "data": {"keys": key_data, "comments": comment_data, "values": translation_data, "en_values": en_data}}
    else:
        print(f"Failed to get translation data. Keys: {keys_json_data.status_code}, Comments: {comments_json_data.status_code}")
        return {"status": "error", "message": f"Failed to get translation data. Keys: {keys_json_data.status_code}, Comments: {comments_json_data.status_code}"}

@app.get("/update_translations")
async def update_translations():
    UpdateLanguageJSON(force=True)
    return {"status": "ok"}

@app.post("/new_language")
async def new_language(language_data: LanguageData):
    try:
        name = language_data.name
        name_en = language_data.name_en
        iso_code = language_data.iso_code.lower()
        json_path = os.path.join(LOCAL_TRANSLATIONS_FOLDER, f"{iso_code}.json")
        with open(json_path, "w") as f:
            json_string = {
                "name": name,
                "name_en": name_en,
                "iso_code": iso_code
            }
            json.dump(json_string, f, indent=4)
            f.close()
        return {"status": "ok"}
    except Exception as e:
        print(e)
        return {"status": "error"}

@app.post("/save_translations")
async def save_translations(translations : TranslationData):
    translations = translations.model_dump()
    json_string = {}

    for key, value in translations["language_data"].items():
        json_string[key] = value
    
    for i, key in enumerate(translations["key_data"]):
        json_string[key] = translations["translation_data"][i]

    with open(os.path.join(LOCAL_TRANSLATIONS_FOLDER, f"{translations['language_data']['iso_code']}.json"), "w") as f:
        json.dump(json_string, f, indent=4)
        f.close()

    return {"status": "ok"}

@app.post("/window/maximize")
async def maximize_window():
    window.fullscreen_window()
    return {"status": "ok"}

@app.post("/window/minimize")
async def minimize_window():
    window.minimize_window()
    return {"status": "ok"}

def ForceExit():
    time.sleep(1) # This allows time for the web requests to finish before exiting
    os.system("taskkill /F /IM python.exe > nul 2>&1")

@app.post("/window/exit")
async def exit_window():
    print("Exiting...")
    window.destroy_window() # Destroy the window
    os.system("taskkill /F /IM node.exe > nul 2>&1") # Kill the node process
    thread = threading.Thread(target=ForceExit) # Start in a thread so the request can finish before exiting
    thread.start()
    return {"status": "ok"}

def startBackend():
    IP, frontend_url, webserver_url = GetWebData()
    print(f"Webserver URL: {webserver_url}")
    print(f"Frontend URL: {frontend_url}\n")
    uvicorn.run(app, host="0.0.0.0", port=8000)

def startFrontend():
    window.run()
    os.system(f"npm run dev")

def UpdateTranslationData():
    while True:
        UpdateLanguageJSON() # It will only update if the language JSON file is older than UPDATE_JSON[1]
        if UPDATE_JSON[0]: # If enabled
            time.sleep(UPDATE_JSON[2] * 60) # Sleep for UPDATE_JSON[2] minutes
        else:
            break # If disabled, only update at startup, and then break

if __name__ == "__main__":
    backend_thread = threading.Thread(target=startBackend).start()
    frontend_thread = threading.Thread(target=startFrontend).start()
    translation_update_thread = threading.Thread(target=UpdateTranslationData).start()
    if use_discord_rpc:
        InitializeDiscordRPC()
        rpc_thread = threading.Thread(target=UpdateRPC, args=(rpc_stats,))
        rpc_thread.start()