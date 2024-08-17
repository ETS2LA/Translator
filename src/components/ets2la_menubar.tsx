"use client"
import { Menubar, MenubarCheckboxItem, MenubarContent, MenubarItem,
    MenubarMenu, MenubarRadioGroup, MenubarRadioItem, MenubarSeparator,
    MenubarShortcut, MenubarSub, MenubarSubContent, MenubarSubTrigger,
    MenubarTrigger } from "@/components/ui/menubar"
import { WindowAction} from "./webserver"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./ui/tooltip"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { useRouter } from 'next/navigation';
import { useState, useEffect } from "react";
import { useTheme } from "next-themes"
import { HiMiniLanguage, HiOutlineFolderOpen, HiOutlineComputerDesktop } from "react-icons/hi2";
import { X, Minimize2, Maximize } from "lucide-react"
import { FaMoon, FaSun, FaWindowMinimize } from "react-icons/fa6";
import { Button } from "./ui/button";
import { toast } from "sonner"

// @ts-ignore | Prevents module not found error from js-cookie, even though it is installed
import Cookies from 'js-cookie';

export function ETS2LAMenubar() {
    const { theme, setTheme } = useTheme()
    const { push } = useRouter()
    const [dragging, setDragging] = useState(false);
    const [windowPosition, setWindowPosition] = useState({ x: 0, y: 0 });
    const [lastMousePosition, setLastMousePosition] = useState({ x: 0, y: 0 });
    const [clickOffset, setClickOffset] = useState({ x: 0, y: 0 });

    const webserver_url = Cookies.get("webserver_url") ?? "http://localhost:8000";

    useEffect(() => {
        // Get the initial window position
        const initialWindowPosition = {
            x: window.screenX,
            y: window.screenY,
        };
        setWindowPosition(initialWindowPosition);
    }, []);

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (dragging) {
                const newX = windowPosition.x + (e.screenX - lastMousePosition.x);
                const newY = windowPosition.y + (e.screenY - lastMousePosition.y);
                setWindowPosition({ x: newX, y: newY });
                // @ts-ignore || pywebview._bridge is not defined
                window.pywebview._bridge.call('pywebviewMoveWindow', [newX, newY], "move");
                setLastMousePosition({ x: e.screenX, y: e.screenY });
            }
        };

        const handleMouseUp = () => {
            setDragging(false);
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };

        if (dragging) {
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
        }

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [dragging, windowPosition.x, windowPosition.y, lastMousePosition.x, lastMousePosition.y, clickOffset.x, clickOffset.y]);

    const handleMouseDown = (e: React.MouseEvent) => {
        if (e.target instanceof HTMLElement && e.target.classList.contains('pywebview-drag-region')) {
            e.preventDefault();
            setDragging(true);
            setLastMousePosition({
                x: e.screenX,
                y: e.screenY,
            });
            setClickOffset({
                x: e.clientX - e.target.getBoundingClientRect().left,
                y: e.clientY - e.target.getBoundingClientRect().top,
            });
        }
    };

    function HandleWindowAction(action : "minimize" | "maximize" | "exit") {
        toast.promise(
            new Promise<void>(async (resolve, reject) => {
                try {
                    WindowAction(webserver_url, action);
                    setTimeout(() => {
                        resolve();
                    }, 1000);
                } catch (error) {
                    reject(error);
                    console.log(error);
                }
            }),
            {
                loading: "Performing " + action.charAt(0).toUpperCase() + action.slice(1) + "...",
                success: "Action " + action.charAt(0).toUpperCase() + action.slice(1) + " performed!",
                error: "Failed to perform action: " + action.charAt(0).toUpperCase() + action.slice(1)
            }
        )
    }

    return (
        <div>
            <Menubar className="flex flex-row w-full justify-between pywebview-drag-region" onMouseDown={handleMouseDown}>
                <div className="flex flex-row">
                    <MenubarMenu>
                        <MenubarTrigger onClick={() => push("/")}>
                            <div className="flex h-6 flex-row items-center gap-2">
                                ETS2LA Translation
                            </div>
                        </MenubarTrigger>
                    </MenubarMenu>
                    <Separator orientation="vertical"/>
                    <MenubarMenu>
                        <MenubarTrigger onClick={() => push("/translations")}>
                            <div className="flex h-6 flex-row items-center gap-2">
                                <HiMiniLanguage className="h-5 w-5" /> Translations
                            </div>
                        </MenubarTrigger>
                    </MenubarMenu>
                    <MenubarMenu>
                        <MenubarTrigger onClick={() => push("/saved_translations")}>
                            <div className="flex flex-row gap-2 items-center">
                                <HiOutlineFolderOpen className="h-5 w-5" /> Saved Translations
                            </div>
                        </MenubarTrigger>
                    </MenubarMenu>
                    <MenubarMenu>
                        <MenubarTrigger>
                            <div className="flex flex-row gap-1 items-center">
                                {theme === "light" ? <FaSun className="w-4 h-4" /> : <FaMoon className="w-4 h-4" />}Theme    
                            </div>
                        </MenubarTrigger>
                        <MenubarContent>
                            <MenubarItem onClick={() => setTheme("light")}>
                                <div className="flex flex-row gap-2 items-center">
                                    <FaSun className="w-4 h-4"/>Light    
                                </div>
                            </MenubarItem>
                            <MenubarItem onClick={() => setTheme("dark")}>
                                <div className="flex flex-row gap-2 items-center">
                                    <FaMoon className="w-4 h-4"/>Dark    
                                </div>
                            </MenubarItem>
                            <MenubarItem onClick={() => setTheme("system")}>
                                <div className="flex flex-row gap-2 items-center">
                                    <HiOutlineComputerDesktop className="w-4 h-4"/>System    
                                </div>
                            </MenubarItem>
                        </MenubarContent>
                    </MenubarMenu>
                </div>
                <div className="flex flex-row">
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <div>
                                    <Button variant={"secondary"} className="h-[26px] w-5 rounded-r-none group" onClick={() => HandleWindowAction("maximize")}>
                                        <Maximize className="w-4 h-4 overflow-visible" />
                                    </Button>
                                </div>
                            </TooltipTrigger>
                            <TooltipContent>Maximize</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <div>
                                    <Button variant={"secondary"} className="h-[26px] w-5 rounded-none group" onClick={() => HandleWindowAction("minimize")}>
                                        <Minimize2 className="w-4 h-4 overflow-visible" />
                                    </Button>
                                </div>
                            </TooltipTrigger>
                            <TooltipContent>Minimize</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <div>
                                    <Button variant={"secondary"} className="h-[26px] w-5 rounded-l-none group" onClick={() => HandleWindowAction("exit")}>
                                        <X className="w-4 h-4 overflow-visible" />
                                    </Button>
                                </div>
                            </TooltipTrigger>
                            <TooltipContent>Exit</TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                </div>
            </Menubar>
        </div>
    )    
}
  