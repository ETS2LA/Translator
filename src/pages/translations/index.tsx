import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable"
import { AlertDialog, AlertDialogContent, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { GetTranslationData, UpdateTranslationData, SaveTranslationData, GetLanguageData,
    CreateNewLanguage } from "@/components/webserver";
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button";
import { Loading } from "@/components/loading";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue, SelectSeparator } from "@/components/ui/select"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CirclePlus } from "lucide-react";

// @ts-ignore | Prevents module not found error from js-cookie, even though it is installed
import Cookies from 'js-cookie';

export default function TranslationHome() {
    const { push } = useRouter();
    const [loading_translation_data, setLoadingTranslationData] = useState(false);
    const [updating_translation_data, setUpdatingTranslationData] = useState(false);
    const [saving_translation_data, setSavingTranslationData] = useState(false);
    const [loading_language_data, setLoadingLanguageData] = useState(false);
    const [creating_new_language, setCreatingNewLanguage] = useState(false);
    const [translationData, setTranslationData] = useState<any[]>([]);
    const [maunual_update_prompt, setManualUpdatePrompt] = useState(false);
    const [language_data_prompt_open, setLanguageDataPromptOpen] = useState(false);
    const [new_language_prompt_open, setNewLanguagePromptOpen] = useState(false);
    const [selected_lannguage_index, setSelectedLanguageIndex] = useState(-1);
    const [language_data, setLanguageData] = useState<any[]>([]);
    const [language, setLanguage] = useState("Select a language");
    
    const [new_language_iso_code, setNewLanguageIsoCode] = useState("");
    const [new_language_name, setNewLanguageName] = useState("");
    const [new_language_name_en, setNewLanguageNameEn] = useState("");

    const webserver_url = Cookies.get("webserver_url") ?? "http://localhost:8000";
    const connected = Cookies.get("connected") === "true";
    let translation_url = webserver_url + "/translation_data/" + language;

    useEffect(() => {
        if (language === "Select a language") {
            setLanguageDataPromptOpen(true);
        } else if (language === "new") {
            setNewLanguagePromptOpen(true);
        }
    }, [language]);

    function HandleGetTranslationData() {
        if (language === "Select a language" || language === "new") {
            return;
        }
        setLoadingTranslationData(true);
        toast.promise(
            new Promise<void>(async (resolve, reject) => {
                try {
                    translation_url = webserver_url + "/translation_data"
                    console.log("Getting translation data from " + translation_url);
                    const data = await GetTranslationData(translation_url, language);
                    await ParseTranslationData(data);
                    setTimeout(() => {
                        setLoadingTranslationData(false);
                        resolve();
                    }, 2000);
                    console.log("Connected to server at " + webserver_url);
                } catch (error) {
                    reject(error);
                    console.log(error);
                    setLoadingTranslationData(false);
                }
            }),
            {
                loading: "Retrieving translation data for " + language + "...",
                success: "Retrieved translation data!",
                error: "Failed to retrieve translation data",
            }
        );
    }

    function ParseTranslationData(data: {"keys": [string], "comments": [{}], "values": [{}], "en_values": [{}]}) {
        let keys = data.keys;
        let comments = data.comments;
        let values = data.values;
        let en_values = data.en_values
        let translations : any[] = [];
        let new_translations : any[] = [];

        for (let i = 0; i < keys.length; i++) {
            let key = keys[i];
            let en_value = en_values[i];
            let comment = comments[i];

            if (values[i] === null) { // Make sure the key doesnt already have a translation
                values[i] = "";
            }
            let translation = values[i];

            translations.push({key: key, comment: comment, en_value: en_value, translation: translation});
        }
        console.log(translations);
        setTranslationData(translations);
    }

    useEffect(() => {
        if (connected) {
            setLoadingLanguageData(true);
            toast.promise(
                new Promise<void>(async (resolve, reject) => {
                    try {
                        let language_data_url = webserver_url + "/get_languages";
                        console.log("Getting languages from " + language_data_url);
                        const data = await GetLanguageData(language_data_url);
                        setLanguageData(data);
                        setTimeout(() => {
                            setLoadingLanguageData(false);
                            resolve();
                        }, 2000);
                        console.log("Connected to server at " + webserver_url);
                    } catch (error) {
                        reject(error);
                        console.log(error);
                        setLoadingLanguageData(false);
                    }
                }),
                {
                    loading: "Retrieving translation data for " + language + "...",
                    success: "Retrieved translation data!",
                    error: "Failed to retrieve translation data",
                }
            );
            if (language !== "Select a language") {
                HandleGetTranslationData();
            }
        } else {
            toast.error("Not connected to server, can't retrieve translation data");
            setLoadingTranslationData(false);
        }
    }, [connected, translation_url, webserver_url]);

    function HandleCreateNewLanguage() {
        if (new_language_iso_code == "" || new_language_name == "" || new_language_name_en == "") {
            toast.error("All fields are required");
            return;
        }
        toast.promise( 
            new Promise<void>(async (resolve, reject) => {
                try {
                    setCreatingNewLanguage(true);
                    let new_language_url = webserver_url + "/new_language";
                    console.log("Creating new language at " + new_language_url);
                    const success = await CreateNewLanguage(new_language_url, {name: new_language_name, en_name: new_language_name_en, iso_code: new_language_iso_code});
                    if (success) {
                        setNewLanguageIsoCode("");
                        setNewLanguageName("");
                        setNewLanguageNameEn("");
                        setTimeout(() => {
                            setNewLanguagePromptOpen(false);
                            setCreatingNewLanguage(false);
                            setLanguage("Select a language");
                            resolve();
                        }, 1000);
                    } else {
                        reject();
                        setCreatingNewLanguage(false);
                    }
                } catch (error) {
                    setCreatingNewLanguage(false);
                    reject(error);
                    console.log(error);
                }
            }),
            {
                loading: "Creating new language...",
                success: "Created new language!",
                error: "Failed to create new language",
            }
        );
    }

    function HandleSaveTranslationData() {
        toast.promise(
            new Promise<void>(async (resolve, reject) => {
                try {
                    setSavingTranslationData(true);
                    let save_url = webserver_url + "/save_translations/";
                    let translation_keys = []
                    let language_translations = []
                    let language_name = null
                    let language_en_name = language
                    let language_iso = null
                    for (let entry of language_data) {
                        if (entry.name_en == language) {
                            language_name = entry.name
                            language_iso = entry.iso_code
                        }
                    }
                    for (let entry of translationData) {
                        if (entry.translation !== "") {
                            translation_keys.push(entry.key);
                            language_translations.push(entry.translation);
                        }
                    }

                    await SaveTranslationData(save_url, {name: language_name, en_name: language_en_name, iso_code: language_iso}, translation_keys, language_translations);
                    setTimeout(() => {
                        setSavingTranslationData(false);
                        resolve();
                        push("/")
                    }, 1000)
                } catch (error) {
                    setSavingTranslationData(false);
                    reject(error);
                    console.log(error);
                }
            }),
            {
                loading: "Saving translation data...",
                success: "Saved translation data!",
                error: "Failed to save translation data",
            }
        );
    }

    function ManualUpdate() {
        toast.promise(
            new Promise<void>(async (resolve, reject) => {
                try {
                    setUpdatingTranslationData(true);
                    let update_url = webserver_url + "/update_translations/";
                    await UpdateTranslationData(update_url);
                    setTimeout(() => {
                        resolve();
                    }, 1000);
                } catch (error) {
                    reject(error);
                    console.log(error);
                    setUpdatingTranslationData(false);
                }
            }),
            {
                loading: "Updating translation data...",
                success: () => {
                    setTimeout(() => {
                        window.location.reload();
                    }, 1000);
                    return "Updated translation data! Reloading...";
                },
                error: "Failed to update translation data",
            }
        );
    }

    function UpdateTranslations(key: string, value: string) {
        const updatedData = translationData.map(item => 
            item.key === key ? { ...item, translation: value } : item
        );
     
        setTranslationData(updatedData);
        console.log("Updated " + key + " to " + value);
    }
    
    
    if (loading_translation_data) {
        return (
            <Loading loading_text="Retrieving translation data..."/>
        )
    }

    if (updating_translation_data) {
        return (
            <Loading loading_text="Updating translation data..."/>
        )
    }

    if (saving_translation_data) {
        return (
            <Loading loading_text="Saving translation data..."/>
        )
    }

    if (loading_language_data) {
        return (
            <Loading loading_text="Retrieving language data..."/>
        )
    }

    if (creating_new_language) {
        return (
            <Loading loading_text="Creating new language..."/>
        )
    }

    if (language === "Select a language") {
        return (
            <Dialog open={language_data_prompt_open} onOpenChange={setLanguageDataPromptOpen}>
                <DialogContent aria-describedby={undefined}>
                    <h1 className="text-2xl font-bold">Select a language</h1>
                    <Select value={language} onValueChange={(value) => {setLanguage(value); setLanguageDataPromptOpen(false); HandleGetTranslationData()}}>
                        <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select a language to translate" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectGroup>
                                <SelectLabel className="text-zinc-400">Languages</SelectLabel>
                                {language_data.map((language) => (
                                    <SelectItem key={language.name_en} value={language.name_en} onClick={() => {console.log(language.name_en); }}>{language.name_en}</SelectItem>
                                ))}
                                <SelectSeparator />
                                <SelectItem value="new">Add new language</SelectItem>
                            </SelectGroup>
                        </SelectContent>
                        </Select>
                </DialogContent>
            </Dialog>
        )
    }

    if (language === "new") {
        return (
            <Dialog open={new_language_prompt_open} onOpenChange={setNewLanguagePromptOpen}>
                <DialogContent aria-describedby={undefined}>
                    <h1 className="text-2xl font-bold">New Language</h1>
                    <div className="flex flex-col gap-2">
                        <div className="flex flex-col gap-1">
                            <p>Name (In Language)</p>
                            <Input value={new_language_name} onChange={(e) => setNewLanguageName(e.target.value)}/>
                        </div>
                        <div className="flex flex-col gap-1">
                            <p>Name (In English)</p>
                            <Input value={new_language_name_en} onChange={(e) => setNewLanguageNameEn(e.target.value)}/>
                        </div>
                        <div className="flex flex-col gap-1">
                            <p>ISO Code</p>
                            <Input value={new_language_iso_code} onChange={(e) => setNewLanguageIsoCode(e.target.value)}/>
                        </div>
                        <Button className="my-3" onClick={() => HandleCreateNewLanguage()}>Confirm New Language</Button>
                    </div>
                </DialogContent>
            </Dialog>
        )
    }

    return (
        <div className="flex flex-col w-full h-[calc(100vh-76px)] overflow-auto rounded-t-md justify-center items-center">
            <ResizablePanelGroup direction="horizontal" className="rounded-lg border">
                <ResizablePanel defaultSize={30}>
                    <div className="flex flex-col mt-4 h-full w-full space-y-3 overflow-y-auto overflow-x-hidden max-h-full">
                        <Button variant={"secondary"} className="mx-3" onClick={() => setLanguage("Select a language")}>
                            Change Language
                        </Button>
                        <Button variant={"secondary"} className="mx-3" onClick={() => setManualUpdatePrompt(true)}>
                            Update Translation Data
                        </Button>
                        <Button variant={"secondary"} className="mx-3" onClick={() => HandleSaveTranslationData()}>
                            Save New Translation Data
                        </Button>
                        <p className="mx-3 text-sm text-zinc-500 text-center">
                            To view and edit previously translated texts, go{" "}
                            <a href="/saved_translations" className="underline cursor-pointer" style={{ color: "white" }}>
                                here
                            </a>.
                        </p>
                        <AlertDialog open={maunual_update_prompt} onOpenChange={setManualUpdatePrompt}>
                            <AlertDialogContent>
                                <div>
                                    <h1 className="text-2xl font-bold">Update Translation Data</h1>
                                    <p className="my-3 text-zinc-500">
                                        Updating translation data takes an API request to the Github server. This API has a rate limit of 60 requests per hour. 
                                        Please don't abuse this API. Only update translation data when necessary.\n\nKeep in mind that it is updated every 15 minutes automatically.
                                    </p>
                                    <div className="w-full grid grid-cols-2">
                                        <Button className="m-3" onClick={() => setManualUpdatePrompt(false)}>Cancel</Button>
                                        <Button variant={"destructive"} className="m-3" onClick={() => { setManualUpdatePrompt(false); ManualUpdate(); }}>
                                            Update
                                        </Button>
                                    </div>
                                </div>
                            </AlertDialogContent>
                        </AlertDialog>
                        <Separator orientation="horizontal" className="w-full bg-white" />
                        <div className="flex flex-col">
                            {translationData && translationData.length > 0 ? (
                                translationData.map((item, index) =>
                                    item.translation === "" ? (
                                        <div key={index}>
                                            <TooltipProvider>
                                                <Tooltip delayDuration={0}>
                                                    <TooltipTrigger asChild>
                                                        <Button
                                                            className="m-3 text-ellipsis"
                                                            variant={"ghost"}
                                                            onClick={() => setSelectedLanguageIndex(index)}
                                                        >
                                                            {item.key}
                                                        </Button>
                                                    </TooltipTrigger>
                                                    <TooltipContent>
                                                        <p>{item.en_value}</p>
                                                    </TooltipContent>
                                                </Tooltip>
                                            </TooltipProvider>
                                            <Separator orientation="horizontal" />
                                        </div>
                                    ) : null
                                )
                            ) : (
                                <p className="mx-3 mt-3 text-zinc-500">No untranslated text found.</p>
                            )}
                        </div>
                    </div>
                </ResizablePanel>
                <ResizableHandle withHandle />
                <ResizablePanel defaultSize={70}>
                    {selected_lannguage_index === -1 ? (
                        <div className="flex flex-col space-y-2 h-full items-center justify-center text-center">
                            <h1 className="text-2xl font-bold">Select Text to Translate</h1>
                            <p className="text-zinc-500">Select a key on the left sidebar to translate.</p>
                        </div>
                    ) : (
                        <div className="flex flex-col space-y-8 h-full items-center mt-4">
                            <h1 className="text-2xl font-bold">{translationData[selected_lannguage_index].key}</h1>
                            <div className="flex flex-row h-full w-full">
                                <div className="w-1/2 justify-start ml-6">
                                    {translationData[selected_lannguage_index].comment != null ? (
                                        <div className="h-full">
                                            <div className="h-1/2 flex flex-col space-y-2">
                                                <h1 className="text-xl font-bold">Comments:</h1>
                                                {translationData[selected_lannguage_index].comment.split('\n').map(
                                                    (comment_text: string, index: number) => (
                                                        <p key={index} className="text-zinc-500">{comment_text}</p>
                                                    )
                                                )}
                                            </div>
                                            <Separator orientation="horizontal" className="w-[calc(100%-2rem)]" />
                                            <div className="h-1/2 flex flex-col space-y-2 mt-4">
                                                <h1 className="text-xl font-bold">English Source:</h1>
                                                <p className="text-zinc-500">{translationData[selected_lannguage_index].en_value}</p>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="h-full flex flex-col space-y-2">
                                            <h1 className="text-xl font-bold">English Source:</h1>
                                            <p className="text-zinc-500">{translationData[selected_lannguage_index].en_value}</p>
                                        </div>
                                    )}
                                </div>
                                <Separator orientation="vertical" className="h-[calc(100%-2rem)]" />
                                <div className="w-1/2 justify-end ml-4">
                                    <h1 className="text-xl font-bold">Translate to {language}:</h1>
                                    <Textarea
                                        className="mt-4 w-[calc(100%-1rem)] h-[calc(100%-12rem)]"
                                        value={translationData[selected_lannguage_index].translation}
                                        onChange={(e) => {
                                            UpdateTranslations(translationData[selected_lannguage_index].key, e.target.value);
                                        }}
                                    />
                                    <p className="mt-2">
                                        WARNING: Translations are automatically saved in memory, they will be lost if the page is refreshed. In order to properly save your translations, hit the Save Translations button in the top left
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </ResizablePanel>
            </ResizablePanelGroup>
        </div>
    );    
}