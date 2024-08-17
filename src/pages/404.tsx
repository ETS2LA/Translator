import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/router";

export default function NotFound() {
    const { push } = useRouter();
    return (
        <div className="flex flex-col w-full h-[calc(100vh-76px)] overflow-auto rounded-t-md justify-center items-center">
            <Card className="flex flex-col items-center justify-center space-y-3 w-full h-screen">
                    <h1 className="text-4xl font-bold">404</h1>
                    <h3 className="text-xl font-bold">You shouldn't be here</h3>
                    <p className="text-zinc-600">Click the button below to return to the home screen.</p>
                    <Button onClick={() => push("/")}>Main Menu</Button>    
            </Card>
        </div>
    );
}