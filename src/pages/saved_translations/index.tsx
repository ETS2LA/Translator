import React from 'react'
import { Card } from '@/components/ui/card'

export default function SavedTranslations() {
    return (
        <div className="flex flex-col w-full h-[calc(100vh-76px)] overflow-auto rounded-t-md justify-center items-center">
            <Card className="flex flex-col items-center justify-center space-y-2 w-full h-screen">
                <h1 className="text-2xl font-bold">Under Construction</h1>
                <p className="text-zinc-600">This page is currently under construction. In the future, you will be able to edit translations here.</p>
            </Card>
        </div>
    )
}